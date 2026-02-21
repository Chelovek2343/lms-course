'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function LearnPage() {
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [progress, setProgress] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
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
            setUser(user);

            // Проверяем запись на курс
            const { data: enrollment } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
                .single();

            if (!enrollment) {
                router.push('/courses');
                return;
            }

            // Загружаем курс
            const { data: course } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            // Загружаем секции
            const { data: sections } = await supabase
                .from('sections')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index');

            // Загружаем уроки
            const { data: lessons } = await supabase
                .from('lessons')
                .select('*, sections!inner(course_id)')
                .eq('sections.course_id', courseId)
                .order('order_index');

            // Загружаем прогресс
            const { data: progress } = await supabase
                .from('progress')
                .select('*')
                .eq('user_id', user.id);

            setCourse(course);
            setSections(sections || []);
            setLessons(lessons || []);
            setProgress(progress || []);
            setLoading(false);
        };
        init();
    }, [courseId]);

    const markComplete = async (lessonId) => {
        const existing = progress.find((p) => p.lesson_id === lessonId);

        if (existing) {
            await supabase
                .from('progress')
                .update({ completed: true, watch_pct: 100 })
                .eq('id', existing.id);
        } else {
            await supabase.from('progress').insert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                watch_pct: 100,
            });
        }

        setProgress((prev) => {
            const filtered = prev.filter((p) => p.lesson_id !== lessonId);
            return [
                ...filtered,
                { lesson_id: lessonId, completed: true, watch_pct: 100 },
            ];
        });
    };

    const isCompleted = (lessonId) =>
        progress.find((p) => p.lesson_id === lessonId)?.completed;

    const completedCount = lessons.filter((l) => isCompleted(l.id)).length;
    const totalCount = lessons.length;
    const percentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0e1a',
                fontFamily: 'monospace',
                padding: '20px',
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => router.push('/courses')}
                    style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid #1e2433',
                        borderRadius: '6px',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '13px',
                        marginBottom: '20px',
                    }}
                >
                    ← Назад к курсам
                </button>

                <h1
                    style={{
                        color: '#fff',
                        fontSize: 'clamp(18px, 4vw, 24px)',
                        marginBottom: '8px',
                    }}
                >
                    {course?.title}
                </h1>
                <p
                    style={{
                        color: '#64748b',
                        fontSize: '13px',
                        marginBottom: '24px',
                    }}
                >
                    {course?.description}
                </p>

                {/* Прогресс бар */}
                <div
                    style={{
                        background: '#111827',
                        border: '1px solid #1e2433',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                        }}
                    >
                        <span style={{ color: '#fff', fontSize: '13px' }}>
                            Прогресс курса
                        </span>
                        <span
                            style={{
                                color: '#00e5ff',
                                fontSize: '13px',
                                fontWeight: '600',
                            }}
                        >
                            {percentage}%
                        </span>
                    </div>
                    <div
                        style={{
                            background: '#0a0e1a',
                            borderRadius: '4px',
                            height: '6px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background:
                                    'linear-gradient(90deg, #00e5ff, #7c3aed)',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </div>
                    <p
                        style={{
                            color: '#64748b',
                            fontSize: '12px',
                            marginTop: '8px',
                        }}
                    >
                        {completedCount} из {totalCount} уроков завершено
                    </p>
                </div>

                {/* Секции и уроки */}
                {sections.length === 0 && (
                    <div
                        style={{
                            background: '#111827',
                            border: '1px solid #1e2433',
                            borderRadius: '12px',
                            padding: '40px 20px',
                            textAlign: 'center',
                        }}
                    >
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            Уроки ещё не добавлены
                        </p>
                    </div>
                )}

                {sections.map((section) => (
                    <div key={section.id} style={{ marginBottom: '20px' }}>
                        <h2
                            style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                marginBottom: '10px',
                                paddingLeft: '4px',
                            }}
                        >
                            {section.title}
                        </h2>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            {lessons
                                .filter((l) => l.section_id === section.id)
                                .map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        style={{
                                            background: '#111827',
                                            border: `1px solid ${isCompleted(lesson.id) ? 'rgba(16,185,129,0.3)' : '#1e2433'}`,
                                            borderRadius: '8px',
                                            padding: '14px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                flex: 1,
                                                minWidth: '0',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '18px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isCompleted(lesson.id)
                                                    ? '✅'
                                                    : '▶️'}
                                            </span>
                                            <span
                                                onClick={() =>
                                                    router.push(
                                                        `/learn/${courseId}/${lesson.id}`,
                                                    )
                                                }
                                                style={{
                                                    color: isCompleted(
                                                        lesson.id,
                                                    )
                                                        ? '#10b981'
                                                        : '#00e5ff',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {lesson.title}
                                            </span>
                                        </div>

                                        {!isCompleted(lesson.id) && (
                                            <button
                                                onClick={() =>
                                                    markComplete(lesson.id)
                                                }
                                                style={{
                                                    padding: '6px 12px',
                                                    background:
                                                        'rgba(16,185,129,0.1)',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    borderRadius: '6px',
                                                    color: '#10b981',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                Отметить ✓
                                            </button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
