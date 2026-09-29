'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

const PDFJS_SRC =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function PdfViewer({ url }) {
    const containerRef = useRef(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        let pdfDoc = null;
        let observer = null;

        const loadPdfJs = () =>
            new Promise((resolve, reject) => {
                if (window.pdfjsLib) return resolve(window.pdfjsLib);
                const s = document.createElement('script');
                s.src = PDFJS_SRC;
                s.onload = () => resolve(window.pdfjsLib);
                s.onerror = () => reject(new Error('pdf.js не загрузился'));
                document.head.appendChild(s);
            });

        const run = async () => {
            try {
                setStatus('loading');
                const pdfjsLib = await loadPdfJs();
                pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

                pdfDoc = await pdfjsLib.getDocument({
                    url,
                    disableRange: true,
                    disableStream: true,
                }).promise;
                if (cancelled) return;

                const container = containerRef.current;
                if (!container) return;
                container.innerHTML = '';

                const first = await pdfDoc.getPage(1);
                const base = first.getViewport({ scale: 1 });
                const ratio = base.width / base.height;

                const rendering = new Set();

                const renderPage = async (wrap) => {
                    const n = Number(wrap.dataset.page);
                    if (wrap.dataset.done === '1' || rendering.has(n)) return;
                    rendering.add(n);
                    try {
                        const page = await pdfDoc.getPage(n);
                        const cssWidth = wrap.clientWidth || container.clientWidth;
                        const dpr = Math.min(window.devicePixelRatio || 1, 2);
                        const vp0 = page.getViewport({ scale: 1 });
                        const viewport = page.getViewport({
                            scale: (cssWidth / vp0.width) * dpr,
                        });
                        const canvas = wrap.querySelector('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        await page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport,
                        }).promise;
                        wrap.dataset.done = '1';
                    } catch (e) {
                        // отрисовку могли прервать при закрытии страницы
                    } finally {
                        rendering.delete(n);
                    }
                };

                // освобождаем память у страниц, которые далеко от экрана
                const clearPage = (wrap) => {
                    const n = Number(wrap.dataset.page);
                    if (rendering.has(n) || wrap.dataset.done !== '1') return;
                    const canvas = wrap.querySelector('canvas');
                    canvas.width = 1;
                    canvas.height = 1;
                    wrap.dataset.done = '0';
                };

                observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) renderPage(entry.target);
                            else clearPage(entry.target);
                        });
                    },
                    { rootMargin: '800px 0px' },
                );

                for (let n = 1; n <= pdfDoc.numPages; n++) {
                    const wrap = document.createElement('div');
                    wrap.dataset.page = String(n);
                    wrap.dataset.done = '0';
                    wrap.style.cssText = `width:100%;aspect-ratio:${ratio};margin-bottom:8px;background:#fff;border-radius:6px;overflow:hidden;`;
                    const canvas = document.createElement('canvas');
                    canvas.style.cssText =
                        'width:100%;height:100%;display:block;object-fit:contain;';
                    wrap.appendChild(canvas);
                    container.appendChild(wrap);
                    observer.observe(wrap);
                }

                setStatus('ready');
            } catch (e) {
                console.error('PDF error:', e);
                if (!cancelled) setStatus('error');
            }
        };

        run();

        return () => {
            cancelled = true;
            if (observer) observer.disconnect();
            if (pdfDoc) pdfDoc.destroy();
        };
    }, [url]);

    return (
        <div>
            {status === 'loading' && (
                <p style={{ color: '#64748b', fontSize: '13px', padding: '12px 0' }}>
                    Загрузка презентации...
                </p>
            )}
            {status === 'error' && (
                <div style={{ padding: '12px 0' }}>
                    <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>
                        Не удалось показать презентацию.
                    </p>
                    <button
                        onClick={() => window.open(url, '_blank')}
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(0,229,255,0.1)',
                            border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: '6px',
                            color: '#00e5ff',
                            cursor: 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        Открыть в новой вкладке
                    </button>
                </div>
            )}
            <div ref={containerRef} />
        </div>
    );
}

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
