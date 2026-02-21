'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        users: 0,
        courses: 0,
        enrollments: 0,
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            setProfile(profile);

            // Статистика
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: coursesCount } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true });

            const { count: enrollmentsCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true });

            setStats({
                users: usersCount || 0,
                courses: coursesCount || 0,
                enrollments: enrollmentsCount || 0,
            });

            // Пользователи
            const { data: users } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            setUsers(users || []);
            setLoading(false);
        };
        init();
    }, []);

    const changeRole = async (userId, newRole) => {
        if (!profile.is_super_admin) {
            alert('Только супер-админ может менять роли!');
            return;
        }

        await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
    };

    const deleteUser = async (userId) => {
        if (!profile.is_super_admin) {
            alert('Только супер-админ может удалять пользователей!');
            return;
        }

        if (!confirm('Ты уверен? Это действие нельзя отменить!')) return;

        const res = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        const { error } = await res.json();
        if (error) {
            alert('Ошибка: ' + error);
            return;
        }

        setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const stat = (icon, label, value, color) => ({
        icon,
        label,
        value,
        color,
    });

    const statCards = [
        stat('👤', 'Пользователей', stats.users, '#00e5ff'),
        stat('📚', 'Курсов', stats.courses, '#7c3aed'),
        stat('🎓', 'Записей на курсы', stats.enrollments, '#10b981'),
    ];

    if (loading)
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

    return (
  <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'monospace', padding: '20px' }}>
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '30px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(18px, 4vw, 24px)', marginBottom: '4px' }}>⚙️ Админ панель</h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Управление платформой</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/admin/courses')} style={{
            padding: '8px 14px', background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px',
            color: '#f59e0b', cursor: 'pointer', fontSize: '12px'
          }}>
            📚 Курсы
          </button>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '8px 14px', background: 'transparent',
            border: '1px solid #1e2433', borderRadius: '8px',
            color: '#fff', cursor: 'pointer', fontSize: '12px'
          }}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', marginBottom: '30px'
      }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: '#111827', border: '1px solid #1e2433',
            borderRadius: '12px', padding: '16px',
            borderTop: `2px solid ${card.color}`
          }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ color: card.color, fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: '700', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Пользователи */}
      <div style={{
        background: '#111827', border: '1px solid #1e2433',
        borderRadius: '12px', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2433' }}>
          <h2 style={{ color: '#fff', fontSize: '15px' }}>👥 Пользователи</h2>
        </div>

        {users.map(u => (
          <div key={u.id} style={{
            padding: '14px 20px', borderBottom: '1px solid #0d1117',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px'
          }}>
            <div>
              <p style={{ color: '#fff', fontSize: '13px', marginBottom: '2px' }}>{u.email}</p>
              <p style={{ color: '#64748b', fontSize: '11px' }}>
                {new Date(u.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(0,229,255,0.1)',
                color: u.role === 'admin' ? '#f59e0b' : '#00e5ff',
                border: `1px solid ${u.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(0,229,255,0.3)'}`
              }}>
                {u.role === 'admin' ? '⚙️ Admin' : '🎓 Student'}
              </span>

              {u.id !== profile.id && profile.is_super_admin && (
                <>
                  <button
                    onClick={() => changeRole(u.id, u.role === 'admin' ? 'student' : 'admin')}
                    style={{
                      padding: '6px 10px', background: 'transparent',
                      border: '1px solid #1e2433', borderRadius: '6px',
                      color: '#64748b', cursor: 'pointer', fontSize: '11px'
                    }}
                  >
                    {u.role === 'admin' ? 'В студенты' : 'В админы'}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{
                      padding: '6px 10px', background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                      color: '#ef4444', cursor: 'pointer', fontSize: '11px'
                    }}
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>
)
}
