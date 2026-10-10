'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { COMMUNITY_CHATS } from '../../lib/config';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';

const MAX_WIDTH = 1180;

export default function CommunityPage() {
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
            const { data: prof } = await supabase
                .from('profiles')
                .select('login, email')
                .eq('id', user.id)
                .single();
            setProfile(prof || {});
        };
        init();
    }, []);

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

    const displayName = profile.login || profile.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const chats = COMMUNITY_CHATS.filter((c) => c.url);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
                    Личный кабинет
                </p>
                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(36px, 8vw, 52px)',
                        lineHeight: '1.06',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '16px',
                    }}
                >
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        Сообщество
                    </em>{' '}
                    студентов
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '48ch', marginBottom: '32px' }}>
                    Общайтесь с единомышленниками, делитесь опытом и получайте помощь по поступлению.
                </p>

                {chats.length === 0 ? (
                    <div
                        style={{
                            padding: '28px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Чаты сообщества скоро появятся.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        {chats.map((c) => (
                            <article
                                key={c.title}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '22px',
                                    padding: '22px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <h3
                                        style={{
                                            fontFamily: 'var(--serif)',
                                            fontWeight: '700',
                                            fontSize: '22px',
                                            color: 'var(--text)',
                                        }}
                                    >
                                        {c.title}
                                    </h3>
                                    <span
                                        style={{
                                            flex: 'none',
                                            padding: '5px 12px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            background: 'rgba(52,211,153,0.16)',
                                            color: '#6ee7b7',
                                        }}
                                    >
                                        Доступ открыт
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.55' }}>
                                    {c.description}
                                </p>
                                <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        marginTop: 'auto',
                                        display: 'block',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        padding: '15px',
                                        borderRadius: '999px',
                                        background: 'var(--accent)',
                                        color: 'var(--bg)',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                    }}
                                >
                                    ✈️ Перейти в Telegram-чат
                                </a>
                            </article>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}