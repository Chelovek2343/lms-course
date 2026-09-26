'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profile);
        };

        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!user || !profile)
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: '#0a0e1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <p style={{ color: '#64748b', fontFamily: 'monospace' }}>
                    Загрузка...
                </p>
            </div>
        );

    const isStaff = ['admin', 'superuser'].includes(profile.role);

    const roleBadge = () => {
        if (profile.role === 'superuser') {
            return { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', color: '#ef4444', label: '👑 Superuser' };
        }
        if (profile.role === 'admin') {
            return { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', color: '#f59e0b', label: '⚙️ Admin' };
        }
        return { bg: 'rgba(0,229,255,0.1)', border: '#00e5ff', color: '#00e5ff', label: '🎓 Student' };
    };
    const badge = roleBadge();

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0e1a',
                fontFamily: 'monospace',
                padding: '20px',
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '30px',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: '#fff',
                                fontSize: 'clamp(18px, 4vw, 24px)',
                                marginBottom: '4px',
                            }}
                        >
                            Добро пожаловать!
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>
                            {profile.email}
                        </p>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                padding: '6px 14px',
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                borderRadius: '6px',
                                color: badge.color,
                                fontSize: '12px',
                                fontWeight: '600',
                            }}
                        >
                            {badge.label}
                        </span>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                {isStaff && (
                    <div
                        style={{
                            background: 'rgba(245,158,11,0.05)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                        }}
                    >
                        <h2
                            style={{
                                color: '#f59e0b',
                                fontSize: '15px',
                                marginBottom: '12px',
                            }}
                        >
                            ⚙️ Админ-панель
                        </h2>
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                onClick={() => router.push('/admin/courses')}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(245,158,11,0.1)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: '8px',
                                    color: '#f59e0b',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                📚 Управление курсами
                            </button>
                            <button
                                onClick={() => router.push('/admin/users')}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                👥 Пользователи
                            </button>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        background: '#111827',
                        border: '1px solid #1e2433',
                        borderRadius: '12px',
                        padding: '20px',
                    }}
                >
                    <p
                        style={{
                            color: '#64748b',
                            fontSize: '13px',
                            marginBottom: '12px',
                        }}
                    >
                        Твои курсы:
                    </p>
                    <button
                        onClick={() => router.push('/courses')}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            background: 'rgba(0,229,255,0.05)',
                            border: '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '8px',
                            color: '#00e5ff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'left',
                        }}
                    >
                        📚 Перейти в каталог курсов →
                    </button>
                </div>
            </div>
        </div>
    );
}
