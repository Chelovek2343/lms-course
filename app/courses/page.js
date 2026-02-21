'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [user, setUser] = useState(null);
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
            setUser(user);

            // Проверяем успешную оплату
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('success') === 'true') {
                // Получаем последний купленный курс из localStorage
                const lastCourseId = localStorage.getItem('pendingCourseId');
                if (lastCourseId) {
                    await supabase
                        .from('enrollments')
                        .insert({ user_id: user.id, course_id: lastCourseId });
                    localStorage.removeItem('pendingCourseId');
                }
            }

            const { data: courses } = await supabase
                .from('courses')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('course_id')
                .eq('user_id', user.id);

            setCourses(courses || []);
            setEnrollments(enrollments?.map((e) => e.course_id) || []);
            setLoading(false);
        };
        init();
    }, []);

    const enroll = async (courseId) => {
        const { error } = await supabase
            .from('enrollments')
            .insert({ user_id: user.id, course_id: courseId });

        if (!error) {
            setEnrollments([...enrollments, courseId]);
        }
    };

    const handleBuy = async (course) => {
        const res = await fetch('/api/stripe/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: course.id,
                userId: user.id,
                userEmail: user.email,
                price: course.price,
                title: course.title,
            }),
        });

        const { url, error } = await res.json();
        if (error) {
            alert('Ошибка: ' + error);
            return;
        }
        localStorage.setItem('pendingCourseId', course.id);
        window.location.href = url;
    };

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
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '30px',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: '#fff',
                                fontSize: 'clamp(18px, 4vw, 24px)',
                                marginBottom: '4px',
                            }}
                        >
                            📚 Каталог курсов
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>
                            Выбери курс и начни обучение
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid #1e2433',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                        }}
                    >
                        ← Dashboard
                    </button>
                </div>

                {courses.length === 0 && (
                    <div
                        style={{
                            background: '#111827',
                            border: '1px solid #1e2433',
                            borderRadius: '12px',
                            padding: '60px 20px',
                            textAlign: 'center',
                        }}
                    >
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            Курсов пока нет
                        </p>
                    </div>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                        gap: '16px',
                    }}
                >
                    {courses.map((course) => {
                        const isEnrolled = enrollments.includes(course.id);
                        return (
                            <div
                                key={course.id}
                                style={{
                                    background: '#111827',
                                    border: '1px solid #1e2433',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '120px',
                                        background: '#0a0e1a',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '40px',
                                    }}
                                >
                                    🎓
                                </div>

                                <h3 style={{ color: '#fff', fontSize: '15px' }}>
                                    {course.title}
                                </h3>
                                <p
                                    style={{
                                        color: '#64748b',
                                        fontSize: '12px',
                                        flex: 1,
                                    }}
                                >
                                    {course.description ||
                                        'Описание отсутствует'}
                                </p>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: '#10b981',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {course.price === 0
                                            ? 'Бесплатно'
                                            : `$${course.price}`}
                                    </span>

                                    {isEnrolled ? (
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/learn/${course.id}`,
                                                )
                                            }
                                            style={{
                                                padding: '8px 16px',
                                                background:
                                                    'rgba(0,229,255,0.1)',
                                                border: '1px solid rgba(0,229,255,0.3)',
                                                borderRadius: '6px',
                                                color: '#00e5ff',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                            }}
                                        >
                                            Продолжить →
                                        </button>
                                    ) : course.price === 0 ? (
                                        <button
                                            onClick={() => enroll(course.id)}
                                            style={{
                                                padding: '8px 16px',
                                                background:
                                                    'rgba(16,185,129,0.1)',
                                                border: '1px solid rgba(16,185,129,0.3)',
                                                borderRadius: '6px',
                                                color: '#10b981',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                            }}
                                        >
                                            Записаться
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleBuy(course)}
                                            style={{
                                                padding: '8px 16px',
                                                background:
                                                    'rgba(245,158,11,0.1)',
                                                border: '1px solid rgba(245,158,11,0.3)',
                                                borderRadius: '6px',
                                                color: '#f59e0b',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                            }}
                                        >
                                            Купить ${course.price}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
