'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

const INTERNAL_DOMAIN = '@lms.internal';

const card = {
    background: '#111827',
    border: '1px solid #1e2433',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
};
const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#0a0e1a',
    border: '1px solid #1e2433',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '10px',
};
const labelStyle = {
    color: '#64748b',
    fontSize: '12px',
    display: 'block',
    marginBottom: '6px',
};
const btnStyle = (busy) => ({
    width: '100%',
    padding: '12px',
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.3)',
    borderRadius: '8px',
    color: '#00e5ff',
    cursor: busy ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    opacity: busy ? 0.6 : 1,
});

function Msg({ m }) {
    if (!m) return null;
    return (
        <p style={{ color: m.ok ? '#10b981' : '#ef4444', fontSize: '13px', marginTop: '10px' }}>
            {m.text}
        </p>
    );
}

export default function ProfilePage() {
    const [authUser, setAuthUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [newLogin, setNewLogin] = useState('');
    const [loginMsg, setLoginMsg] = useState(null);
    const [loginBusy, setLoginBusy] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [passMsg, setPassMsg] = useState(null);
    const [passBusy, setPassBusy] = useState(false);

    const [newEmail, setNewEmail] = useState('');
    const [emailMsg, setEmailMsg] = useState(null);
    const [emailBusy, setEmailBusy] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setAuthUser(user);

        const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(prof);
        setNewLogin(prof?.login || '');
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleLoginChange = async () => {
        setLoginMsg(null);
        if (!newLogin.trim()) return;
        setLoginBusy(true);

        const res = await fetch('/api/profile/update-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: newLogin }),
        });
        const data = await res.json();

        if (!res.ok) {
            setLoginMsg({ ok: false, text: data.error || 'Не удалось изменить логин' });
        } else {
            setProfile((p) => ({ ...p, login: data.login }));
            setNewLogin(data.login);
            setLoginMsg({ ok: true, text: '✅ Логин изменён' });
        }
        setLoginBusy(false);
    };

    const handlePasswordChange = async () => {
        setPassMsg(null);

        if (!currentPassword) {
            setPassMsg({ ok: false, text: 'Введите текущий пароль' });
            return;
        }
        if (newPassword.length < 8) {
            setPassMsg({ ok: false, text: 'Новый пароль: минимум 8 символов' });
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setPassMsg({ ok: false, text: 'Добавьте хотя бы одну заглавную букву' });
            return;
        }
        if (!/[0-9]/.test(newPassword)) {
            setPassMsg({ ok: false, text: 'Добавьте хотя бы одну цифру' });
            return;
        }
        if (newPassword !== repeatPassword) {
            setPassMsg({ ok: false, text: 'Пароли не совпадают' });
            return;
        }

        setPassBusy(true);

        // проверяем текущий пароль
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: currentPassword,
        });
        if (verifyError) {
            setPassMsg({ ok: false, text: 'Текущий пароль неверный' });
            setPassBusy(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPassMsg({ ok: false, text: error.message });
        } else {
            setPassMsg({ ok: true, text: '✅ Пароль изменён' });
            setCurrentPassword('');
            setNewPassword('');
            setRepeatPassword('');
        }
        setPassBusy(false);
    };

    const handleEmailLink = async () => {
        setEmailMsg(null);
        const value = newEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailMsg({ ok: false, text: 'Введите корректный email' });
            return;
        }
        if (value.toLowerCase().endsWith(INTERNAL_DOMAIN)) {
            setEmailMsg({ ok: false, text: 'Укажите настоящий email' });
            return;
        }
        setEmailBusy(true);

        const { error } = await supabase.auth.updateUser(
            { email: value },
            { emailRedirectTo: `${window.location.origin}/profile` }
        );

        if (error) {
            setEmailMsg({ ok: false, text: error.message });
        } else {
            setEmailMsg({
                ok: true,
                text: `✅ Отправили письмо на ${value}. Перейдите по ссылке из письма, чтобы подтвердить адрес.`,
            });
            setNewEmail('');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setAuthUser(user);
        }
        setEmailBusy(false);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#64748b', fontFamily: 'monospace' }}>Загрузка...</p>
            </div>
        );
    }

    const hasRealEmail = !!authUser?.email && !authUser.email.endsWith(INTERNAL_DOMAIN);
    const pendingEmail = authUser?.new_email;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'monospace', padding: '20px' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,22px)' }}>👤 Профиль</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #1e2433', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
                    >
                        ← Dashboard
                    </button>
                </div>

                {/* Текущие данные */}
                <div style={card}>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Логин</p>
                    <p style={{ color: '#fff', fontSize: '14px', marginBottom: '14px' }}>
                        {profile?.login || '—'}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Email</p>
                    <p style={{ color: hasRealEmail ? '#10b981' : '#f59e0b', fontSize: '14px' }}>
                        {hasRealEmail ? `${authUser.email} ✓` : 'не привязан'}
                    </p>
                    {pendingEmail && (
                        <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '8px' }}>
                            ⏳ Ожидает подтверждения: {pendingEmail}
                        </p>
                    )}
                </div>

                {/* Смена логина */}
                <div style={card}>
                    <h2 style={{ color: '#fff', fontSize: '15px', marginBottom: '14px' }}>Сменить логин</h2>
                    <label style={labelStyle}>Новый логин (латиница, цифры, . _ -, от 3 до 30 символов)</label>
                    <input
                        type="text"
                        value={newLogin}
                        onChange={(e) => setNewLogin(e.target.value)}
                        style={inputStyle}
                    />
                    <button onClick={handleLoginChange} disabled={loginBusy} style={btnStyle(loginBusy)}>
                        {loginBusy ? 'Сохраняю...' : 'Сохранить логин'}
                    </button>
                    <Msg m={loginMsg} />
                </div>

                {/* Смена пароля */}
                <div style={card}>
                    <h2 style={{ color: '#fff', fontSize: '15px', marginBottom: '14px' }}>Сменить пароль</h2>
                    <label style={labelStyle}>Текущий пароль</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <label style={labelStyle}>Новый пароль (8+ символов, заглавная буква, цифра)</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <label style={labelStyle}>Повторите новый пароль</label>
                    <input
                        type="password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <button onClick={handlePasswordChange} disabled={passBusy} style={btnStyle(passBusy)}>
                        {passBusy ? 'Сохраняю...' : 'Сменить пароль'}
                    </button>
                    <Msg m={passMsg} />
                </div>

                {/* Привязка email */}
                <div style={card}>
                    <h2 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>
                        {hasRealEmail ? 'Сменить email' : 'Привязать email'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '14px', lineHeight: '1.6' }}>
                        Email нужен, чтобы восстановить пароль, если вы его забудете. Мы отправим письмо со ссылкой подтверждения.
                    </p>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        style={inputStyle}
                    />
                    <button onClick={handleEmailLink} disabled={emailBusy} style={btnStyle(emailBusy)}>
                        {emailBusy ? 'Отправляю...' : 'Отправить письмо подтверждения'}
                    </button>
                    <Msg m={emailMsg} />
                </div>
            </div>
        </div>
    );
}