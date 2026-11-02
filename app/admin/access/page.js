'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];
const INTERNAL_DOMAIN = '@lms.internal';

const pillBase = {
    padding: '9px 16px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};

const fullName = (s) =>
    [s.last_name, s.first_name].filter(Boolean).join(' ') || s.login || s.email || '—';

export default function AdminAccessPage() {
    const [me, setMe] = useState(null);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [access, setAccess] = useState({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [busyKey, setBusyKey] = useState(null);
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
            setMe(prof);

            const [studentsRes, coursesRes, enrRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, login, email, contact_email, phone, last_name, first_name, created_at')
                    .eq('role', 'student')
                    .order('created_at', { ascending: false }),
                supabase.from('courses').select('id, title, is_published').order('created_at'),
                supabase.from('enrollments').select('user_id, course_id'),
            ]);

            const map = {};
            (enrRes.data || []).forEach((e) => {
                if (!map[e.user_id]) map[e.user_id] = new Set();
                map[e.user_id].add(e.course_id);
            });

            setStudents(studentsRes.data || []);
            setCourses(coursesRes.data || []);
            setAccess(map);
            setLoading(false);
        };
        init();
    }, []);

    const setEnroll = async (userId, courseId, enroll) => {
        const key = `${userId}:${courseId}`;
        setBusyKey(key);
        let ok = false;
        try {
            const res = await fetch('/api/admin/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId, enroll }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error || 'Ошибка');
            } else {
                ok = true;
                setAccess((prev) => {
                    const next = { ...prev };
                    const set = new Set(next[userId] || []);
                    if (enroll) set.add(courseId);
                    else set.delete(courseId);
                    next[userId] = set;
                    return next;
                });
            }
        } catch {
            alert('Не удалось связаться с сервером');
        }
        setBusyKey(null);
        return ok;
    };

    const grantAll = async (student) => {
        const missing = courses.filter((c) => !access[student.id]?.has(c.id));
        for (const c of missing) {
            const ok = await setEnroll(student.id, c.id, true);
            if (!ok) break;
        }
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

    const initial = (me.login || me.email || '?').trim().charAt(0).toUpperCase();
    const noAccessCount = students.filter((s) => !(access[s.id]?.size > 0)).length;

    const q = query.trim().toLowerCase();
    const visible = students.filter((s) => {
        if (filter === 'none' && access[s.id]?.size > 0) return false;
        if (!q) return true;
        return [fullName(s), s.login, s.email, s.contact_email, s.phone]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q));
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

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
                    Доступ к{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        курсам
                    </em>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>
                    Нажмите на курс, чтобы открыть или закрыть его студенту. Без доступа: {noAccessCount}.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или телефону"
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
                    {[
                        { id: 'all', label: `Все (${students.length})` },
                        { id: 'none', label: `Без доступа (${noAccessCount})` },
                    ].map((f) => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                style={{
                                    ...pillBase,
                                    background: active ? 'var(--accent)' : 'transparent',
                                    color: active ? 'var(--bg)' : 'var(--text)',
                                    border: active ? '1.5px solid var(--accent)' : '1.5px solid rgba(111,163,224,0.4)',
                                }}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {courses.length === 0 && (
                    <p style={{ color: '#f5b84a', fontSize: '14px', marginBottom: '16px' }}>
                        Курсов пока нет. Создайте курс в разделе «Управление курсами».
                    </p>
                )}

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

                    {visible.map((s, i) => {
                        const set = access[s.id] || new Set();
                        const email =
                            s.contact_email ||
                            (s.email && !s.email.endsWith(INTERNAL_DOMAIN) ? s.email : '');
                        const contact = [email, s.phone].filter(Boolean).join(' · ') || 'Вход по логину';

                        return (
                            <div
                                key={s.id}
                                style={{
                                    padding: '18px 20px',
                                    borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        marginBottom: '12px',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ color: 'var(--text)', fontWeight: '700', fontSize: '16px', wordBreak: 'break-word' }}>
                                            {fullName(s)}
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', wordBreak: 'break-word' }}>
                                            {contact} · {new Date(s.created_at).toLocaleDateString('ru-RU')}
                                        </p>
                                    </div>
                                    {courses.length > 0 && set.size < courses.length && (
                                        <button
                                            onClick={() => grantAll(s)}
                                            style={{
                                                ...pillBase,
                                                background: 'transparent',
                                                color: 'var(--accent-soft)',
                                                border: '1.5px solid rgba(111,163,224,0.5)',
                                            }}
                                        >
                                            Открыть все курсы
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {courses.map((c) => {
                                        const has = set.has(c.id);
                                        const busy = busyKey === `${s.id}:${c.id}`;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setEnroll(s.id, c.id, !has)}
                                                disabled={busy}
                                                title={has ? 'Нажмите, чтобы закрыть доступ' : 'Нажмите, чтобы открыть доступ'}
                                                style={{
                                                    ...pillBase,
                                                    background: has ? 'rgba(111,163,224,0.2)' : 'transparent',
                                                    color: has ? '#cfe2fb' : 'var(--text-muted)',
                                                    border: has
                                                        ? '1.5px solid rgba(111,163,224,0.7)'
                                                        : '1.5px dashed rgba(157,176,204,0.4)',
                                                    opacity: busy ? 0.55 : 1,
                                                }}
                                            >
                                                {has ? '✓ ' : '+ '}
                                                {c.title}
                                                {!c.is_published ? ' (черновик)' : ''}
                                            </button>
                                        );
                                    })}
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