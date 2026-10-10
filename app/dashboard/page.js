'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

const ACTIONS = [
    { title: 'Управление курсами', desc: 'Курсы, уроки, видео и презентации', href: '/admin/courses', icon: '📚' },
    { title: 'Пользователи', desc: 'Роли, доступ и удаление аккаунтов', href: '/admin/users', icon: '👥' },
    { title: 'Создать аккаунт', desc: 'Логин и пароль для нового студента', href: '/admin/users/create', icon: '➕' },
        { title: 'Документы студентов', desc: 'Проверка документов и список нужных', href: '/admin/documents', icon: '📄' },
];

const roleBadge = (role) => {
    if (role === 'owner') {
        return { color: '#c084fc', border: 'rgba(192,132,252,0.4)', bg: 'rgba(168,85,247,0.1)', label: '🔱 Owner' };
    }
    if (role === 'superuser') {
        return { color: '#f87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(239,68,68,0.1)', label: '👑 Superuser' };
    }
    return { color: '#f5b84a', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)', label: '⚙️ Admin' };
};

export default function DashboardPage() {
    const [profile, setProfile] = useState(null);
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

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // студентов отправляем в каталог
            if (!STAFF.includes(profile?.role)) {
                router.replace('/courses');
                return;
            }

            setProfile(profile);
        };

        init();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
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
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>
                    Загрузка...
                </p>
            </div>
        );

    const displayName = profile.login || profile.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const badge = roleBadge(profile.role);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px' }}>
                        Админ-панель
                    </p>
                    <span
                        style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            fontSize: '11px',
                            fontWeight: '700',
                        }}
                    >
                        {badge.label}
                    </span>
                </div>

                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(36px, 9vw, 52px)',
                        lineHeight: '1.06',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '16px',
                        maxWidth: '14ch',
                    }}
                >
                    Рабочее{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        пространство
                    </em>
                </h1>

                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '42ch', marginBottom: '32px' }}>
                    Курсы, пользователи и доступ студентов платформы.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {ACTIONS.map((a) => (
                        <button
                            key={a.href}
                            onClick={() => router.push(a.href)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '20px 22px',
                                borderRadius: '22px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontFamily: 'var(--sans)',
                            }}
                        >
                            <span
                                style={{
                                    flex: 'none',
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '14px',
                                    background: 'rgba(111,163,224,0.14)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                }}
                            >
                                {a.icon}
                            </span>
                            <span style={{ flex: 1 }}>
                                <span
                                    style={{
                                        display: 'block',
                                        fontFamily: 'var(--serif)',
                                        fontWeight: '700',
                                        fontSize: '19px',
                                        color: 'var(--text)',
                                        marginBottom: '3px',
                                    }}
                                >
                                    {a.title}
                                </span>
                                <span style={{ display: 'block', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                                    {a.desc}
                                </span>
                            </span>
                            <span style={{ flex: 'none', color: 'var(--text-faint)', fontSize: '22px' }}>›</span>
                        </button>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-faint)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontFamily: 'var(--sans)',
                        }}
                    >
                        Выйти из аккаунта
                    </button>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
