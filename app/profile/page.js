'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';

const MAX_WIDTH = 1180;
const INTERNAL_DOMAIN = '@lms.internal';

const ROLE_LABEL = {
    student: 'Студент',
    admin: 'Администратор',
    superuser: 'Суперпользователь',
    owner: 'Владелец',
};

const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    overflow: 'hidden',
};

const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '8px',
};

const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--input-bg)',
    border: '1.5px solid rgba(111,163,224,0.25)',
    borderRadius: '14px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    outline: 'none',
};

const solidBtn = (disabled) => ({
    width: '100%',
    padding: '16px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
});

function Msg({ m }) {
    if (!m) return null;
    return (
        <p
            style={{
                color: m.ok ? '#6ee7b7' : '#ff9b9b',
                fontSize: '13.5px',
                lineHeight: '1.5',
                marginTop: '12px',
            }}
        >
            {m.text}
        </p>
    );
}

function Row({ title, hint, open, onToggle, first, children }) {
    return (
        <div style={{ borderTop: first ? 'none' : '1px solid var(--border-soft)' }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '22px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--sans)',
                }}
            >
                <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: '700', fontSize: '17px', color: 'var(--text)' }}>
                        {title}
                    </span>
                    {hint && (
                        <span
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                marginTop: '3px',
                                color: 'var(--text-muted)',
                                wordBreak: 'break-word',
                            }}
                        >
                            {hint}
                        </span>
                    )}
                </span>
                <span
                    style={{
                        flex: 'none',
                        color: 'var(--accent-soft)',
                        fontSize: '24px',
                        transform: open ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                >
                    ›
                </span>
            </button>
            {open && <div style={{ padding: '0 24px 24px' }}>{children}</div>}
        </div>
    );
}

export default function ProfilePage() {
    const [authUser, setAuthUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(null);

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
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            router.replace('/login');
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

    const toggle = (name) => setOpen((cur) => (cur === name ? null : name));

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
            { emailRedirectTo: `${window.location.origin}/profile` },
        );

        if (error) {
            setEmailMsg({ ok: false, text: error.message });
        } else {
            setEmailMsg({
                ok: true,
                text: `✅ Отправили письмо на ${value}. Перейдите по ссылке из письма, чтобы подтвердить адрес.`,
            });
            setNewEmail('');
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) setAuthUser(user);
        }
        setEmailBusy(false);
    };

    if (loading)
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>Загрузка...</p>
            </div>
        );

    const hasRealEmail = !!authUser?.email && !authUser.email.endsWith(INTERNAL_DOMAIN);
    const pendingEmail = authUser?.new_email;
    const displayName = profile?.login || (profile?.email || '').split('@')[0] || 'Профиль';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const unchanged = newLogin.trim().toLowerCase() === (profile?.login || '');

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <style>{`
                .profile-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; }
                @media (min-width: 960px) {
                    .profile-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
                }
            `}</style>

            <AppHeader initial={initial} maxWidth={MAX_WIDTH} variant="logout" />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
                    Личный кабинет
                </p>
                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(40px, 9vw, 58px)',
                        lineHeight: '1.04',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '14px',
                    }}
                >
                    Профиль
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '30px' }}>
                    Данные аккаунта и настройки входа.
                </p>

                <div className="profile-grid">
                    {/* Левая колонка: кто вы и логин */}
                    <div>
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '24px' }}>
                                <div
                                    style={{
                                        flex: 'none',
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        background: '#1b3d6e',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--serif)',
                                        fontWeight: '700',
                                        fontSize: '30px',
                                        color: 'var(--text)',
                                    }}
                                >
                                    {initial}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p
                                        style={{
                                            fontFamily: 'var(--serif)',
                                            fontWeight: '700',
                                            fontSize: '22px',
                                            color: 'var(--text)',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {displayName}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
                                        {ROLE_LABEL[profile?.role] || 'Студент'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-soft)', padding: '24px' }}>
                                <label style={labelStyle}>Логин</label>
                                <input
                                    type="text"
                                    value={newLogin}
                                    onChange={(e) => setNewLogin(e.target.value)}
                                    autoComplete="username"
                                    style={inputStyle}
                                />
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px', lineHeight: '1.5' }}>
                                    Логин для входа на платформу: латиница, цифры, . _ -, от 3 до 30 символов.
                                </p>
                                <Msg m={loginMsg} />
                            </div>
                        </div>

                        <button
                            onClick={handleLoginChange}
                            disabled={loginBusy || unchanged || !newLogin.trim()}
                            style={{ ...solidBtn(loginBusy || unchanged || !newLogin.trim()), marginTop: '18px' }}
                        >
                            {loginBusy ? 'Сохраняю...' : 'Сохранить изменения'}
                        </button>
                    </div>

                    {/* Правая колонка: безопасность */}
                    <div style={cardStyle}>
                        <Row
                            first
                            title="Пароль и безопасность"
                            hint="Сменить пароль"
                            open={open === 'password'}
                            onToggle={() => toggle('password')}
                        >
                            <label style={labelStyle}>Текущий пароль</label>
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ ...inputStyle, marginBottom: '16px' }}
                            />
                            <label style={labelStyle}>
                                Новый пароль{' '}
                                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                                    (8+ символов, заглавная буква, цифра)
                                </span>
                            </label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ ...inputStyle, marginBottom: '16px' }}
                            />
                            <label style={labelStyle}>Повторите новый пароль</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                style={inputStyle}
                            />
                            <button
                                onClick={handlePasswordChange}
                                disabled={passBusy}
                                style={{ ...solidBtn(passBusy), marginTop: '20px' }}
                            >
                                {passBusy ? 'Сохраняю...' : 'Сменить пароль'}
                            </button>
                            <Msg m={passMsg} />
                        </Row>

                        <Row
                            title="Email для восстановления"
                            hint={hasRealEmail ? authUser.email : 'Не привязан'}
                            open={open === 'email'}
                            onToggle={() => toggle('email')}
                        >
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                                Email нужен, чтобы восстановить пароль, если вы его забудете. Мы отправим письмо со ссылкой подтверждения.
                            </p>
                            {pendingEmail && (
                                <p style={{ color: '#f5b84a', fontSize: '13.5px', marginBottom: '14px' }}>
                                    ⏳ Ожидает подтверждения: {pendingEmail}
                                </p>
                            )}
                            <label style={labelStyle}>{hasRealEmail ? 'Новый email' : 'Ваш email'}</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                style={inputStyle}
                            />
                            <button
                                onClick={handleEmailLink}
                                disabled={emailBusy}
                                style={{ ...solidBtn(emailBusy), marginTop: '20px' }}
                            >
                                {emailBusy ? 'Отправляю...' : 'Отправить письмо подтверждения'}
                            </button>
                            <Msg m={emailMsg} />
                        </Row>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
