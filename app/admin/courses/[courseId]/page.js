'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '../../../../lib/supabase';
import { useRouter, useParams } from 'next/navigation';

function RichTextEditor({ value, onSave }) {
    const ref = useRef(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (ref.current && !initialized.current) {
            ref.current.innerHTML = value || '';
            initialized.current = true;
        }
    }, [value]);

    const exec = (cmd, val = null) => {
        ref.current?.focus();
        document.execCommand(cmd, false, val);
    };

    const btn = {
        padding: '6px 10px',
        background: '#0a0e1a',
        border: '1px solid #1e2433',
        borderRadius: '6px',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '12px',
        marginRight: '6px',
        marginBottom: '6px',
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H2')} style={btn}>H2</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H3')} style={btn}>H3</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} style={{ ...btn, fontWeight: '700' }}>Ж</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} style={{ ...btn, fontStyle: 'italic' }}>К</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} style={btn}>• Список</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} style={btn}>1. Список</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'P')} style={btn}>Обычный текст</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')} style={btn}>Очистить</button>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onBlur={() => onSave(ref.current.innerHTML)}
                className="lesson-rich"
                style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '10px',
                    background: '#0a0e1a',
                    border: '1px solid #1e2433',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
}

export default function CourseEditorPage() {
    const [profile, setProfile] = useState(null);
    const [course, setCourse] = useState(null);
    const [sections, setSections] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newLesson, setNewLesson] = useState({ title: '', sectionId: '' });
    const [uploadingLesson, setUploadingLesson] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingPres, setUploadingPres] = useState(null);
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

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!['admin', 'superuser', 'owner'].includes(profile?.role)) {
                router.push('/dashboard');
                return;
            }
            setProfile(profile);
            loadData();
        };
        init();
    }, [courseId]);

    const loadData = async () => {
        const { data: course } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        const { data: sections } = await supabase
            .from('sections')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index');

        const { data: lessons } = await supabase
            .from('lessons')
            .select('*, sections!inner(course_id), lesson_files(*)')
            .eq('sections.course_id', courseId)
            .order('order_index');

        setCourse(course);
        setSections(sections || []);
        setLessons(lessons || []);
    };

    const addSection = async () => {
        if (!newSectionTitle.trim()) return;
        const { error } = await supabase.from('sections').insert({
            course_id: courseId,
            title: newSectionTitle,
            order_index: sections.length + 1,
        });
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setNewSectionTitle('');
        loadData();
    };

    const addLesson = async () => {
        if (!newLesson.title.trim() || !newLesson.sectionId) return;
        const { error } = await supabase.from('lessons').insert({
            section_id: newLesson.sectionId,
            title: newLesson.title,
            order_index:
                lessons.filter((l) => l.section_id === newLesson.sectionId)
                    .length + 1,
        });
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setNewLesson({ title: '', sectionId: '' });
        loadData();
    };

    const deleteLesson = async (id) => {
        await supabase.from('lessons').delete().eq('id', id);
        loadData();
    };

    const deleteSection = async (id) => {
        await supabase.from('sections').delete().eq('id', id);
        loadData();
    };

    const handleVideoUpload = async (lessonId, file) => {
        if (!file) return;
        setUploadingLesson(lessonId);
        setUploadProgress(0);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    lessonId,
                }),
            });

            const { signedUrl, key } = await res.json();

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable)
                    setUploadProgress(Math.round((e.loaded / e.total) * 100));
            });

            await new Promise((resolve, reject) => {
                xhr.open('PUT', signedUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.onload = () => (xhr.status === 200 ? resolve() : reject());
                xhr.onerror = reject;
                xhr.send(file);
            });

            await supabase
                .from('lessons')
                .update({ hls_key: key })
                .eq('id', lessonId);
            loadData();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }

        setUploadingLesson(null);
        setUploadProgress(0);
    };

    const handleFileUpload = async (lessonId, file) => {
        if (!file) return;

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    lessonId,
                }),
            });

            const { signedUrl, key } = await res.json();

            await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            await supabase.from('lesson_files').insert({
                lesson_id: lessonId,
                name: file.name,
                file_key: key,
                file_size: file.size,
                file_type: file.type,
            });

            loadData();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    };

    const saveContent = async (lessonId, content) => {
        await supabase.from('lessons').update({ content }).eq('id', lessonId);
        loadData();
    };

    const handlePresentationUpload = async (lessonId, kind, file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Загрузите презентацию в формате PDF');
            return;
        }
        setUploadingPres(`${lessonId}:${kind}`);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    lessonId,
                }),
            });
            const { signedUrl, key } = await res.json();

            const put = await fetch(signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!put.ok) throw new Error('Не удалось загрузить файл');

            const { error } = await supabase
                .from('lessons')
                .update({
                    [`presentation_${kind}_key`]: key,
                    [`presentation_${kind}_name`]: file.name,
                })
                .eq('id', lessonId);
            if (error) throw error;

            loadData();
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
        setUploadingPres(null);
    };

    const removePresentation = async (lessonId, kind) => {
        if (!confirm('Убрать презентацию из урока?')) return;
        const { error } = await supabase
            .from('lessons')
            .update({
                [`presentation_${kind}_key`]: null,
                [`presentation_${kind}_name`]: null,
            })
            .eq('id', lessonId);
        if (error) alert('Ошибка: ' + error.message);
        loadData();
    };

    const presentationSlot = (lesson, kind, label) => {
        const key = lesson[`presentation_${kind}_key`];
        const name = lesson[`presentation_${kind}_name`];
        const busy = uploadingPres === `${lesson.id}:${kind}`;

        return (
            <div style={{ marginTop: '10px' }}>
                <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    {label}
                </label>
                {key && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', background: '#0a0e1a', border: '1px solid #1e2433',
                        borderRadius: '6px', marginBottom: '6px', flexWrap: 'wrap', gap: '6px'
                    }}>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>📊 {name || 'Презентация'}</span>
                        <button onClick={() => removePresentation(lesson.id, kind)} style={{
                            padding: '4px 8px', background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                            color: '#ef4444', cursor: 'pointer', fontSize: '11px'
                        }}>
                            Убрать
                        </button>
                    </div>
                )}
                <label style={{
                    display: 'inline-block', padding: '6px 12px',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '6px', color: '#10b981', fontSize: '11px',
                    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1
                }}>
                    {busy ? 'Загрузка...' : key ? '📊 Заменить PDF' : '📊 Загрузить PDF'}
                    <input
                        type="file" accept="application/pdf" style={{ display: 'none' }}
                        disabled={busy}
                        onChange={e => {
                            handlePresentationUpload(lesson.id, kind, e.target.files[0]);
                            e.target.value = '';
                        }}
                    />
                </label>
            </div>
        );
    };

    const inputStyle = {
        padding: '10px 12px',
        background: '#0a0e1a',
        border: '1px solid #1e2433',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '13px',
        boxSizing: 'border-box',
    };

    const btnStyle = (color) => ({
        padding: '8px 14px',
        background: `rgba(${color},0.1)`,
        border: `1px solid rgba(${color},0.3)`,
        borderRadius: '6px',
        color: `rgb(${color})`,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
    });

       if (!course)
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
        <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'monospace', padding: '20px' }}>
            <style>{`
                .lesson-rich h2 { color: #00e5ff; font-size: 18px; margin: 16px 0 8px; font-family: monospace; }
                .lesson-rich h3 { color: #7c3aed; font-size: 15px; margin: 14px 0 6px; font-family: monospace; }
                .lesson-rich p { margin: 0 0 10px; }
                .lesson-rich ul, .lesson-rich ol { margin: 0 0 10px 20px; padding: 0; }
                .lesson-rich li { margin-bottom: 4px; }
                .lesson-rich strong { color: #fff; }
            `}</style>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: '30px', flexWrap: 'wrap', gap: '16px'
                }}>
                    <div>
                        <h1 style={{ color: '#fff', fontSize: 'clamp(16px, 4vw, 22px)', marginBottom: '4px' }}>📝 {course.title}</h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Управление содержимым курса</p>
                    </div>
                    <button onClick={() => router.push('/admin/courses')} style={{
                        padding: '8px 14px', background: 'transparent',
                        border: '1px solid #1e2433', borderRadius: '6px',
                        color: '#64748b', cursor: 'pointer', fontSize: '13px'
                    }}>
                        ← Назад
                    </button>
                </div>

                {/* Добавить секцию */}
                <div style={{
                    background: '#111827', border: '1px solid #1e2433',
                    borderRadius: '12px', padding: '16px', marginBottom: '16px'
                }}>
                    <h2 style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '12px' }}>+ Новая секция</h2>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                            placeholder="Название секции"
                            value={newSectionTitle}
                            onChange={e => setNewSectionTitle(e.target.value)}
                            style={{
                                flex: 1, minWidth: '200px', padding: '10px 12px',
                                background: '#0a0e1a', border: '1px solid #1e2433',
                                borderRadius: '6px', color: '#fff', fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button onClick={addSection} style={{
                            padding: '10px 16px', background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px',
                            color: '#f59e0b', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                        }}>
                            Добавить
                        </button>
                    </div>
                </div>

                {/* Добавить урок */}
                <div style={{
                    background: '#111827', border: '1px solid #1e2433',
                    borderRadius: '12px', padding: '16px', marginBottom: '24px'
                }}>
                    <h2 style={{ color: '#00e5ff', fontSize: '13px', marginBottom: '12px' }}>+ Новый урок</h2>
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <select
                            value={newLesson.sectionId}
                            onChange={e => setNewLesson({ ...newLesson, sectionId: e.target.value })}
                            style={{
                                width: '100%', padding: '10px 12px',
                                background: '#0a0e1a', border: '1px solid #1e2433',
                                borderRadius: '6px', color: '#fff', fontSize: '13px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">— Выбери секцию —</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                placeholder="Название урока"
                                value={newLesson.title}
                                onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                style={{
                                    flex: 1, minWidth: '200px', padding: '10px 12px',
                                    background: '#0a0e1a', border: '1px solid #1e2433',
                                    borderRadius: '6px', color: '#fff', fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button onClick={addLesson} style={{
                                padding: '10px 16px', background: 'rgba(0,229,255,0.1)',
                                border: '1px solid rgba(0,229,255,0.3)', borderRadius: '6px',
                                color: '#00e5ff', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                            }}>
                                Добавить
                            </button>
                        </div>
                    </div>
                </div>

                {/* Секции и уроки */}
                {sections.map(section => (
                    <div key={section.id} style={{ marginBottom: '20px' }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '10px', flexWrap: 'wrap', gap: '8px'
                        }}>
                            <h3 style={{
                                color: '#94a3b8', fontSize: '11px',
                                letterSpacing: '2px', textTransform: 'uppercase'
                            }}>
                                📂 {section.title}
                            </h3>
                            <button onClick={() => deleteSection(section.id)} style={{
                                padding: '6px 10px', background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                                color: '#ef4444', cursor: 'pointer', fontSize: '11px'
                            }}>
                                Удалить секцию
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {lessons.filter(l => l.section_id === section.id).map(lesson => (
                                <div key={lesson.id} style={{
                                    background: '#111827', border: '1px solid #1e2433',
                                    borderRadius: '8px', padding: '14px'
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: '10px',
                                        flexWrap: 'wrap', gap: '8px'
                                    }}>
                                        <span style={{ color: '#fff', fontSize: '13px' }}>
                                            {lesson.hls_key ? '🎬' : '📄'} {lesson.title}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {lesson.hls_key && (
                                                <span style={{ color: '#10b981', fontSize: '11px' }}>✓ Видео</span>
                                            )}
                                            <button onClick={() => deleteLesson(lesson.id)} style={{
                                                padding: '6px 10px', background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                                                color: '#ef4444', cursor: 'pointer', fontSize: '11px'
                                            }}>
                                                Удалить
                                            </button>
                                        </div>
                                    </div>

                                    {/* Загрузка видео */}
                                    {uploadingLesson === lesson.id ? (
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: '#64748b', fontSize: '11px' }}>Загрузка...</span>
                                                <span style={{ color: '#00e5ff', fontSize: '11px' }}>{uploadProgress}%</span>
                                            </div>
                                            <div style={{ background: '#0a0e1a', borderRadius: '4px', height: '4px' }}>
                                                <div style={{
                                                    width: `${uploadProgress}%`, height: '100%',
                                                    background: 'linear-gradient(90deg, #00e5ff, #7c3aed)',
                                                    borderRadius: '4px', transition: 'width 0.3s'
                                                }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <label style={{
                                            display: 'inline-block', padding: '6px 12px',
                                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
                                            borderRadius: '6px', color: '#7c3aed', cursor: 'pointer', fontSize: '11px'
                                        }}>
                                            🎬 {lesson.hls_key ? 'Заменить видео' : 'Загрузить видео'}
                                            <input
                                                type="file" accept="video/*" style={{ display: 'none' }}
                                                onChange={e => handleVideoUpload(lesson.id, e.target.files[0])}
                                            />
                                        </label>
                                    )}

                                    {/* Текст урока */}
                                                                        {/* Текст урока */}
                                    <div style={{ marginTop: '12px' }}>
                                        <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                                            ТЕКСТ УРОКА
                                        </label>
                                        <RichTextEditor
                                            value={lesson.content || ''}
                                            onSave={(html) => saveContent(lesson.id, html)}
                                        />
                                    </div>

                                    {/* Файлы */}
                                    {presentationSlot(lesson, 'desktop', '🖥 ПРЕЗЕНТАЦИЯ ДЛЯ ПК')}
                                    {presentationSlot(lesson, 'mobile', '📱 ПРЕЗЕНТАЦИЯ ДЛЯ ТЕЛЕФОНА')}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}
