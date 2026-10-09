'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase';
import { CURATOR_LINK } from '../../../../lib/config';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '../../../../components/AppHeader';
import PdfViewer from '../../../../components/PdfViewer';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stripHtml = (html) =>
    (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();

// старые уроки хранились как обычный текст, у них сохраняем абзацы
const toHtml = (content) => {
    const c = content || '';
    if (/<[a-z][\s\S]*>/i.test(c)) return c;
    return c
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');
};

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
const sectionHeading = {
    fontFamily: 'var(--serif)',
    fontWeight: '700',
    fontSize: '26px',
    color: 'var(--text)',
    margin: 0,
};

export default function LessonPage() {
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoFailed, setVideoFailed] = useState(false);
    const [presUrl, setPresUrl] = useState(null);
    const [presFailed, setPresFailed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [activeTab, setActiveTab] = useState(null);
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
            setVideoFailed(false);
            setPresUrl(null);
            setPresFailed(false);
            setNotFound(false);
            setActiveTab(null);

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

            const [lessonRes, courseRes, listRes, sectionsRes, progRes] = await Promise.all([
                supabase
                    .from('lessons')
                    .select('*, lesson_files(*)')
                    .eq('id', lessonId)
                    .single(),
                supabase.from('courses').select('*').eq('id', courseId).single(),
                supabase
                    .from('lessons')
                    .select('id, title, order_index, section_id, sections!inner(course_id)')
                    .eq('sections.course_id', courseId),
                supabase
                    .from('sections')
                    .select('id, title, order_index')
                    .eq('course_id', courseId)
                    .order('order_index'),
                supabase
                    .from('progress')
                    .select('lesson_id')
                    .eq('user_id', user.id)
                    .eq('completed', true),
            ]);

            if (cancelled) return;

            const allLessons = listRes.data || [];
            let counter = 0;
            const built = (sectionsRes.data || []).map((s) => ({
                id: s.id,
                title: s.title,
                lessons: allLessons
                    .filter((l) => l.section_id === s.id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((l) => ({ id: l.id, title: l.title, number: ++counter })),
            }));

            const inCourse = built.some((g) => g.lessons.some((l) => l.id === lessonId));

            // урок должен принадлежать этому курсу
            if (!lessonRes.data || !inCourse) {
                setNotFound(true);
                return;
            }

            setGroups(built);
            setCompletedIds(new Set((progRes.data || []).map((p) => p.lesson_id)));
            setCourse(courseRes.data);
            setLesson(lessonRes.data);

            if (lessonRes.data.hls_key) {
                try {
                    const res = await fetch('/api/video-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: lessonRes.data.hls_key }),
                    });
                    const data = await res.json();
                    if (!cancelled) {
                        if (data.url) setVideoUrl(data.url);
                        else setVideoFailed(true);
                    }
                } catch {
                    if (!cancelled) setVideoFailed(true);
                }
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
        setPresUrl(null);
        setPresFailed(false);

        const key = isMobile
            ? lesson.presentation_mobile_key || lesson.presentation_desktop_key
            : lesson.presentation_desktop_key || lesson.presentation_mobile_key;

        if (!key) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/video-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key }),
                });
                const data = await res.json();
                if (!cancelled) {
                    if (data.url) setPresUrl(data.url);
                    else setPresFailed(true);
                }
            } catch {
                if (!cancelled) setPresFailed(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [lesson, isMobile]);

    const markComplete = async () => {
        if (saving || completedIds.has(lessonId)) return;
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
        setCompletedIds((prev) => {
            const next = new Set(prev);
            next.add(lessonId);
            return next;
        });
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

    // что реально загружено в этом уроке
    const hasVideo = !!lesson.hls_key;
    const hasNotes = stripHtml(lesson.content).length > 0;
    const hasPresentation = !!(lesson.presentation_desktop_key || lesson.presentation_mobile_key);
    const hasFiles = (lesson.lesson_files?.length || 0) > 0;
    const nothing = !hasVideo && !hasNotes && !hasPresentation && !hasFiles;

    const tabs = [];
    if (hasNotes) tabs.push({ id: 'notes', label: 'Конспект', icon: '📝' });
    if (hasPresentation) tabs.push({ id: 'presentation', label: 'Презентация', icon: '📊' });
    if (hasFiles) tabs.push({ id: 'files', label: 'Файлы', icon: '📎' });

    const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id;
    const gap = hasVideo || tabs.length > 1 ? '26px' : '0px';

    const flat = groups.flatMap((g) => g.lessons);
    const idx = flat.findIndex((l) => l.id === lessonId);
    const lessonNo = idx + 1;
    const nextLessonId = flat[idx + 1]?.id || null;
    const completed = completedIds.has(lessonId);
    const doneCount = flat.filter((l) => completedIds.has(l.id)).length;
    const percent = flat.length > 0 ? Math.round((doneCount / flat.length) * 100) : 0;

    const words = (lesson.title || '').trim().split(/\s+/);
    const titleHead = words.length > 1 ? words.slice(0, -1).join(' ') : '';
    const titleTail = words[words.length - 1] || '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '60px' }}>
            <style>{`
                .lesson-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 36px; }
                .lesson-side { display: none; }
                @media (min-width: 1024px) {
                    .lesson-grid { grid-template-columns: minmax(0, 1fr) 340px; gap: 44px; align-items: start; }
                    .lesson-side { display: block; position: sticky; top: 88px; max-height: calc(100vh - 112px); overflow-y: auto; }
                }
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
                <div className="lesson-grid">
                    {/* Основная колонка */}
                    <div style={{ minWidth: 0 }}>
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
                                fontSize: 'clamp(32px, 6vw, 46px)',
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

                        {/* Видео (только если загружено) */}
                        {hasVideo &&
                            (videoUrl ? (
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        aspectRatio: '16 / 9',
                                        maxHeight: '70vh',
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
                                        maxHeight: '70vh',
                                        borderRadius: '22px',
                                        background: '#143560',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '20px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                        {videoFailed ? 'Не удалось загрузить видео' : 'Загрузка видео...'}
                                    </p>
                                </div>
                            ))}

                        {/* В уроке ещё ничего нет */}
                        {nothing && (
                            <div
                                style={{
                                    padding: '28px 22px',
                                    borderRadius: '22px',
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                                    Материалы урока ещё не добавлены.
                                </p>
                            </div>
                        )}

                        {/* Вкладки: только если разделов два и больше */}
                        {tabs.length > 1 && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap',
                                    marginTop: hasVideo ? '28px' : '0',
                                }}
                            >
                                {tabs.map((t) => {
                                    const active = currentTab === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTab(t.id)}
                                            style={{
                                                flex: '1 1 140px',
                                                padding: '15px 20px',
                                                borderRadius: '999px',
                                                border: active
                                                    ? '1.5px solid var(--accent)'
                                                    : '1.5px solid rgba(111,163,224,0.4)',
                                                background: active ? 'var(--accent)' : 'transparent',
                                                color: active ? 'var(--bg)' : 'var(--text)',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                fontFamily: 'var(--sans)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Конспект */}
                        {currentTab === 'notes' && (
                            <div style={{ paddingTop: gap }}>
                                <div
                                    className="lesson-rich"
                                    dangerouslySetInnerHTML={{ __html: toHtml(lesson.content) }}
                                />
                            </div>
                        )}

                        {/* Презентация */}
                        {currentTab === 'presentation' && (
                            <div style={{ paddingTop: gap }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        marginBottom: '14px',
                                    }}
                                >
                                    {tabs.length === 1 && <h2 style={sectionHeading}>📊 Презентация</h2>}
                                    {presUrl && !showCanvasPdf && (
                                        <button
                                            onClick={() => window.open(presUrl, '_blank')}
                                            style={{
                                                marginLeft: 'auto',
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
                                    )}
                                </div>

                                {presUrl ? (
                                    showCanvasPdf ? (
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
                                    )
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                        {presFailed ? 'Не удалось загрузить презентацию' : 'Загрузка презентации...'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Файлы */}
                        {currentTab === 'files' && (
                            <div style={{ paddingTop: gap }}>
                                {tabs.length === 1 && (
                                    <h2 style={{ ...sectionHeading, marginBottom: '14px' }}>📎 Файлы урока</h2>
                                )}
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
                                    marginTop: '32px',
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
                        <div style={{ marginTop: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={markComplete}
                                disabled={saving || completed}
                                style={{
                                    ...(completed
                                        ? {
                                              ...pillSolid,
                                              background: 'rgba(111,163,224,0.16)',
                                              color: 'var(--text)',
                                              cursor: 'default',
                                          }
                                        : { ...pillSolid, opacity: saving ? 0.6 : 1 }),
                                    flex: '1 1 260px',
                                    width: 'auto',
                                }}
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
                                style={{ ...pillOutline, flex: '1 1 260px', width: 'auto' }}
                            >
                                {nextLessonId ? 'Следующий урок →' : 'К программе курса'}
                            </button>
                        </div>
                    </div>

                    {/* Боковая панель с программой (только на широких экранах) */}
                    <aside className="lesson-side">
                        <div
                            style={{
                                padding: '20px 18px',
                                borderRadius: '22px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <p style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>
                                Программа курса
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                                {course?.title}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    {doneCount} из {flat.length} уроков
                                </span>
                                <span style={{ color: 'var(--text)', fontWeight: '700' }}>{percent}%</span>
                            </div>
                            <div
                                style={{
                                    height: '5px',
                                    borderRadius: '999px',
                                    background: 'rgba(111,163,224,0.18)',
                                    overflow: 'hidden',
                                    marginBottom: '8px',
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

                            {groups
                                .filter((g) => g.lessons.length > 0)
                                .map((g) => (
                                    <div key={g.id} style={{ marginTop: '18px' }}>
                                        <p
                                            style={{
                                                color: 'var(--accent-soft)',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                letterSpacing: '1.5px',
                                                textTransform: 'uppercase',
                                                marginBottom: '6px',
                                                padding: '0 10px',
                                            }}
                                        >
                                            {g.title}
                                        </p>
                                        {g.lessons.map((l) => {
                                            const isCurrent = l.id === lessonId;
                                            const done = completedIds.has(l.id);
                                            return (
                                                <button
                                                    key={l.id}
                                                    onClick={() => router.push(`/learn/${courseId}/${l.id}`)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '10px',
                                                        padding: '10px',
                                                        borderRadius: '12px',
                                                        background: isCurrent ? 'rgba(111,163,224,0.16)' : 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontFamily: 'var(--sans)',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            flex: 'none',
                                                            width: '22px',
                                                            fontFamily: 'var(--serif)',
                                                            fontWeight: '700',
                                                            fontSize: '15px',
                                                            lineHeight: '1.4',
                                                            color: 'var(--accent-soft)',
                                                        }}
                                                    >
                                                        {l.number}
                                                    </span>
                                                    <span
                                                        style={{
                                                            flex: 1,
                                                            fontSize: '14px',
                                                            lineHeight: '1.4',
                                                            fontWeight: isCurrent ? '700' : '500',
                                                            color: isCurrent ? 'var(--text)' : 'var(--text-muted)',
                                                        }}
                                                    >
                                                        {l.title}
                                                    </span>
                                                    {done && (
                                                        <span
                                                            style={{
                                                                flex: 'none',
                                                                width: '18px',
                                                                height: '18px',
                                                                borderRadius: '50%',
                                                                background: 'var(--accent-soft)',
                                                                color: 'var(--bg)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '11px',
                                                                fontWeight: '800',
                                                                marginTop: '2px',
                                                            }}
                                                        >
                                                            ✓
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
