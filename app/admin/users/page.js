'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];
const INTERNAL_DOMAIN = '@lms.internal';

const ROLE_META = {
    owner: { label: '🔱 Owner', color: '#c084fc', border: 'rgba(192,132,252,0.4)', bg: 'rgba(168,85,247,0.1)' },
    superuser: { label: '👑 Superuser', color: '#f87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(239,68,68,0.1)' },
    admin: { label: '⚙️ Admin', color: '#f5b84a', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' },
    student: { label: '🎓 Студент', color: 'var(--accent-soft)', border: 'rgba(111,163,224,0.4)', bg: 'rgba(111,163,224,0.12)' },
};

const pillBase = {
    padding: '10px 18px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};
const pillSolid = { ...pillBase, background: 'var(--accent)', color: 'var(--bg)', border: 'none' };
const pillAmber = {
    ...pillBase,
    background: 'transparent',
    color: '#f5b84a',
    border: '1.5px solid rgba(245,158,11,0.5)',
};
const pillMuted = {
    ...pillBase,
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1.5px solid rgba(157,176,204,0.35)',
};
const pillDanger = {
    ...pillBase,
    background: 'transparent',
    color: '#fca5a5',
    border: '1.5px solid rgba(248,113,113,0.5)',
};

export default function AdminUsersPage() {
    const [me, setMe] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingOn, setActingOn] = useState(null);
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

            if (!profile || !STAFF.includes(profile.role)) {
                router.replace('/dashboard');
                return;
            }

            setMe(profile);
            loadUsers(profile.role);
        };
        init();
    }, []);

    const loadUsers = async (viewerRole) => {
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (viewerRole !== 'owner') {
            query = query.not('role', 'in', '(superuser,owner)');
        }

        const { data } = await query;
        setUsers(data || []);
        setLoading(false);
    };

    const displayName = (u) => u.login || u.email || '—';

    const toggleAdmin = async (u) => {
        const newRole = u.role === 'admin' ? 'student' : 'admin';
        setActingOn(u.id);
        const res = await fetch('/api/admin/update-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: u.id, newRole }),
        });
        const result = await res.json();
        if (!res.ok) alert(result.error || 'Ошибка');
        await loadUsers(me?.role);
        setActingOn(null);
    };

    const deleteUser = async (u) => {
        if (!window.confirm(`Удалить пользователя ${displayName(u)}? Это действие нельзя отменить.`)) return;
        setActingOn(u.id);
        const res = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: u.id }),
        });
        const result = await res.json();
        if (!res.ok) alert(result.error || 'Ошибка');
        await loadUsers(me?.role);
        setActingOn(null);
    };

    const canManage = (u) => {
        if (u.id === me?.id) return false;
        if (u.role === 'owner') return false;
        if (u.role === 'superuser' && me?.role !== 'owner') return false;
        if (me?.role === 'admin' && ['admin', 'superuser'].includes(u.role)) return false;
        return true;
    };

    if (loading || !me)
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

    const myInitial = displayName(me).trim().charAt(0).toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={myInitial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push('/dashboard')}
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
                    ← Панель
                </button>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '16px',
                        flexWrap: 'wrap',
                        marginBottom: '28px',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontFamily: 'var(--serif)',
                                fontWeight: '800',
                                fontSize: 'clamp(32px, 7vw, 46px)',
                                lineHeight: '1.08',
                                letterSpacing: '-1px',
                                color: 'var(--text)',
                                marginBottom: '8px',
                            }}
                        >
                            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                                Пользователи
                            </em>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Всего: {users.length}. Роли и доступ.
                        </p>
                    </div>
                    <button onClick={() => router.push('/admin/users/create')} style={{ ...pillSolid, padding: '13px 24px', fontSize: '14px' }}>
                        + Создать аккаунт
                    </button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '14px',
                    }}
                >
                    {users.map((u) => {
                        const meta = ROLE_META[u.role] || ROLE_META.student;
                        const realEmail = u.email && !u.email.endsWith(INTERNAL_DOMAIN) ? u.email : null;
                        const isMe = u.id === me.id;
                        const manageable = canManage(u);
                        const busy = actingOn === u.id;

                        return (
                            <article
                                key={u.id}
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '20px',
                                    padding: '18px 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    <span
                                        style={{
                                            flex: 'none',
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: '#1b3d6e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontFamily: 'var(--serif)',
                                            fontWeight: '700',
                                            fontSize: '18px',
                                            color: 'var(--text)',
                                        }}
                                    >
                                        {displayName(u).trim().charAt(0).toUpperCase()}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                            style={{
                                                color: 'var(--text)',
                                                fontWeight: '700',
                                                fontSize: '15px',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {displayName(u)}
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', wordBreak: 'break-word' }}>
                                            {realEmail || 'Вход по логину'} ·{' '}
                                            {new Date(u.created_at).toLocaleDateString('ru-RU')}
                                        </p>
                                    </div>
                                    <span
                                        style={{
                                            flex: 'none',
                                            padding: '4px 11px',
                                            borderRadius: '999px',
                                            background: meta.bg,
                                            border: `1px solid ${meta.border}`,
                                            color: meta.color,
                                            fontSize: '11.5px',
                                            fontWeight: '700',
                                        }}
                                    >
                                        {meta.label}
                                    </span>
                                </div>

                                {manageable && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => toggleAdmin(u)}
                                            disabled={busy}
                                            style={{
                                                ...(u.role === 'admin' ? pillMuted : pillAmber),
                                                opacity: busy ? 0.6 : 1,
                                            }}
                                        >
                                            {u.role === 'admin' ? 'Снять админку' : 'Сделать админом'}
                                        </button>
                                        <button
                                            onClick={() => deleteUser(u)}
                                            disabled={busy}
                                            style={{ ...pillDanger, opacity: busy ? 0.6 : 1 }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                )}

                                {!manageable && (
                                    <p style={{ color: 'var(--text-faint)', fontSize: '12.5px' }}>
                                        {isMe ? 'Это вы' : 'Защищённый аккаунт'}
                                    </p>
                                )}
                            </article>
                        );
                    })}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
