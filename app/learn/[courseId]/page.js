'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

export default function CoursePage() {
    const [profile, setProfile] = useState(null);
    const [course, setCourse] = useState(null);
    const [groups, setGroups] = useState([]);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const router = useRouter();
    const { courseId } = useParams();
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

            const { data: prof } = await supabase
                .from('profiles')
                .select('login, email, role')
                .eq('id', user.id)
                .single();
            setProfile(prof);

            if (!STAFF.includes(prof?.role)) {
                const { data: enrollment } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('course_id', courseId)
                    .maybeSingle();

                if (!enrollment) {
                    router.push('/courses');
                    return;
                }
            }

            const [courseRes, sectionsRes, lessonsRes, progressRes] = await Promise.all([
                supabase.from('courses').select('*').eq('id', courseId).single(),
                supabase
                    .from('sections')
                    .select('*')
                    .eq('course_id', courseId)
                    .order('order_index'),
                supabase
                    .from('lessons')
                    .select('id, title, order_index, section_id, sections!inner(course_id)')
                    .eq('sections.course_id', courseId)
                    .order('order_index'),
                supabase
                    .from('progress')
                    .select('lesson_id')
                    .eq('user_id', user.id)
                    .eq('completed', true),
            ]);

            if (!courseRes.data) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            const sections = sectionsRes.data || [];
            const lessons = lessonsRes.data || [];

            let counter = 0;
            const built = sections.map((s) => ({
                ...s,
                lessons: lessons
                    .filter((l) => l.section_id === s.id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((l) => ({ ...l, number: ++counter })),
            }));

            setCourse(courseRes.data);
            setGroups(built);
            setCompletedIds(new Set((progressRes.data || []).map((p) => p.lesson_id)));
            setLoading(false);
        };

        init();
    }, [courseId]);

    const displayName = profile?.login || profile?.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();

    if (loading)
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

    if (notFound)
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
                <AppHeader initial={initial} maxWidth={MAX_WIDTH} />
                <div style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '48px 20px' }}>
                    <h1 style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '30px', color: 'var(--text)', marginBottom: '12px' }}>
                        Курс не найден
                    </h1>
                    <button
                        onClick={() => router.push('/courses')}
                        style={{
                            padding: '14px 26px',
                            borderRadius: '999px',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            background: 'transparent',
                            color: 'var(--text)',
                            fontWeight: '700',
                            fontFamily: 'var(--sans)',
                            cursor: 'pointer',
                        }}
                    >
                        Мои курсы
                    </button>
                </div>
            </div>
        );

    const flat = groups.flatMap((g) => g.lessons);
    const total = flat.length;
    const completedCount = flat.filter((l) => completedIds.has(l.id)).length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const nextLesson = flat.find((l) => !completedIds.has(l.id));
    const allDone = total > 0 && completedCount >= total;

    let ctaLabel = 'Начать курс';
    let ctaTarget = flat[0]?.id;
    if (allDone) {
        ctaLabel = 'Повторить курс';
    } else if (completedCount > 0 && nextLesson) {
        ctaLabel = 'Продолжить';
        ctaTarget = nextLesson.id;
    }

    const words = (course.title || '').trim().split(/\s+/);
    const titleHead = words.length > 1 ? words.slice(0, -1).join(' ') : '';
    const titleTail = words[words.length - 1] || '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <style>{`
                .course-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; }
                .course-aside { order: -1; }
                @media (min-width: 960px) {
                    .course-grid { grid-template-columns: minmax(0, 1fr) 340px; gap: 48px; align-items: start; }
                    .course-aside { order: 0; position: sticky; top: 88px; }
                }
            `}</style>

            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push('/courses')}
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
                    ← Мои курсы
                </button>

                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
                    Программа курса
                </p>

                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(34px, 7vw, 52px)',
                        lineHeight: '1.08',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '14px',
                    }}
                >
                    {titleHead && <>{titleHead} </>}
                    {titleHead ? (
                        <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                            {titleTail}
                        </em>
                    ) : (
                        titleTail
                    )}
                </h1>

                {course.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '60ch' }}>
                        {course.description}
                    </p>
                )}

                <div className="course-grid" style={{ marginTop: '28px' }}>
                    {/* Уроки */}
                    <div style={{ minWidth: 0 }}>
                        {total === 0 && (
                            <div
                                style={{
                                    padding: '28px 22px',
                                    borderRadius: '22px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                                    Уроки ещё не добавлены, материалы готовятся.
                                </p>
                            </div>
                        )}

                        {groups
                            .filter((g) => g.lessons.length > 0)
                            .map((g, gi) => (
                                <section key={g.id} style={{ marginTop: gi === 0 ? 0 : '36px' }}>
                                    <p
                                        style={{
                                            color: 'var(--accent-soft)',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            letterSpacing: '1.5px',
                                            textTransform: 'uppercase',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        {g.title}
                                    </p>
                                    <div style={{ borderTop: '1px solid var(--border-soft)' }}>
                                        {g.lessons.map((l) => {
                                            const done = completedIds.has(l.id);
                                            return (
                                                <button
                                                    key={l.id}
                                                    onClick={() => router.push(`/learn/${courseId}/${l.id}`)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '14px',
                                                        padding: '18px 0',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderBottom: '1px solid var(--border-soft)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontFamily: 'var(--sans)',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            flex: 'none',
                                                            width: '34px',
                                                            fontFamily: 'var(--serif)',
                                                            fontWeight: '700',
                                                            fontSize: '18px',
                                                            color: 'var(--accent-soft)',
                                                        }}
                                                    >
                                                        {l.number}
                                                    </span>
                                                    <span
                                                        style={{
                                                            flex: 1,
                                                            fontSize: '16px',
                                                            color: done ? 'var(--text-muted)' : 'var(--text)',
                                                        }}
                                                    >
                                                        {l.title}
                                                    </span>
                                                    {done ? (
                                                        <span
                                                            style={{
                                                                flex: 'none',
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                background: 'var(--accent-soft)',
                                                                color: 'var(--bg)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '13px',
                                                                fontWeight: '800',
                                                            }}
                                                        >
                                                            ✓
                                                        </span>
                                                    ) : (
                                                        <span style={{ flex: 'none', color: 'var(--text-faint)', fontSize: '20px' }}>
                                                            ›
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                    </div>

                    {/* Прогресс (справа на широких экранах, сверху на телефоне) */}
                    {total > 0 && (
                        <aside className="course-aside">
                            <div
                                style={{
                                    padding: '22px',
                                    borderRadius: '22px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        {completedCount} из {total} уроков
                                    </span>
                                    <span style={{ color: 'var(--text)', fontWeight: '700' }}>{percent}%</span>
                                </div>
                                <div
                                    style={{
                                        height: '6px',
                                        borderRadius: '999px',
                                        background: 'rgba(111,163,224,0.18)',
                                        overflow: 'hidden',
                                        marginBottom: '18px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: 'var(--accent-soft)',
                                            borderRadius: '999px',
                                            transition: 'width 0.4s ease',
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => ctaTarget && router.push(`/learn/${courseId}/${ctaTarget}`)}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        borderRadius: '999px',
                                        border: 'none',
                                        background: 'var(--accent)',
                                        color: 'var(--bg)',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        fontFamily: 'var(--sans)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {ctaLabel}
                                </button>
                            </div>
                        </aside>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
