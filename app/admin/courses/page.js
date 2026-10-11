'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

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
const pillDanger = {
    ...pillBase,
    background: 'transparent',
    color: '#fca5a5',
    border: '1.5px solid rgba(248,113,113,0.5)',
};
const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--input-bg)',
    border: '1.5px solid rgba(111,163,224,0.25)',
    borderRadius: '14px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    outline: 'none',
};

export default function AdminCoursesPage() {
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [actingId, setActingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const loadCourses = async () => {
        const { data } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        setCourses(data || []);
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
            await loadCourses();
        };
        init();
    }, []);

    const createCourse = async () => {
        const name = title.trim();
        if (!name || creating) return;
        setCreating(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('courses')
            .insert({
                title: name,
                description: description.trim() || null,
                author_id: user.id,
            })
            .select('id')
            .single();

        setCreating(false);

        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }

        // сразу открываем редактор нового курса
        router.push(`/admin/courses/${data.id}`);
    };

    const togglePublish = async (course) => {
        setActingId(course.id);
        const { data, error } = await supabase
            .from('courses')
            .update({ is_published: !course.is_published })
            .eq('id', course.id)
            .select('id');
        setActingId(null);

        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        if (!data || data.length === 0) {
            alert('Не удалось изменить: нет прав или курс не найден');
            return;
        }
        loadCourses();
    };

    const deleteCourse = async (course) => {
        if (
            !window.confirm(
                `Удалить курс «${course.title}»? Вместе с ним удалятся все его секции и уроки. Это действие нельзя отменить.`,
            )
        )
            return;

        setActingId(course.id);
        const { error } = await supabase.from('courses').delete().eq('id', course.id);
        setActingId(null);

        if (error) alert('Ошибка: ' + error.message);
        loadCourses();
    };

    if (loading || !profile)
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

    const initial = (profile.login || profile.email || '?').trim().charAt(0).toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '26px 20px 0' }}>
                <button
                    onClick={() => router.push('/dashboard')}
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
                    ← Панель
                </button>

                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(32px, 7vw, 46px)',
                        lineHeight: '1.08',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '8px',
                    }}
                >
                    Управление{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        курсами
                    </em>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '28px' }}>
                    Создавайте курсы, наполняйте их уроками и публикуйте для студентов.
                </p>

                {/* Новый курс */}
                <div
                    style={{
                        padding: '22px',
                        borderRadius: '22px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '32px',
                        maxWidth: '720px',
                    }}
                >
                    <p style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '20px', color: 'var(--text)' }}>
                        Новый курс
                    </p>
                    <input
                        type="text"
                        placeholder="Название курса"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') createCourse();
                        }}
                        style={inputStyle}
                    />
                    <textarea
                        placeholder="Описание (необязательно)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                    <button
                        onClick={createCourse}
                        disabled={creating || !title.trim()}
                        style={{
                            ...pillSolid,
                            alignSelf: 'flex-start',
                            padding: '14px 28px',
                            opacity: creating || !title.trim() ? 0.5 : 1,
                            cursor: creating || !title.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {creating ? 'Создаю...' : 'Создать курс'}
                    </button>
                </div>

                {/* Список курсов */}
                {courses.length === 0 ? (
                    <div
                        style={{
                            padding: '28px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Курсов пока нет. Создайте первый выше.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        {courses.map((c) => {
                            const busy = actingId === c.id;
                            return (
                                <article
                                    key={c.id}
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '22px',
                                        padding: '22px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '14px',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                        <h3
                                            style={{
                                                fontFamily: 'var(--serif)',
                                                fontWeight: '700',
                                                fontSize: '22px',
                                                lineHeight: '1.2',
                                                color: 'var(--text)',
                                            }}
                                        >
                                            {c.title}
                                        </h3>
                                        <span
                                            style={{
                                                flex: 'none',
                                                padding: '5px 12px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                background: c.is_published ? 'rgba(52,211,153,0.16)' : 'rgba(255,255,255,0.06)',
                                                color: c.is_published ? '#6ee7b7' : 'var(--text-muted)',
                                            }}
                                        >
                                            {c.is_published ? '✓ Опубликован' : 'Черновик'}
                                        </span>
                                    </div>

                                    <p
                                        style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '14.5px',
                                            lineHeight: '1.55',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {c.description || 'Без описания'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        <button
                                            onClick={() => router.push(`/admin/courses/${c.id}`)}
                                            style={pillSolid}
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => togglePublish(c)}
                                            disabled={busy}
                                            style={{ ...pillOutline, opacity: busy ? 0.6 : 1 }}
                                        >
                                            {c.is_published ? 'Снять с публикации' : 'Опубликовать'}
                                        </button>
                                        <button
                                            onClick={() => deleteCourse(c)}
                                            disabled={busy}
                                            style={{ ...pillDanger, opacity: busy ? 0.6 : 1 }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
