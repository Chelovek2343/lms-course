'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase';
import AppHeader from '../../../../components/AppHeader';
import BottomNav from '../../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

const pillSolid = {
    width: '100%',
    padding: '16px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};

export default function CreateUserPage() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            const { data: prof } = await supabase
                .from('profiles')
                .select('login, email, role')
                .eq('id', user.id)
                .single();

            if (!STAFF.includes(prof?.role)) {
                router.replace('/dashboard');
                return;
            }
            setProfile(prof);
        };
        init();
    }, []);

    const login = result?.login ?? '';
    const password = result?.password ?? '';

    const handleCreate = async () => {
        setError('');
        setResult(null);
        setCopied(false);
        setLoading(true);

        try {
            const res = await fetch('/api/admin/create-user', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не удалось создать аккаунт');
            } else {
                setResult(data);
            }
        } catch {
            setError('Не удалось связаться с сервером');
        }
        setLoading(false);
    };

    const copyCreds = async () => {
        if (!login || !password) return;

        try {
            await navigator.clipboard.writeText(`Логин: ${login}\nПароль: ${password}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Не удалось скопировать. Скопируйте данные вручную.');
        }
    };

    if (!profile)
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

    const initial = (profile.login || profile.email || '?').trim().charAt(0).toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push('/admin/users')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--accent-soft)',
                        fontSize: '14px',
                        fontWeight: '700',
                        fontFamily: 'var(--sans)',
                        cursor: 'pointer',
                        marginBottom: '26px',
                    }}
                >
                    ← Пользователи
                </button>

                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(32px, 8vw, 44px)',
                        lineHeight: '1.08',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '14px',
                    }}
                >
                    Новый{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        студент
                    </em>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '28px' }}>
                    Логин и пароль сгенерируются автоматически. Студенту сразу откроются все опубликованные курсы.
                </p>

                <button
                    onClick={handleCreate}
                    disabled={loading}
                    style={{ ...pillSolid, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                    {loading ? 'Создаю...' : result ? 'Создать ещё одного' : 'Создать аккаунт'}
                </button>

                {error && (
                    <p style={{ color: '#ff9b9b', fontSize: '14px', marginTop: '16px' }}>{error}</p>
                )}

                {result && (
                    <div
                        style={{
                            marginTop: '24px',
                            padding: '24px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid rgba(52,211,153,0.4)',
                        }}
                    >
                        <p style={{ color: '#6ee7b7', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>
                            ✅ Аккаунт создан
                        </p>

                        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginBottom: '4px' }}>Логин</p>
                        <p
                            style={{
                                fontFamily: 'monospace',
                                fontSize: '20px',
                                color: 'var(--text)',
                                marginBottom: '16px',
                                wordBreak: 'break-all',
                            }}
                        >
                            {login}
                        </p>

                        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginBottom: '4px' }}>Пароль</p>
                        <p
                            style={{
                                fontFamily: 'monospace',
                                fontSize: '20px',
                                color: 'var(--accent-soft)',
                                marginBottom: '18px',
                                wordBreak: 'break-all',
                            }}
                        >
                            {password}
                        </p>

                        {result.enrolled > 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '10px' }}>
                                📚 Открыт доступ к курсам: {result.enrolled}
                            </p>
                        )}
                        {result.enrollWarning && (
                            <p style={{ color: '#f5b84a', fontSize: '13.5px', marginBottom: '10px' }}>
                                ⚠️ {result.enrollWarning}
                            </p>
                        )}

                        <p style={{ color: '#f5b84a', fontSize: '13.5px', lineHeight: '1.5', marginBottom: '18px' }}>
                            ⚠️ Пароль показывается только один раз. Скопируйте его и отправьте студенту сейчас.
                        </p>

                        <button
                            onClick={copyCreds}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '999px',
                                background: 'transparent',
                                border: '1.5px solid rgba(111,163,224,0.5)',
                                color: 'var(--accent-soft)',
                                fontSize: '14.5px',
                                fontWeight: '700',
                                fontFamily: 'var(--sans)',
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? 'Скопировано ✓' : 'Скопировать логин и пароль'}
                        </button>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
