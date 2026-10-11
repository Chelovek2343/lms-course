'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase';
import Logo from './Logo';

export default function AppHeader({ initial = '?', maxWidth = 720, variant = 'avatar' }) {
    const router = useRouter();

    const logout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(10,10,10,0.86)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-soft)',
            }}
        >
            <div
                style={{
                    maxWidth,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                }}
            >
                <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }}>
                    <Logo height={28} maxWidth={150} />
                </div>

                {variant === 'logout' ? (
                    <button
                        onClick={logout}
                        style={{
                            padding: '9px 18px',
                            borderRadius: '999px',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            background: 'transparent',
                            color: 'var(--text)',
                            fontSize: '14px',
                            fontWeight: '700',
                            fontFamily: 'var(--sans)',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        Выйти
                    </button>
                ) : (
                    <button
                        onClick={() => router.push('/profile')}
                        aria-label="Профиль"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#1b3d6e',
                            border: 'none',
                            color: 'var(--text)',
                            fontFamily: 'var(--serif)',
                            fontWeight: '700',
                            fontSize: '16px',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        {initial}
                    </button>
                )}
            </div>
        </header>
    );
}
