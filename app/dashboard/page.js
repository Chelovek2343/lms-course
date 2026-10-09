'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';
import BottomNav from '../../components/BottomNav';
import { CURATOR_LINK } from '../../lib/config';

const MAX_WIDTH = 720;

export default function DashboardPage() {
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
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

            setProfile(profile);
            await loadCourses(user.id);
        };

        init();
    }, []);

    const loadCourses = async (userId) => {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id, courses(id, title, description)')
            .eq('user_id', userId);

        const enrolled = (enrollments || []).map((e) => e.courses).filter(Boolean);

        if (enrolled.length === 0) {
            setCourses([]);
            setLoadingCourses(false);
            return;
        }

        const courseIds = enrolled.map((c) => c.id);

        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, order_index, sections!inner(course_id, order_index)')
            .in('sections.course_id', courseIds);

        const { data: progress } = await supabase
            .from('progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('completed', true);

        const completedIds = new Set((progress || []).map((p) => p.lesson_id));

        const byCourse = {};
        courseIds.forEach((id) => (byCourse[id] = []));
        (lessons || []).forEach((l) => {
            const cid = l.sections?.course_id;
            if (!byCourse[cid]) return;
            byCourse[cid].push({
                id: l.id,
                order: (l.sections?.order_index || 0) * 10000 + (l.order_index || 0),
            });
        });

        const result = enrolled.map((course) => {
            const list = (byCourse[course.id] || []).sort((a, b) => a.order - b.order);
            const total = list.length;
            const completed = list.filter((l) => completedIds.has(l.id)).length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const nextLesson = list.find((l) => !completedIds.has(l.id));

            return {
                ...course,
                total,
                completed,
                percent,
                firstLessonId: list[0]?.id || null,
                nextLessonId: nextLesson?.id || null,
            };
        });

        setCourses(result);
        setLoadingCourses(false);
    };

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

    const isStaff = ['admin', 'superuser', 'owner'].includes(profile.role);
    const displayName = profile.login || (profile.email || '').split('@')[0] || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const completedCourses = courses.filter((c) => c.total > 0 && c.completed >= c.total).length;

    const roleBadge = () => {
        if (profile.role === 'owner') {
            return { color: '#c084fc', border: 'rgba(192,132,252,0.4)', bg: 'rgba(168,85,247,0.1)', label: '🔱 Owner' };
        }
        if (profile.role === 'superuser') {
            return { color: '#f87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(239,68,68,0.1)', label: '👑 Superuser' };
        }
        return { color: '#f5b84a', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)', label: '⚙️ Admin' };
    };
    const badge = isStaff ? roleBadge() : null;

    const pill = (variant) => ({
        padding: '12px 20px',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: 'var(--sans)',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(variant === 'solid'
            ? { background: 'var(--accent)', color: 'var(--bg)', border: 'none' }
            : { background: 'transparent', color: 'var(--accent-soft)', border: '1.5px solid rgba(111,163,224,0.5)' }),
    });

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                fontFamily: 'var(--sans)',
                paddingBottom: '100px',
            }}
        >
            {/* Шапка */}
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
                        maxWidth: `${MAX_WIDTH}px`,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 20px',
                    }}
                >
                    <Logo height={28} maxWidth={150} />
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
                </div>
            </header>

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                {/* Заголовок */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px' }}>
                        Личный кабинет
                    </p>
                    {badge && (
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
                    )}
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
                    {isStaff ? (
                        <>
                            Рабочее{' '}
                            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                                пространство
                            </em>
                        </>
                    ) : (
                        <>
                            Твоё поступление{' '}
                            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                                шаг за шагом
                            </em>
                        </>
                    )}
                </h1>

                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '42ch' }}>
                    {isStaff
                        ? 'Курсы, пользователи и материалы платформы — под рукой.'
                        : 'Все уроки, презентации и задания — в одном месте.'}
                </p>

                {/* Админ-панель */}
                {isStaff && (
                    <section
                        style={{
                            marginTop: '28px',
                            padding: '22px',
                            borderRadius: '22px',
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.28)',
                        }}
                    >
                        <p style={{ fontFamily: 'var(--serif)', fontWeight: '600', fontSize: '20px', color: '#f5b84a', marginBottom: '4px' }}>
                            Админ-панель
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '16px' }}>
                            Управление курсами и доступом студентов
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => router.push('/admin/courses')}
                                style={{
                                    ...pill('outline'),
                                    color: '#f5b84a',
                                    border: '1.5px solid rgba(245,158,11,0.5)',
                                }}
                            >
                                📚 Управление курсами
                            </button>
                            <button onClick={() => router.push('/admin/users')} style={pill('outline')}>
                                👥 Пользователи
                            </button>
                        </div>
                    </section>
                )}

                {/* Счётчик */}
                {!loadingCourses && courses.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                            padding: '22px 0',
                            margin: '28px 0 24px',
                            borderTop: '1px solid var(--border-soft)',
                            borderBottom: '1px solid var(--border-soft)',
                        }}
                    >
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                                Пройдено курсов
                            </p>
                            <p style={{ fontFamily: 'var(--serif)', fontWeight: '600', fontSize: '32px', color: 'var(--accent-soft)' }}>
                                {completedCourses} из {courses.length}
                            </p>
                        </div>
                        {CURATOR_LINK && (
                            <a href={CURATOR_LINK} target="_blank" rel="noopener noreferrer" style={pill('outline')}>
                                Написать куратору
                            </a>
                        )}
                    </div>
                )}

                {loadingCourses && (
                    <p style={{ color: 'var(--text-faint)', fontSize: '14px', marginTop: '32px' }}>
                        Загрузка курсов...
                    </p>
                )}

                {/* Пустое состояние */}
                {!loadingCourses && courses.length === 0 && (
                    <div
                        style={{
                            marginTop: '28px',
                            padding: '28px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <p style={{ fontFamily: 'var(--serif)', fontWeight: '600', fontSize: '22px', color: 'var(--text)', marginBottom: '8px' }}>
                            Пока нет доступных курсов
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                            Доступ к курсу открывает куратор. Загляните в каталог или напишите нам.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => router.push('/courses')} style={pill('solid')}>
                                Каталог курсов
                            </button>
                            {CURATOR_LINK && (
                                <a href={CURATOR_LINK} target="_blank" rel="noopener noreferrer" style={pill('outline')}>
                                    Написать куратору
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Карточки курсов */}
                {courses.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                            gap: '18px',
                        }}
                    >
                        {courses.map((c, i) => {
                            const done = c.total > 0 && c.completed >= c.total;
                            const started = c.completed > 0;
                            const active = done || started;

                            const status = c.total === 0
                                ? { label: 'Материалы готовятся', done: false }
                                : done
                                ? { label: '✓ Курс завершён', done: true }
                                : started
                                ? { label: 'В процессе', done: false }
                                : { label: 'Не начат', done: false };

                            let btnLabel = 'Начать';
                            let target = c.firstLessonId ? `/learn/${c.id}/${c.firstLessonId}` : `/learn/${c.id}`;
                            if (done) {
                                btnLabel = 'Повторить курс';
                                target = `/learn/${c.id}`;
                            } else if (started) {
                                btnLabel = 'Продолжить';
                                target = c.nextLessonId ? `/learn/${c.id}/${c.nextLessonId}` : `/learn/${c.id}`;
                            }

                            return (
                                <article
                                    key={c.id}
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '116px',
                                            padding: '0 22px 16px',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'space-between',
                                            background: active ? '#143560' : '#0e2a52',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                letterSpacing: '1.5px',
                                                lineHeight: '1.5',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            BAT /<br />ОБРАЗОВАНИЕ
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: 'var(--serif)',
                                                fontWeight: '700',
                                                fontSize: '64px',
                                                lineHeight: '0.85',
                                                color: active ? 'var(--accent-soft)' : 'rgba(111,163,224,0.4)',
                                            }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span
                                            style={{
                                                alignSelf: 'flex-start',
                                                padding: '5px 12px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                marginBottom: '14px',
                                                background: status.done ? 'rgba(111,163,224,0.18)' : 'rgba(255,255,255,0.06)',
                                                color: status.done ? 'var(--text)' : 'var(--text-muted)',
                                            }}
                                        >
                                            {status.label}
                                        </span>

                                        <h3
                                            style={{
                                                fontFamily: 'var(--serif)',
                                                fontWeight: '700',
                                                fontSize: '24px',
                                                lineHeight: '1.2',
                                                color: 'var(--text)',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            {c.title}
                                        </h3>

                                        {c.description && (
                                            <p
                                                style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '14.5px',
                                                    lineHeight: '1.55',
                                                    marginBottom: '16px',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {c.description}
                                            </p>
                                        )}

                                        {c.total > 0 && (
                                            <div style={{ marginBottom: '18px' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '13px',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    <span style={{ color: 'var(--text-muted)' }}>
                                                        {c.completed} из {c.total} уроков
                                                    </span>
                                                    <span style={{ color: 'var(--text)', fontWeight: '700' }}>
                                                        {c.percent}%
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: '6px',
                                                        borderRadius: '999px',
                                                        background: 'rgba(111,163,224,0.18)',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${c.percent}%`,
                                                            height: '100%',
                                                            background: 'var(--accent-soft)',
                                                            borderRadius: '999px',
                                                            transition: 'width 0.4s ease',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => router.push(target)}
                                            disabled={c.total === 0}
                                            style={{
                                                marginTop: 'auto',
                                                width: '100%',
                                                padding: '15px',
                                                borderRadius: '999px',
                                                border: 'none',
                                                background: c.total === 0 ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                                                color: c.total === 0 ? 'var(--text-faint)' : 'var(--bg)',
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                fontFamily: 'var(--sans)',
                                                cursor: c.total === 0 ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            {c.total === 0 ? 'Скоро' : btnLabel}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

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
