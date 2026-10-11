'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];
const INTERNAL_DOMAIN = '@lms.internal';
const ROLE_ORDER = { owner: 0, superuser: 1, admin: 2, student: 3 };

const ROLE_META = {
    owner: { label: '🔱 Owner', color: '#c084fc', border: 'rgba(192,132,252,0.4)', bg: 'rgba(168,85,247,0.1)' },
    superuser: { label: '👑 Superuser', color: '#f87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(239,68,68,0.1)' },
    admin: { label: '⚙️ Admin', color: '#f5b84a', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' },
    student: { label: '🎓 Студент', color: '#9cc0f0', border: 'rgba(111,163,224,0.4)', bg: 'rgba(111,163,224,0.12)' },
};

const pillBase = {
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '12.5px',
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
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
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
        let q = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (viewerRole !== 'owner') {
            q = q.not('role', 'in', '(superuser,owner)');
        }

        const { data } = await q;
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

    // сотрудники сверху, внутри группы новые выше
    const sorted = [...users].sort((a, b) => {
        const ra = ROLE_ORDER[a.role] ?? 3;
        const rb = ROLE_ORDER[b.role] ?? 3;
        if (ra !== rb) return ra - rb;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const counts = {
        all: users.length,
        students: users.filter((u) => u.role === 'student').length,
        staff: users.filter((u) => u.role !== 'student').length,
    };

    const q = query.trim().toLowerCase();
    const visible = sorted.filter((u) => {
        if (filter === 'students' && u.role !== 'student') return false;
        if (filter === 'staff' && u.role === 'student') return false;
        if (!q) return true;
        return (
            (u.login || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        );
    });

    const FILTERS = [
        { id: 'all', label: 'Все' },
        { id: 'students', label: 'Студенты' },
        { id: 'staff', label: 'Администрация' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <style>{`
                .ul-head, .ul-row {
                    display: grid;
                    grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.8fr) 150px 100px 260px;
                    gap: 16px;
                    align-items: center;
                }
                .ul-head {
                    padding: 0 20px 12px;
                    color: var(--text-faint);
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .ul-row { padding: 14px 20px; border-top: 1px solid var(--border-soft); }
                .ul-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
                .ul-date-inline { display: none; }
                @media (max-width: 900px) {
                    .ul-head { display: none; }
                    .ul-row {
                        grid-template-columns: minmax(0, 1fr) auto;
                        row-gap: 10px;
                        column-gap: 12px;
                        padding: 16px;
                    }
                    .ul-contact { grid-column: 1 / -1; grid-row: 2; }
                    .ul-date { display: none; }
                    .ul-date-inline { display: inline; }
                    .ul-actions { grid-column: 1 / -1; grid-row: 3; justify-content: flex-start; }
                }
            `}</style>

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
                        marginBottom: '24px',
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
                                marginBottom: '8px',
                            }}
                        >
                            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                                Пользователи
                            </em>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Роли и доступ. Всего: {users.length}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/users/create')}
                        style={{ ...pillSolid, padding: '13px 24px', fontSize: '14px' }}
                    >
                        + Создать аккаунт
                    </button>
                </div>

                {/* Поиск и фильтры */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
                    <input
                        type="text"
                        placeholder="Поиск по логину или email"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            flex: '1 1 260px',
                            maxWidth: '420px',
                            padding: '12px 16px',
                            background: 'var(--input-bg)',
                            border: '1.5px solid rgba(111,163,224,0.25)',
                            borderRadius: '999px',
                            color: 'var(--text)',
                            fontSize: '14px',
                            fontFamily: 'var(--sans)',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {FILTERS.map((f) => {
                            const active = filter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    style={{
                                        ...pillBase,
                                        padding: '10px 16px',
                                        background: active ? 'var(--accent)' : 'transparent',
                                        color: active ? 'var(--bg)' : 'var(--text)',
                                        border: active
                                            ? '1.5px solid var(--accent)'
                                            : '1.5px solid rgba(111,163,224,0.4)',
                                    }}
                                >
                                    {f.label} ({counts[f.id]})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Список */}
                <div className="ul-head">
                    <span>Пользователь</span>
                    <span>Контакт</span>
                    <span>Роль</span>
                    <span>Создан</span>
                    <span />
                </div>

                <div
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '22px',
                        overflow: 'hidden',
                    }}
                >
                    {visible.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', padding: '24px 20px' }}>
                            Никого не найдено.
                        </p>
                    )}

                    {visible.map((u, i) => {
                        const meta = ROLE_META[u.role] || ROLE_META.student;
                        const realEmail = u.email && !u.email.endsWith(INTERNAL_DOMAIN) ? u.email : null;
                        const isMe = u.id === me.id;
                        const manageable = canManage(u);
                        const busy = actingOn === u.id;
                        const date = new Date(u.created_at).toLocaleDateString('ru-RU');

                        return (
                            <div
                                key={u.id}
                                className="ul-row"
                                style={i === 0 ? { borderTop: 'none' } : undefined}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    <span
                                        style={{
                                            flex: 'none',
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '50%',
                                            background: '#1b3d6e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontFamily: 'var(--serif)',
                                            fontWeight: '700',
                                            fontSize: '16px',
                                            color: 'var(--text)',
                                        }}
                                    >
                                        {displayName(u).trim().charAt(0).toUpperCase()}
                                    </span>
                                    <span style={{ minWidth: 0 }}>
                                        <span
                                            style={{
                                                display: 'block',
                                                color: 'var(--text)',
                                                fontWeight: '700',
                                                fontSize: '15px',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {displayName(u)}
                                            {isMe && (
                                                <span
                                                    style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 8px',
                                                        borderRadius: '999px',
                                                        background: 'rgba(255,255,255,0.08)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                    }}
                                                >
                                                    это вы
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                </div>

                                <div
                                    className="ul-contact"
                                    style={{ color: 'var(--text-muted)', fontSize: '13.5px', wordBreak: 'break-word', minWidth: 0 }}
                                >
                                    {realEmail || 'Вход по логину'}
                                    <span className="ul-date-inline"> · {date}</span>
                                </div>

                                <div>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '4px 11px',
                                            borderRadius: '999px',
                                            background: meta.bg,
                                            border: `1px solid ${meta.border}`,
                                            color: meta.color,
                                            fontSize: '11.5px',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {meta.label}
                                    </span>
                                </div>

                                <div className="ul-date" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                    {date}
                                </div>

                                <div className="ul-actions">
                                    {manageable ? (
                                        <>
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
                                        </>
                                    ) : (
                                        !isMe && (
                                            <span style={{ color: 'var(--text-faint)', fontSize: '12.5px' }}>
                                                Защищённый аккаунт
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
