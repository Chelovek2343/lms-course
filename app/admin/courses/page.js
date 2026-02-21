'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminCoursesPage() {
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(false);
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
            loadCourses();
        };
        init();
    }, []);

    const loadCourses = async () => {
        const { data } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        setCourses(data || []);
    };

    const createCourse = async () => {
        if (!title.trim()) return;
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from('courses').insert({
            title,
            description,
            price: parseFloat(price) || 0,
            author_id: user.id,
        });

        if (!error) {
            setTitle('');
            setDescription('');
            loadCourses();
        }
        setLoading(false);
    };

    const togglePublish = async (course) => {
        await supabase
            .from('courses')
            .update({ is_published: !course.is_published })
            .eq('id', course.id);
        loadCourses();
    };

    const deleteCourse = async (id) => {
        await supabase.from('courses').delete().eq('id', id);
        loadCourses();
    };

    const btn = (bg, color, border) => ({
        padding: '8px 16px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '6px',
        color,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
    });

    if (!profile)
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
                        alignItems: 'flex-start',
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
                            ⚙️ Управление курсами
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>
                            Создавай и редактируй курсы
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            padding: '8px 14px',
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

                {/* Форма создания курса */}
                <div
                    style={{
                        background: '#111827',
                        border: '1px solid #1e2433',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '24px',
                    }}
                >
                    <h2
                        style={{
                            color: '#f59e0b',
                            fontSize: '14px',
                            marginBottom: '16px',
                        }}
                    >
                        + Новый курс
                    </h2>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Название курса"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e1a',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                        <textarea
                            placeholder="Описание курса"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e1a',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Цена (0 = бесплатно)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0e1a',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                        <button
                            onClick={createCourse}
                            style={{
                                padding: '12px',
                                background: 'rgba(245,158,11,0.1)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                borderRadius: '8px',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                            }}
                        >
                            + Создать курс
                        </button>
                    </div>
                </div>

                {/* Список курсов */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            style={{
                                background: '#111827',
                                border: '1px solid #1e2433',
                                borderRadius: '12px',
                                padding: '16px 20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '0' }}>
                                    <h3
                                        style={{
                                            color: '#fff',
                                            fontSize: '15px',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {course.title}
                                    </h3>
                                    <p
                                        style={{
                                            color: '#64748b',
                                            fontSize: '12px',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {course.description || 'Без описания'}
                                    </p>
                                    <p
                                        style={{
                                            color: '#10b981',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {course.price === 0
                                            ? 'Бесплатно'
                                            : `$${course.price}`}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            router.push(
                                                `/admin/courses/${course.id}`,
                                            )
                                        }
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(124,58,237,0.1)',
                                            border: '1px solid rgba(124,58,237,0.3)',
                                            borderRadius: '6px',
                                            color: '#7c3aed',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => togglePublish(course)}
                                        style={{
                                            padding: '8px 12px',
                                            background: course.is_published
                                                ? 'rgba(16,185,129,0.1)'
                                                : 'transparent',
                                            border: `1px solid ${course.is_published ? 'rgba(16,185,129,0.3)' : '#1e2433'}`,
                                            borderRadius: '6px',
                                            color: course.is_published
                                                ? '#10b981'
                                                : '#64748b',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {course.is_published
                                            ? '✓ Опубликован'
                                            : 'Опубликовать'}
                                    </button>
                                    <button
                                        onClick={() => deleteCourse(course.id)}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: '6px',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {courses.length === 0 && (
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
                                Курсов пока нет — создай первый!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
