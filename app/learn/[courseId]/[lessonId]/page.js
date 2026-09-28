'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function LessonPage() {
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [user, setUser] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [presUrl, setPresUrl] = useState(null);
const [isMobile, setIsMobile] = useState(false);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const router = useRouter();
    const { courseId, lessonId } = useParams();
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

            const { data: lesson } = await supabase
                .from('lessons')
                .select('*, lesson_files(*)')
                .eq('id', lessonId)
                .single();

            const { data: course } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            setLesson(lesson);
            setCourse(course);

            // Получаем подписанный URL для видео
            if (lesson?.hls_key) {
                const res = await fetch('/api/video-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: lesson.hls_key }),
                });
                const { url } = await res.json();
                setVideoUrl(url);
            }
        };
        init();
    }, [lessonId]);

    useEffect(() => {
        if (!videoUrl || !videoRef.current) return;

        const loadPlayer = async () => {
            const videojs = (await import('video.js')).default;
            await import('video.js/dist/video-js.css');

            if (playerRef.current) {
                playerRef.current.dispose();
            }

            playerRef.current = videojs(videoRef.current, {
                controls: true,
                fluid: true,
                sources: [{ src: videoUrl, type: 'video/mp4' }],
            });
        };

        loadPlayer();

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoUrl]);

    useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
}, []);

useEffect(() => {
    if (!lesson) return;
    const key = isMobile
        ? lesson.presentation_mobile_key || lesson.presentation_desktop_key
        : lesson.presentation_desktop_key || lesson.presentation_mobile_key;

    if (!key) {
        setPresUrl(null);
        return;
    }

    let cancelled = false;
    (async () => {
        const res = await fetch('/api/video-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        });
        const { url } = await res.json();
        if (!cancelled) setPresUrl(url);
    })();

    return () => { cancelled = true; };
}, [lesson, isMobile]);

    const markComplete = async () => {
        await supabase.from('progress').upsert(
            {
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                watch_pct: 100,
            },
            { onConflict: 'user_id,lesson_id' },
        );

        router.push(`/learn/${courseId}`);
    };

    if (!lesson)
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
                <button
                    onClick={() => router.push(`/learn/${courseId}`)}
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
                    ← Назад к курсу
                </button>

                <h1
                    style={{
                        color: '#fff',
                        fontSize: 'clamp(16px, 4vw, 22px)',
                        marginBottom: '6px',
                    }}
                >
                    {lesson.title}
                </h1>
                <p
                    style={{
                        color: '#64748b',
                        fontSize: '13px',
                        marginBottom: '20px',
                    }}
                >
                    {course?.title}
                </p>

                {/* Видеоплеер */}
                <div
                    style={{
                        position: 'relative',
                        marginBottom: '20px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                    }}
                >
                    {videoUrl ? (
                        <div style={{ position: 'relative' }}>
                            <div data-vjs-player>
                                <video
                                    ref={videoRef}
                                    className="video-js vjs-big-play-centered"
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    color: 'rgba(255,255,255,0.3)',
                                    fontSize: '11px',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                    zIndex: 10,
                                }}
                            >
                                {user?.email}
                            </div>
                        </div>
                    ) : (
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
                                🎬 Видео для этого урока ещё не загружено
                            </p>
                        </div>
                    )}
                </div>

                {/* Текст урока */}
                {lesson.content && (
                    <div
                        style={{
                            background: '#111827',
                            border: '1px solid #1e2433',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '16px',
                        }}
                    >
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '15px',
                                marginBottom: '12px',
                            }}
                        >
                            📝 Материал урока
                        </h2>
                        <p
                            style={{
                                color: '#94a3b8',
                                fontSize: '14px',
                                lineHeight: '1.8',
                                userSelect: 'none',
                            }}
                        >
                            {lesson.content}
                        </p>
                    </div>
                )}

{presUrl && (
    <div style={{
        background: '#111827', border: '1px solid #1e2433',
        borderRadius: '12px', padding: '20px', marginBottom: '16px'
    }}>
        <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
        }}>
            <h2 style={{ color: '#fff', fontSize: '15px', margin: 0 }}>📊 Презентация</h2>
            <button
                onClick={() => window.open(presUrl, '_blank')}
                style={{
                    padding: '6px 12px', background: 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.3)', borderRadius: '6px',
                    color: '#00e5ff', cursor: 'pointer', fontSize: '12px'
                }}
            >
                Открыть на весь экран
            </button>
        </div>
        <iframe
            src={`${presUrl}#toolbar=0`}
            style={{
                width: '100%', height: isMobile ? '70vh' : '80vh',
                border: 'none', borderRadius: '8px', background: '#fff'
            }}
        />
    </div>
)}

                {/* Файлы урока */}
                {lesson.lesson_files?.length > 0 && (
                    <div
                        style={{
                            background: '#111827',
                            border: '1px solid #1e2433',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '16px',
                        }}
                    >
                        <h2
                            style={{
                                color: '#fff',
                                fontSize: '15px',
                                marginBottom: '12px',
                            }}
                        >
                            📎 Файлы урока
                        </h2>
                        {lesson.lesson_files.map((f) => (
                            <div
                                key={f.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    padding: '10px 14px',
                                    background: '#0a0e1a',
                                    border: '1px solid #1e2433',
                                    borderRadius: '6px',
                                    marginBottom: '8px',
                                }}
                            >
                                <span
                                    style={{
                                        color: '#94a3b8',
                                        fontSize: '13px',
                                    }}
                                >
                                    📎 {f.name}
                                </span>
                                <button
                                    onClick={async () => {
                                        const res = await fetch(
                                            '/api/video-url',
                                            {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type':
                                                        'application/json',
                                                },
                                                body: JSON.stringify({
                                                    key: f.file_key,
                                                }),
                                            },
                                        );
                                        const { url } = await res.json();
                                        window.open(url, '_blank');
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(0,229,255,0.1)',
                                        border: '1px solid rgba(0,229,255,0.3)',
                                        borderRadius: '6px',
                                        color: '#00e5ff',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    Скачать
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Кнопка завершения */}
                <button
                    onClick={markComplete}
                    style={{
                        width: '100%',
                        padding: '14px 28px',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: '8px',
                        color: '#10b981',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                    }}
                >
                    ✅ Отметить урок завершённым
                </button>
            </div>
        </div>
    );
}
