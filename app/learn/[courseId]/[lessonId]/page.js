'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase';
import { CURATOR_LINK } from '../../../../lib/config';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '../../../../components/AppHeader';
import PdfViewer from '../../../../components/PdfViewer';

const MAX_WIDTH = 720;
const STAFF = ['admin', 'superuser', 'owner'];

const pillSolid = {
    width: '100%',
    padding: '16px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};
const pillOutline = {
    width: '100%',
    padding: '16px',
    borderRadius: '999px',
    border: '1.5px solid rgba(255,255,255,0.35)',
    background: 'transparent',
    color: 'var(--text)',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};

export default function LessonPage() {
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [presUrl, setPresUrl] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');
    const [lessonNo, setLessonNo] = useState(1);
    const [nextLessonId, setNextLessonId] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const router = useRouter();
    const { courseId, lessonId } = useParams();
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            setLesson(null);
            setVideoUrl(null);
            setPresUrl(null);
            setCompleted(false);
            setNotFound(false);
            setActiveTab('notes');

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data: prof } = await supabase
                .from('profiles')
                .select('login, email, role')
                .eq('id', user.id)
                .single();
            setProfile(prof);

            // студентам нужна запись на курс, персонал может смотреть всё
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

            const [lessonRes, courseRes, listRes, progRes] = await Promise.all([
                supabase
                    .from('lessons')
                    .select('*, lesson_files(*)')
                    .eq('id', lessonId)
                    .single(),
                supabase.from('courses').select('*').eq('id', courseId).single(),
                supabase
                    .from('lessons')
                    .select('id, order_index, sections!inner(course_id, order_index)')
                    .eq('sections.course_id', courseId),
                supabase
                    .from('progress')
                    .select('completed')
                    .eq('user_id', user.id)
                    .eq('lesson_id', lessonId)
                    .maybeSingle(),
            ]);

            if (cancelled) return;

            const ordered = (listRes.data || [])
                .map((l) => ({
                    id: l.id,
                    order: (l.sections?.order_index || 0) * 10000 + (l.order_index || 0),
                }))
                .sort((a, b) => a.order - b.order);

            const idx = ordered.findIndex((l) => l.id === lessonId);

            // урок должен принадлежать этому курсу
            if (!lessonRes.data || idx === -1) {
                setNotFound(true);
                return;
            }

            setLessonNo(idx + 1);
            setNextLessonId(ordered[idx + 1]?.id || null);
            setCompleted(!!progRes.data?.completed);
            setCourse(courseRes.data);
            setLesson(lessonRes.data);

            if (lessonRes.data.hls_key) {
                const res = await fetch('/api/video-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: lessonRes.data.hls_key }),
                });
                const data = await res.json();
                if (!cancelled && data.url) setVideoUrl(data.url);
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, [lessonId, courseId]);

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
                fill: true,
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
        setIsTouch(window.matchMedia('(pointer: coarse)').matches);
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
            const data = await res.json();
            if (!cancelled && data.url) setPresUrl(data.url);
        })();

        return () => {
            cancelled = true;
        };
    }, [lesson, isMobile]);

    const markComplete = async () => {
        if (saving || completed) return;
        setSaving(true);
        const { error } = await supabase.from('progress').upsert(
            {
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                watch_pct: 100,
            },
            { onConflict: 'user_id,lesson_id' },
        );
        setSaving(false);
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setCompleted(true);
    };

    const downloadFile = async (key) => {
        const res = await fetch('/api/video-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
    };

    const showCanvasPdf = isMobile || isTouch;
    const displayName = profile?.login || profile?.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();

    if (notFound)
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
                <AppHeader initial={initial} maxWidth={MAX_WIDTH} />
                <div style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '48px 20px' }}>
                    <h1 style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '30px', color: 'var(--text)', marginBottom: '12px' }}>
                        Урок не найден
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        Возможно, он был удалён или ссылка неверная.
                    </p>
                    <button onClick={() => router.push(`/learn/${courseId}`)} style={{ ...pillOutline, width: 'auto', padding: '14px 26px' }}>
                        К программе курса
                    </button>
                </div>
            </div>
        );

    if (!lesson)
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

    const hasFiles = lesson.lesson_files?.length > 0;
    const tabs = [
        { id: 'notes', label: 'Конспект' },
        ...(presUrl ? [{ id: 'presentation', label: 'Презентация' }] : []),
        ...(hasFiles ? [{ id: 'files', label: 'Файлы' }] : []),
    ];

    const words = (lesson.title || '').trim().split(/\s+/);
    const titleHead = words.length > 1 ? words.slice(0, -1).join(' ') : '';
    const titleTail = words[words.length - 1] || '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '60px' }}>
            <style>{`
                .lesson-rich { color: var(--text-muted); font-size: 16px; line-height: 1.75; user-select: none; }
                .lesson-rich h2 { font-family: var(--serif); font-weight: 700; color: var(--text); font-size: 26px; line-height: 1.2; letter-spacing: -0.3px; margin: 0 0 12px; }
                .lesson-rich h2:not(:first-child) { margin-top: 30px; }
                .lesson-rich h3 { font-family: var(--serif); font-weight: 600; color: var(--text); font-size: 20px; margin: 24px 0 8px; }
                .lesson-rich p { margin: 0 0 14px; }
                .lesson-rich strong { color: var(--text); }
                .lesson-rich em { color: var(--accent-soft); }
                .lesson-rich ul, .lesson-rich ol { list-style: none; margin: 18px 0; padding: 0; border-top: 1px solid var(--border-soft); counter-reset: item; }
                .lesson-rich li { position: relative; padding: 14px 0 14px 40px; border-bottom: 1px solid var(--border-soft); color: var(--text); counter-increment: item; }
                .lesson-rich ol li::before { content: counter(item); position: absolute; left: 0; top: 14px; font-family: var(--serif); font-weight: 700; color: var(--accent-soft); }
                .lesson-rich ul li::before { content: '•'; position: absolute; left: 6px; top: 14px; color: var(--accent-soft); }
            `}</style>

            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push(`/learn/${courseId}`)}
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
                    ← К программе курса
                </button>

                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
                    Урок {String(lessonNo).padStart(2, '0')}
                </p>

                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(34px, 9vw, 48px)',
                        lineHeight: '1.08',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '24px',
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

                {/* Видео */}
                {videoUrl ? (
                    <div
                        style={{
                            position: 'relative',
                            width: 'min(100%, 818px)',
                            aspectRatio: '16 / 9',
                            margin: '0 auto',
                            borderRadius: '22px',
                            overflow: 'hidden',
                            background: '#000',
                        }}
                    >
                        <div data-vjs-player style={{ width: '100%', height: '100%' }}>
                            <video ref={videoRef} className="video-js vjs-big-play-centered" />
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
                            {profile?.login || user?.email}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: '22px',
                            background: '#143560',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            padding: '20px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--bg)">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Видео для этого урока ещё не загружено
                        </p>
                    </div>
                )}

                {/* Вкладки */}
                <div
                    style={{
                        display: 'flex',
                        overflowX: 'auto',
                        borderBottom: '1px solid var(--border-soft)',
                        marginTop: '30px',
                    }}
                >
                    {tabs.map((t) => {
                        const active = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                style={{
                                    padding: '12px 2px',
                                    marginRight: '26px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: active
                                        ? '2px solid var(--accent-soft)'
                                        : '2px solid transparent',
                                    marginBottom: '-1px',
                                    color: active ? 'var(--text)' : 'var(--text-muted)',
                                    fontSize: '15px',
                                    fontWeight: active ? '700' : '600',
                                    fontFamily: 'var(--sans)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Конспект */}
                {activeTab === 'notes' && (
                    <div style={{ padding: '26px 0 6px' }}>
                        {lesson.content ? (
                            <div
                                className="lesson-rich"
                                dangerouslySetInnerHTML={{ __html: lesson.content }}
                            />
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                                Конспект для этого урока ещё не добавлен
                            </p>
                        )}
                    </div>
                )}

                {/* Презентация */}
                {activeTab === 'presentation' && presUrl && (
                    <div style={{ padding: '22px 0 6px' }}>
                        {!showCanvasPdf && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                <button
                                    onClick={() => window.open(presUrl, '_blank')}
                                    style={{
                                        padding: '9px 16px',
                                        background: 'transparent',
                                        border: '1.5px solid rgba(111,163,224,0.5)',
                                        borderRadius: '999px',
                                        color: 'var(--accent-soft)',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        fontFamily: 'var(--sans)',
                                    }}
                                >
                                    Открыть на весь экран
                                </button>
                            </div>
                        )}
                        {showCanvasPdf ? (
                            <PdfViewer url={presUrl} />
                        ) : (
                            <iframe
                                src={`${presUrl}#toolbar=0`}
                                style={{
                                    width: '100%',
                                    height: '80vh',
                                    border: 'none',
                                    borderRadius: '14px',
                                    background: '#fff',
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Файлы */}
                {activeTab === 'files' && hasFiles && (
                    <div style={{ padding: '22px 0 6px' }}>
                        {lesson.lesson_files.map((f) => (
                            <div
                                key={f.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    padding: '16px 0',
                                    borderBottom: '1px solid var(--border-soft)',
                                }}
                            >
                                <span style={{ color: 'var(--text)', fontSize: '15px' }}>📎 {f.name}</span>
                                <button
                                    onClick={() => downloadFile(f.file_key)}
                                    style={{
                                        padding: '9px 18px',
                                        background: 'transparent',
                                        border: '1.5px solid rgba(111,163,224,0.5)',
                                        borderRadius: '999px',
                                        color: 'var(--accent-soft)',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        fontFamily: 'var(--sans)',
                                    }}
                                >
                                    Скачать
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Есть вопрос? */}
                {CURATOR_LINK && (
                    <div
                        style={{
                            marginTop: '30px',
                            padding: '24px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <p style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '24px', color: 'var(--text)', marginBottom: '8px' }}>
                            Есть вопрос?
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.55', marginBottom: '18px' }}>
                            Личный куратор отвечает по делу, а не отправляет «гуглить самому».
                        </p>
                        <a
                            href={CURATOR_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...pillSolid,
                                display: 'block',
                                textAlign: 'center',
                                textDecoration: 'none',
                                boxSizing: 'border-box',
                            }}
                        >
                            Написать куратору
                        </a>
                    </div>
                )}

                {/* Действия */}
                <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={markComplete}
                        disabled={saving || completed}
                        style={
                            completed
                                ? {
                                      ...pillSolid,
                                      background: 'rgba(111,163,224,0.16)',
                                      color: 'var(--text)',
                                      cursor: 'default',
                                  }
                                : { ...pillSolid, opacity: saving ? 0.6 : 1 }
                        }
                    >
                        {completed ? '✓ Урок пройден' : saving ? 'Сохраняю...' : 'Отметить пройденным'}
                    </button>

                    <button
                        onClick={() =>
                            router.push(
                                nextLessonId
                                    ? `/learn/${courseId}/${nextLessonId}`
                                    : `/learn/${courseId}`,
                            )
                        }
                        style={pillOutline}
                    >
                        {nextLessonId ? 'Следующий урок →' : 'К программе курса'}
                    </button>
                </div>
            </main>
        </div>
    );
}
