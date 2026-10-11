'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '../../../../components/AppHeader';
import BottomNav from '../../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];
const BIG_VIDEO_MB = 300;
const BIG_PDF_MB = 15;

const pillBase = {
    padding: '11px 18px',
    borderRadius: '999px',
    fontSize: '13.5px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};
const pillSolid = { ...pillBase, background: 'var(--accent)', color: 'var(--bg)', border: 'none' };
const pillOutline = {
    ...pillBase,
    background: 'transparent',
    color: 'var(--accent-soft)',
    border: '1.5px solid rgba(111,163,224,0.5)',
};
const pillMuted = {
    ...pillBase,
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1.5px solid rgba(157,176,204,0.35)',
};
const pillDanger = {
    ...pillBase,
    background: 'transparent',
    color: '#fca5a5',
    border: '1.5px solid rgba(248,113,113,0.5)',
};
const small = { padding: '8px 14px', fontSize: '12.5px' };

const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: 'var(--input-bg)',
    border: '1.5px solid rgba(111,163,224,0.25)',
    borderRadius: '14px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    outline: 'none',
};

const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '22px',
};

const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stripHtml = (html) =>
    (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();

// старые уроки хранились как обычный текст, превращаем их в абзацы
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

/* ---------- Редактор текста ---------- */

function RichTextEditor({ value, onSave }) {
    const ref = useRef(null);
    const initialized = useRef(false);
    const lastSaved = useRef(value || '');
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        if (ref.current && !initialized.current) {
            ref.current.innerHTML = toHtml(value);
            initialized.current = true;
        }
    }, []);

    const exec = (cmd, val = null) => {
        ref.current?.focus();
        document.execCommand(cmd, false, val);
    };

    const save = async () => {
        const html = ref.current ? ref.current.innerHTML : '';
        const cleaned = stripHtml(html) === '' ? '' : html;
        if (cleaned === lastSaved.current) return;

        setStatus('saving');
        const ok = await onSave(cleaned);
        if (ok) {
            lastSaved.current = cleaned;
            setStatus('saved');
            setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
        } else {
            setStatus('error');
        }
    };

    const tbtn = {
        padding: '7px 12px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontWeight: '600',
        fontFamily: 'var(--sans)',
    };

    const tool = (label, cmd, arg, extra = {}) => (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(cmd, arg)}
            style={{ ...tbtn, ...extra }}
        >
            {label}
        </button>
    );

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
                {tool('H2', 'formatBlock', 'H2')}
                {tool('H3', 'formatBlock', 'H3')}
                {tool('Ж', 'bold', null, { fontWeight: '800' })}
                {tool('К', 'italic', null, { fontStyle: 'italic' })}
                {tool('• Список', 'insertUnorderedList')}
                {tool('1. Список', 'insertOrderedList')}
                {tool('Обычный текст', 'formatBlock', 'P')}
                {tool('Очистить', 'removeFormat')}
                <span
                    style={{
                        marginLeft: 'auto',
                        fontSize: '12.5px',
                        color:
                            status === 'error'
                                ? '#ff9b9b'
                                : status === 'saved'
                                ? '#6ee7b7'
                                : 'var(--text-faint)',
                    }}
                >
                    {status === 'saving' && 'Сохранение...'}
                    {status === 'saved' && '✓ Сохранено'}
                    {status === 'error' && 'Не удалось сохранить'}
                </span>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                className="lesson-rich"
                onFocus={() => {
                    try {
                        document.execCommand('defaultParagraphSeparator', false, 'p');
                    } catch {
                        // не критично
                    }
                }}
                onPaste={(e) => {
                    // вставляем только текст: чужое оформление ломает цвета темы
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                }}
                onBlur={save}
            />
        </div>
    );
}

/* ---------- Блок загрузки файла (видео, презентации) ---------- */

function MediaSlot({ icon, title, hint, filled, fileName, percent, accept, onPick, onRemove }) {
    const busy = percent !== undefined && percent !== null;

    return (
        <div
            style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                <p style={{ color: 'var(--text)', fontWeight: '700', fontSize: '14px' }}>
                    {icon} {title}
                </p>
                <span
                    style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        background: filled ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.06)',
                        color: filled ? '#6ee7b7' : 'var(--text-muted)',
                    }}
                >
                    {filled ? 'Загружено' : 'Нет'}
                </span>
            </div>

            {hint && (
                <p style={{ color: 'var(--text-faint)', fontSize: '12px', lineHeight: '1.4' }}>{hint}</p>
            )}
            {filled && fileName && (
                <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', wordBreak: 'break-word' }}>
                    {fileName}
                </p>
            )}

            {busy ? (
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            marginBottom: '6px',
                        }}
                    >
                        <span>Загрузка...</span>
                        <span>{percent}%</span>
                    </div>
                    <div
                        style={{
                            height: '5px',
                            borderRadius: '999px',
                            background: 'rgba(111,163,224,0.18)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: 'var(--accent-soft)',
                                transition: 'width 0.3s',
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label style={{ ...pillOutline, ...small, display: 'inline-block' }}>
                        {filled ? 'Заменить' : 'Загрузить'}
                        <input
                            type="file"
                            accept={accept}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const f = e.target.files[0];
                                e.target.value = '';
                                if (f) onPick(f);
                            }}
                        />
                    </label>
                    {filled && (
                        <button onClick={onRemove} style={{ ...pillDanger, ...small }}>
                            Убрать
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ---------- Страница ---------- */

export default function CourseEditorPage() {
    const [profile, setProfile] = useState(null);
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newLessonTitles, setNewLessonTitles] = useState({});
    const [expanded, setExpanded] = useState(new Set());
    const [uploads, setUploads] = useState({});
    const [editing, setEditing] = useState(null); // { type: 'section' | 'lesson', id, value }
    const [courseForm, setCourseForm] = useState(null); // { title, description }
    const [busy, setBusy] = useState(false);
    const router = useRouter();
    const { courseId } = useParams();
    const supabase = createClient();

    const loadData = async () => {
        const [courseRes, sectionsRes, lessonsRes] = await Promise.all([
            supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
            supabase
                .from('sections')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index'),
            supabase
                .from('lessons')
                .select('*, sections!inner(course_id)')
                .eq('sections.course_id', courseId)
                .order('order_index'),
        ]);

        if (!courseRes.data) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        setCourse(courseRes.data);
        setSections(sectionsRes.data || []);
        setLessons(lessonsRes.data || []);
        setLoading(false);
    };

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
            setProfile(prof);
            await loadData();
        };
        init();
    }, [courseId]);

    /* ----- курс ----- */

    const saveCourse = async () => {
        const title = courseForm.title.trim();
        if (!title) {
            alert('Название курса не может быть пустым');
            return;
        }
        setBusy(true);
        const { data, error } = await supabase
            .from('courses')
            .update({ title, description: courseForm.description.trim() || null })
            .eq('id', courseId)
            .select('id');
        setBusy(false);

        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        if (!data || data.length === 0) {
            alert('Не удалось сохранить: нет прав или курс не найден');
            return;
        }
        setCourseForm(null);
        loadData();
    };

    const togglePublish = async () => {
        setBusy(true);
        const { data, error } = await supabase
            .from('courses')
            .update({ is_published: !course.is_published })
            .eq('id', courseId)
            .select('id');
        setBusy(false);

        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        if (!data || data.length === 0) {
            alert('Не удалось изменить: нет прав или курс не найден');
            return;
        }
        loadData();
    };

    /* ----- секции и уроки ----- */

    const addSection = async () => {
        const title = newSectionTitle.trim();
        if (!title) return;
        const nextIndex = Math.max(0, ...sections.map((s) => s.order_index || 0)) + 1;

        const { error } = await supabase
            .from('sections')
            .insert({ course_id: courseId, title, order_index: nextIndex });
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setNewSectionTitle('');
        loadData();
    };

    const addLesson = async (sectionId) => {
        const title = (newLessonTitles[sectionId] || '').trim();
        if (!title) return;
        const inSection = lessons.filter((l) => l.section_id === sectionId);
        const nextIndex = Math.max(0, ...inSection.map((l) => l.order_index || 0)) + 1;

        const { data, error } = await supabase
            .from('lessons')
            .insert({ section_id: sectionId, title, order_index: nextIndex })
            .select('id')
            .single();
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setNewLessonTitles((prev) => ({ ...prev, [sectionId]: '' }));
        setExpanded((prev) => new Set(prev).add(data.id));
        await loadData();
    };

    const deleteLesson = async (lesson) => {
        if (!window.confirm(`Удалить урок «${lesson.title}»? Это действие нельзя отменить.`)) return;
        const { error } = await supabase.from('lessons').delete().eq('id', lesson.id);
        if (error) alert('Ошибка: ' + error.message);
        loadData();
    };

    const deleteSection = async (section) => {
        const count = lessons.filter((l) => l.section_id === section.id).length;
        const warn = count > 0 ? ` Вместе с ней удалятся все уроки секции (${count}).` : '';
        if (!window.confirm(`Удалить секцию «${section.title}»?${warn} Это действие нельзя отменить.`)) return;
        const { error } = await supabase.from('sections').delete().eq('id', section.id);
        if (error) alert('Ошибка: ' + error.message);
        loadData();
    };

    const saveRename = async () => {
        if (!editing) return;
        const value = editing.value.trim();
        if (!value) {
            alert('Название не может быть пустым');
            return;
        }

        const table = editing.type === 'section' ? 'sections' : 'lessons';
        const { data, error } = await supabase
            .from(table)
            .update({ title: value })
            .eq('id', editing.id)
            .select('id');

        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        if (!data || data.length === 0) {
            alert('Не удалось сохранить: нет прав или запись не найдена');
            return;
        }
        setEditing(null);
        loadData();
    };

    const toggleExpanded = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /* ----- текст урока ----- */

    const saveContent = async (lessonId, html) => {
        const { data, error } = await supabase
            .from('lessons')
            .update({ content: html })
            .eq('id', lessonId)
            .select('id');

        if (error || !data || data.length === 0) {
            alert('Не удалось сохранить текст: ' + (error?.message || 'нет прав или урок не найден'));
            return false;
        }
        setLessons((prev) => prev.map((l) => (l.id === lessonId ? { ...l, content: html } : l)));
        return true;
    };

    /* ----- загрузка файлов ----- */

    const setProgress = (id, value) => {
        setUploads((prev) => {
            const next = { ...prev };
            if (value === null) delete next[id];
            else next[id] = value;
            return next;
        });
    };

    const uploadToR2 = async (lessonId, file, onProgress) => {
        const contentType = file.type || 'application/octet-stream';

        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileType: contentType, lessonId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.signedUrl) {
            throw new Error(data.error || 'Не удалось получить ссылку для загрузки');
        }

        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
            });
            xhr.onload = () =>
                xhr.status >= 200 && xhr.status < 300
                    ? resolve()
                    : reject(new Error(`Хранилище вернуло ошибку ${xhr.status}`));
            xhr.onerror = () => reject(new Error('Сбой сети при загрузке'));
            xhr.open('PUT', data.signedUrl);
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.send(file);
        });

        return data.key;
    };

    const uploadVideo = async (lesson, file) => {
        if (!file.type.startsWith('video/')) {
            alert('Выберите видеофайл');
            return;
        }
        const mb = file.size / 1024 / 1024;
        if (
            mb > BIG_VIDEO_MB &&
            !window.confirm(
                `Видео весит ${Math.round(mb)} МБ. Такие файлы медленно грузятся и открываются, особенно у студентов на телефонах. Лучше сначала сжать его (например, в HandBrake). Загрузить как есть?`,
            )
        )
            return;

        const id = `${lesson.id}:video`;
        setProgress(id, 0);
        try {
            const key = await uploadToR2(lesson.id, file, (p) => setProgress(id, p));
            const { error } = await supabase.from('lessons').update({ hls_key: key }).eq('id', lesson.id);
            if (error) throw error;
            await loadData();
        } catch (e) {
            alert('Ошибка загрузки: ' + (e.message || 'неизвестная ошибка'));
        }
        setProgress(id, null);
    };

    const removeVideo = async (lesson) => {
        if (!window.confirm('Убрать видео из урока?')) return;
        const { error } = await supabase.from('lessons').update({ hls_key: null }).eq('id', lesson.id);
        if (error) alert('Ошибка: ' + error.message);
        loadData();
    };

    const uploadPresentation = async (lesson, kind, file) => {
        if (file.type !== 'application/pdf') {
            alert('Загрузите презентацию в формате PDF');
            return;
        }
        const mb = file.size / 1024 / 1024;
        if (
            mb > BIG_PDF_MB &&
            !window.confirm(
                `Презентация весит ${Math.round(mb)} МБ. Она будет долго открываться у студентов. Лучше сначала уменьшить размер файла. Загрузить как есть?`,
            )
        )
            return;

        const id = `${lesson.id}:${kind}`;
        setProgress(id, 0);
        try {
            const key = await uploadToR2(lesson.id, file, (p) => setProgress(id, p));
            const { error } = await supabase
                .from('lessons')
                .update({
                    [`presentation_${kind}_key`]: key,
                    [`presentation_${kind}_name`]: file.name,
                })
                .eq('id', lesson.id);
            if (error) throw error;
            await loadData();
        } catch (e) {
            alert('Ошибка загрузки: ' + (e.message || 'неизвестная ошибка'));
        }
        setProgress(id, null);
    };

    const removePresentation = async (lesson, kind) => {
        if (!window.confirm('Убрать презентацию из урока?')) return;
        const { error } = await supabase
            .from('lessons')
            .update({
                [`presentation_${kind}_key`]: null,
                [`presentation_${kind}_name`]: null,
            })
            .eq('id', lesson.id);
        if (error) alert('Ошибка: ' + error.message);
        loadData();
    };

    /* ----- общие куски разметки ----- */

    const renameForm = (type) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: '220px' }}>
            <input
                autoFocus
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') setEditing(null);
                }}
                style={{ ...inputStyle, flex: 1, minWidth: '180px', padding: '10px 14px' }}
            />
            <button onClick={saveRename} style={{ ...pillSolid, ...small }}>
                Сохранить
            </button>
            <button onClick={() => setEditing(null)} style={{ ...pillMuted, ...small }}>
                Отмена
            </button>
        </div>
    );

    const chip = (filled, label) => (
        <span
            style={{
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: '700',
                background: filled ? 'rgba(111,163,224,0.18)' : 'rgba(255,255,255,0.04)',
                color: filled ? '#9cc0f0' : 'var(--text-faint)',
            }}
        >
            {label}
        </span>
    );

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
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--sans)' }}>Загрузка...</p>
            </div>
        );

    const initial = ((profile?.login || profile?.email || '?') + '').trim().charAt(0).toUpperCase();

    if (notFound)
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
                <AppHeader initial={initial} maxWidth={MAX_WIDTH} />
                <div style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '48px 20px' }}>
                    <h1 style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '30px', color: 'var(--text)', marginBottom: '16px' }}>
                        Курс не найден
                    </h1>
                    <button onClick={() => router.push('/admin/courses')} style={pillOutline}>
                        К списку курсов
                    </button>
                </div>
            </div>
        );

    let lessonNumber = 0;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <style>{`
                .lesson-rich { width: 100%; min-height: 170px; padding: 14px 16px; background: var(--input-bg); border: 1.5px solid rgba(111,163,224,0.25); border-radius: 14px; color: var(--text-muted); font-size: 15px; line-height: 1.7; box-sizing: border-box; outline: none; }
                .lesson-rich:focus { border-color: rgba(111,163,224,0.7); }
                .lesson-rich h2 { font-family: var(--serif); font-weight: 700; color: var(--text); font-size: 24px; line-height: 1.2; margin: 18px 0 10px; }
                .lesson-rich h2:first-child { margin-top: 0; }
                .lesson-rich h3 { font-family: var(--serif); font-weight: 600; color: var(--text); font-size: 19px; margin: 16px 0 8px; }
                .lesson-rich p, .lesson-rich div { margin: 0 0 12px; }
                .lesson-rich strong { color: var(--text); }
                .lesson-rich em { color: var(--accent-soft); }
                .lesson-rich ul, .lesson-rich ol { margin: 0 0 14px 22px; padding: 0; }
                .lesson-rich li { margin-bottom: 6px; color: var(--text); }
            `}</style>

            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push('/admin/courses')}
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
                    ← Все курсы
                </button>

                {/* Шапка курса */}
                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '12px' }}>
                    Редактор курса
                </p>

                {courseForm ? (
                    <div style={{ ...cardStyle, padding: '22px', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                            placeholder="Название курса"
                            style={inputStyle}
                        />
                        <textarea
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                            placeholder="Описание курса"
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={saveCourse} disabled={busy} style={{ ...pillSolid, opacity: busy ? 0.6 : 1 }}>
                                Сохранить
                            </button>
                            <button onClick={() => setCourseForm(null)} style={pillMuted}>
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1
                            style={{
                                fontFamily: 'var(--serif)',
                                fontWeight: '800',
                                fontSize: 'clamp(30px, 6vw, 44px)',
                                lineHeight: '1.1',
                                letterSpacing: '-1px',
                                color: 'var(--text)',
                                marginBottom: '10px',
                            }}
                        >
                            {course.title}
                        </h1>
                        {course.description && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '15.5px', lineHeight: '1.6', maxWidth: '64ch', marginBottom: '16px' }}>
                                {course.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '999px',
                                    fontSize: '12.5px',
                                    fontWeight: '700',
                                    background: course.is_published ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.06)',
                                    color: course.is_published ? '#6ee7b7' : 'var(--text-muted)',
                                }}
                            >
                                {course.is_published ? '✓ Опубликован' : 'Черновик'}
                            </span>
                            <button
                                onClick={togglePublish}
                                disabled={busy}
                                style={{ ...pillSolid, ...small, opacity: busy ? 0.6 : 1 }}
                            >
                                {course.is_published ? 'Снять с публикации' : 'Опубликовать'}
                            </button>
                            <button
                                onClick={() =>
                                    setCourseForm({ title: course.title, description: course.description || '' })
                                }
                                style={{ ...pillOutline, ...small }}
                            >
                                ✏️ Название и описание
                            </button>
                            <button
                                onClick={() => router.push(`/learn/${courseId}`)}
                                style={{ ...pillOutline, ...small }}
                            >
                                Открыть как студент
                            </button>
                        </div>
                    </>
                )}

                {/* Новая секция */}
                <div
                    style={{
                        ...cardStyle,
                        marginTop: '32px',
                        padding: '18px 20px',
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <p style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '18px', color: 'var(--text)', marginRight: '6px' }}>
                        Новая секция
                    </p>
                    <input
                        placeholder="Название секции"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') addSection();
                        }}
                        style={{ ...inputStyle, flex: 1, minWidth: '200px', padding: '11px 14px' }}
                    />
                    <button
                        onClick={addSection}
                        disabled={!newSectionTitle.trim()}
                        style={{ ...pillSolid, opacity: newSectionTitle.trim() ? 1 : 0.5 }}
                    >
                        Добавить
                    </button>
                </div>

                {sections.length === 0 && (
                    <div style={{ ...cardStyle, marginTop: '20px', padding: '28px 22px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Секций пока нет. Создайте первую выше, затем добавляйте в неё уроки.
                        </p>
                    </div>
                )}

                {/* Секции и уроки */}
                {sections.map((section) => {
                    const sectionLessons = lessons
                        .filter((l) => l.section_id === section.id)
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                    const renamingSection =
                        editing && editing.type === 'section' && editing.id === section.id;

                    return (
                        <section key={section.id} style={{ ...cardStyle, marginTop: '22px', padding: '20px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                    marginBottom: '14px',
                                }}
                            >
                                {renamingSection ? (
                                    renameForm('section')
                                ) : (
                                    <p
                                        style={{
                                            fontFamily: 'var(--serif)',
                                            fontWeight: '700',
                                            fontSize: '22px',
                                            color: 'var(--text)',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {section.title}{' '}
                                        <span style={{ color: 'var(--text-faint)', fontSize: '14px', fontWeight: '500' }}>
                                            · уроков: {sectionLessons.length}
                                        </span>
                                    </p>
                                )}
                                {!renamingSection && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() =>
                                                setEditing({ type: 'section', id: section.id, value: section.title })
                                            }
                                            style={{ ...pillOutline, ...small }}
                                        >
                                            ✏️ Переименовать
                                        </button>
                                        <button onClick={() => deleteSection(section)} style={{ ...pillDanger, ...small }}>
                                            Удалить
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Уроки */}
                            <div style={{ borderTop: '1px solid var(--border-soft)' }}>
                                {sectionLessons.map((lesson) => {
                                    lessonNumber += 1;
                                    const number = lessonNumber;
                                    const isOpen = expanded.has(lesson.id);
                                    const hasVideo = !!lesson.hls_key;
                                    const hasText = stripHtml(lesson.content).length > 0;
                                    const hasPres = !!(
                                        lesson.presentation_desktop_key || lesson.presentation_mobile_key
                                    );
                                    const renamingLesson =
                                        editing && editing.type === 'lesson' && editing.id === lesson.id;

                                    return (
                                        <div key={lesson.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    flexWrap: 'wrap',
                                                    padding: '14px 0',
                                                }}
                                            >
                                                {renamingLesson ? (
                                                    renameForm('lesson')
                                                ) : (
                                                    <button
                                                        onClick={() => toggleExpanded(lesson.id)}
                                                        style={{
                                                            flex: 1,
                                                            minWidth: '200px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontFamily: 'var(--sans)',
                                                            padding: 0,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                flex: 'none',
                                                                color: 'var(--accent-soft)',
                                                                fontSize: '22px',
                                                                width: '16px',
                                                                transform: isOpen ? 'rotate(90deg)' : 'none',
                                                                transition: 'transform 0.2s',
                                                            }}
                                                        >
                                                            ›
                                                        </span>
                                                        <span
                                                            style={{
                                                                flex: 'none',
                                                                fontFamily: 'var(--serif)',
                                                                fontWeight: '700',
                                                                fontSize: '17px',
                                                                color: 'var(--accent-soft)',
                                                                minWidth: '24px',
                                                            }}
                                                        >
                                                            {number}
                                                        </span>
                                                        <span style={{ flex: 1, minWidth: 0 }}>
                                                            <span
                                                                style={{
                                                                    display: 'block',
                                                                    color: 'var(--text)',
                                                                    fontSize: '16px',
                                                                    fontWeight: '600',
                                                                    marginBottom: '6px',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                {lesson.title}
                                                            </span>
                                                            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                {chip(hasVideo, '🎬 Видео')}
                                                                {chip(hasText, '📝 Текст')}
                                                                {chip(hasPres, '📊 Презентация')}
                                                            </span>
                                                        </span>
                                                    </button>
                                                )}

                                                {!renamingLesson && (
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button
                                                            onClick={() =>
                                                                setEditing({ type: 'lesson', id: lesson.id, value: lesson.title })
                                                            }
                                                            style={{ ...pillOutline, ...small }}
                                                        >
                                                            ✏️ Переименовать
                                                        </button>
                                                        <button onClick={() => deleteLesson(lesson)} style={{ ...pillDanger, ...small }}>
                                                            Удалить
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isOpen && (
                                                <div style={{ padding: '4px 0 22px' }}>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                                            gap: '12px',
                                                            marginBottom: '20px',
                                                        }}
                                                    >
                                                        <MediaSlot
                                                            icon="🎬"
                                                            title="Видео урока"
                                                            hint="Лучше 720p–1080p, до 300 МБ"
                                                            filled={hasVideo}
                                                            fileName="Видео добавлено"
                                                            percent={uploads[`${lesson.id}:video`]}
                                                            accept="video/*"
                                                            onPick={(f) => uploadVideo(lesson, f)}
                                                            onRemove={() => removeVideo(lesson)}
                                                        />
                                                        <MediaSlot
                                                            icon="🖥"
                                                            title="Презентация для ПК"
                                                            hint="PDF, горизонтальная, до 15 МБ"
                                                            filled={!!lesson.presentation_desktop_key}
                                                            fileName={lesson.presentation_desktop_name}
                                                            percent={uploads[`${lesson.id}:desktop`]}
                                                            accept="application/pdf"
                                                            onPick={(f) => uploadPresentation(lesson, 'desktop', f)}
                                                            onRemove={() => removePresentation(lesson, 'desktop')}
                                                        />
                                                        <MediaSlot
                                                            icon="📱"
                                                            title="Презентация для телефона"
                                                            hint="PDF, вертикальная, до 15 МБ"
                                                            filled={!!lesson.presentation_mobile_key}
                                                            fileName={lesson.presentation_mobile_name}
                                                            percent={uploads[`${lesson.id}:mobile`]}
                                                            accept="application/pdf"
                                                            onPick={(f) => uploadPresentation(lesson, 'mobile', f)}
                                                            onRemove={() => removePresentation(lesson, 'mobile')}
                                                        />
                                                    </div>

                                                    <p style={{ color: 'var(--text)', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>
                                                        📝 Текст урока
                                                    </p>
                                                    <RichTextEditor
                                                        key={lesson.id}
                                                        value={lesson.content || ''}
                                                        onSave={(html) => saveContent(lesson.id, html)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {sectionLessons.length === 0 && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '14px 0' }}>
                                        В этой секции пока нет уроков.
                                    </p>
                                )}
                            </div>

                            {/* Новый урок в этой секции */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                                <input
                                    placeholder="Название нового урока"
                                    value={newLessonTitles[section.id] || ''}
                                    onChange={(e) =>
                                        setNewLessonTitles((prev) => ({ ...prev, [section.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addLesson(section.id);
                                    }}
                                    style={{ ...inputStyle, flex: 1, minWidth: '200px', padding: '11px 14px' }}
                                />
                                <button
                                    onClick={() => addLesson(section.id)}
                                    disabled={!(newLessonTitles[section.id] || '').trim()}
                                    style={{
                                        ...pillOutline,
                                        opacity: (newLessonTitles[section.id] || '').trim() ? 1 : 0.5,
                                    }}
                                >
                                    + Добавить урок
                                </button>
                            </div>
                        </section>
                    );
                })}
            </main>

            <BottomNav />
        </div>
    );
}
