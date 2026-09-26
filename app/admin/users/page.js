'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const [me, setMe] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingOn, setActingOn] = useState(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile || !['admin', 'superuser'].includes(profile.role)) {
                router.push('/dashboard');
                return;
            }

            setMe(profile);
            loadUsers();
        };
        init();
    }, []);

    const loadUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*'),
            .neq('role', 'superuser')
            .order('created_at', { ascending: false });
        setUsers(data || []);
        setLoading(false);
    };

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
        await loadUsers();
        setActingOn(null);
    };

    const deleteUser = async (u) => {
        if (!confirm(`Удалить пользователя ${u.email}?`)) return;
        setActingOn(u.id);
        const res = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: u.id }),
        });
        const result = await res.json();
        if (!res.ok) alert(result.error || 'Ошибка');
        await loadUsers();
        setActingOn(null);
    };

    const roleLabel = (role) => {
        if (role === 'superuser') return '👑 Superuser';
        if (role === 'admin') return '⚙️ Admin';
        return '🎓 Student';
    };

    const canManage = (u) => {
        if (u.role === 'superuser') return false;
        if (u.id === me?.id) return false;
        if (me?.role === 'admin' && u.role === 'admin') return false;
        return true;
    };

    if (loading || !me) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#64748b', fontFamily: 'monospace' }}>Загрузка...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'monospace', padding: '20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,24px)', marginBottom: '4px' }}>👥 Пользователи</h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Управление ролями и доступом</p>
                    </div>
                    <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #1e2433', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                        ← Dashboard
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {users.map((u) => (
                        <div key={u.id} style={{ background: '#111827', border: '1px solid #1e2433', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <p style={{ color: '#fff', fontSize: '14px', marginBottom: '4px' }}>{u.email}</p>
                                <span style={{ color: '#64748b', fontSize: '12px' }}>{roleLabel(u.role)}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {canManage(u) && (
                                    <>
                                        <button
                                            onClick={() => toggleAdmin(u)}
                                            disabled={actingOn === u.id}
                                            style={{
                                                padding: '8px 14px',
                                                background: u.role === 'admin' ? 'transparent' : 'rgba(245,158,11,0.1)',
                                                border: `1px solid ${u.role === 'admin' ? '#1e2433' : 'rgba(245,158,11,0.3)'}`,
                                                borderRadius: '6px',
                                                color: u.role === 'admin' ? '#64748b' : '#f59e0b',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {u.role === 'admin' ? 'Снять админку' : 'Сделать админом'}
                                        </button>
                                        <button
                                            onClick={() => deleteUser(u)}
                                            disabled={actingOn === u.id}
                                            style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                        >
                                            Удалить
                                        </button>
                                    </>
                                )}
                                {u.role === 'superuser' && (
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>Защищённый аккаунт</span>
                                )}
                                {u.id === me.id && u.role !== 'superuser' && (
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>Это вы</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
