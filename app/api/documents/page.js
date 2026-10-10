'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/AppHeader';
import BottomNav from '../../../components/BottomNav';
import { STATUS_META, formatSize } from '../../../lib/documents';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

const FILTERS = [
    { id: 'pending', label: 'На проверке' },
    { id: 'approved', label: 'Одобрено' },
    { id: 'rejected', label: 'Отклонено' },
    { id: 'all', label: 'Все' },
];

const pillBase = {
    padding: '10px 18px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};
const pillOutline = {
    ...pillBase,
    background: 'transparent',
    color: 'var(--accent-soft)',
    border: '1.5px solid rgba(111,163,224,0.5)',
};
const pillSolid = {
    ...pillBase,
    background: 'var(--accent)',
    color: 'var(--bg)',
    border: 'none',
};
const pillDanger = {
    ...pillBase,
    background: 'transparent',
    color: '#fca5a5',
    border: '1.5px solid rgba(248,113,113,0.5)',
};
const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--input-bg)',
    border: '1.5px solid rgba(111,163,224,0.25)',
    borderRadius: '12px',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    outline: 'none',
};

export default function AdminDocumentsPage() {
    const [profile, setProfile] = useState(null);
    const [types, setTypes] = useState([]);
    const [docs, setDocs] = useState([]);
    const [names, setNames] = useState({});
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [editing, setEditing] = useState(null); // { id, value }
    const router = useRouter();
    const supabase = createClient();

    const load = async () => {
        const [typesRes, docsRes] = await Promise.all([
            supabase.from('document_types').select('*').order('order_index').order('created_at'),
            supabase.from('student_documents').select('*').order('updated_at', { ascending: false }),
        ]);

        const docList = docsRes.data || [];
        setTypes(typesRes.data || []);
        setDocs(docList);

        const ids = [...new Set(docList.map((d) => d.user_id))];
        if (ids.length > 0) {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id, login, email')
                .in('id', ids);
            const map = {};
            (profs || []).forEach((p) => {
                map[p.id] = p.login || p.email || '—';
            });
            setNames(map);
        } else {
            setNames({});
        }
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
                router.replace('/courses');
                return;
            }
            setProfile(prof);
            await load();
        };
        init();
    }, []);

    const openDoc = async (doc) => {
        const win = window.open('', '_blank');
        try {
            const res = await fetch('/api/documents/url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: doc.id }),
            });
            const data = await res.json();
            if (!res.ok || !data.url) throw new Error(data.error || 'Не удалось открыть файл');
            if (win) win.location.href = data.url;
            else window.location.href = data.url;
        } catch (e) {
            if (win) win.close();
            alert(e.message);
        }
    };

    const review = async (doc, status) => {
        let comment = '';
        if (status === 'rejected') {
            const input = window.prompt('Причина отклонения (её увидит студент):', '');
            if (input === null) return;
            comment = input;
        }

        setActing(doc.id);
        const res = await fetch('/api/documents/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: doc.id, status, comment }),
        });
        const data = await res.json();
        if (!res.ok) alert(data.error || 'Ошибка');
        await load();
        setActing(null);
    };

    const addType = async () => {
        const title = newTitle.trim();
        if (!title) return;
        const { error } = await supabase.from('document_types').insert({
            title,
            description: newDesc.trim() || null,
            order_index: types.length + 1,
        });
        if (error) {
            alert('Ошибка: ' + error.message);
            return;
        }
        setNewTitle('');
        setNewDesc('');
        load();
    };

    const saveRename = async () => {
        if (!editing) return;
        const title = editing.value.trim();
        if (!title) {
            alert('Название не может быть пустым');
            return;
        }
        const { data, error } = await supabase
            .from('document_types')
            .update({ title })
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
        load();
    };

    const deleteType = async (t) => {
        const count = docs.filter((d) => d.type_id === t.id).length;
        const warn =
            count > 0
                ? `\n\nФайлы студентов по этому пункту (${count}) пропадут из списка.`
                : '';
        if (!window.confirm(`Удалить «${t.title}» из списка документов?${warn}`)) return;
        const { error } = await supabase.from('document_types').delete().eq('id', t.id);
        if (error) alert('Ошибка: ' + error.message);
        load();
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

    const displayName = profile.login || profile.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const typeTitle = Object.fromEntries(types.map((t) => [t.id, t.title]));
    const counts = {
        pending: docs.filter((d) => d.status === 'pending').length,
        approved: docs.filter((d) => d.status === 'approved').length,
        rejected: docs.filter((d) => d.status === 'rejected').length,
        all: docs.length,
    };
    const visible = filter === 'all' ? docs : docs.filter((d) => d.status === filter);

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
                        marginBottom: '24px',
                    }}
                >
                    Документы{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        студентов
                    </em>
                </h1>

                {/* Фильтры */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
                    {FILTERS.map((f) => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                style={{
                                    ...pillBase,
                                    background: active ? 'var(--accent)' : 'transparent',
                                    color: active ? 'var(--bg)' : 'var(--text)',
                                    border: active
                                        ? '1.5px solid var(--accent)'
                                        : '1.5px solid rgba(111,163,224,0.4)',
                                }}
                            >
                                {f.label} ({counts[f.id]})
                            </button>
                        );
                    })}
                </div>

                {/* Загруженные документы */}
                {visible.length === 0 ? (
                    <div
                        style={{
                            padding: '24px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            {filter === 'pending' ? 'Нет документов, ожидающих проверки.' : 'Здесь пока пусто.'}
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                            gap: '14px',
                        }}
                    >
                        {visible.map((d) => {
                            const meta = STATUS_META[d.status] || STATUS_META.none;
                            const busy = acting === d.id;
                            return (
                                <article
                                    key={d.id}
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '20px',
                                        padding: '18px 20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ color: 'var(--text)', fontWeight: '700', fontSize: '15px', wordBreak: 'break-word' }}>
                                                {names[d.user_id] || '—'}
                                            </p>
                                            <p style={{ fontFamily: 'var(--serif)', fontWeight: '600', fontSize: '18px', color: 'var(--accent-soft)' }}>
                                                {typeTitle[d.type_id] || 'Документ'}
                                            </p>
                                        </div>
                                        <span
                                            style={{
                                                flex: 'none',
                                                padding: '5px 12px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                background: meta.bg,
                                                color: meta.color,
                                            }}
                                        >
                                            {meta.label}
                                        </span>
                                    </div>

                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', wordBreak: 'break-word' }}>
                                        📎 {d.file_name}
                                        {d.file_size ? ` · ${formatSize(d.file_size)}` : ''} ·{' '}
                                        {new Date(d.updated_at).toLocaleDateString('ru-RU')}
                                    </p>

                                    {d.status === 'rejected' && d.comment && (
                                        <p style={{ color: '#fca5a5', fontSize: '13px' }}>Причина: {d.comment}</p>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        <button onClick={() => openDoc(d)} style={pillOutline}>
                                            Открыть
                                        </button>
                                        {d.status !== 'approved' && (
                                            <button
                                                onClick={() => review(d, 'approved')}
                                                disabled={busy}
                                                style={{ ...pillSolid, opacity: busy ? 0.6 : 1 }}
                                            >
                                                Одобрить
                                            </button>
                                        )}
                                        {d.status !== 'rejected' && (
                                            <button
                                                onClick={() => review(d, 'rejected')}
                                                disabled={busy}
                                                style={{ ...pillDanger, opacity: busy ? 0.6 : 1 }}
                                            >
                                                Отклонить
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Список нужных документов */}
                <section style={{ marginTop: '48px' }}>
                    <h2
                        style={{
                            fontFamily: 'var(--serif)',
                            fontWeight: '700',
                            fontSize: '28px',
                            color: 'var(--text)',
                            marginBottom: '8px',
                        }}
                    >
                        Список документов
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '20px' }}>
                        Эти пункты видят и заполняют студенты.
                    </p>

                    <div style={{ borderTop: '1px solid var(--border-soft)' }}>
                        {types.map((t) => {
                            const isEditing = editing && editing.id === t.id;
                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        padding: '16px 0',
                                        borderBottom: '1px solid var(--border-soft)',
                                    }}
                                >
                                    {isEditing ? (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: '220px' }}>
                                            <input
                                                autoFocus
                                                value={editing.value}
                                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveRename();
                                                    if (e.key === 'Escape') setEditing(null);
                                                }}
                                                style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
                                            />
                                            <button onClick={saveRename} style={pillSolid}>
                                                Сохранить
                                            </button>
                                            <button onClick={() => setEditing(null)} style={pillOutline}>
                                                Отмена
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ color: 'var(--text)', fontSize: '16px', fontWeight: '600' }}>{t.title}</p>
                                                {t.description && (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.description}</p>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setEditing({ id: t.id, value: t.title })}
                                                    style={pillOutline}
                                                >
                                                    ✏️ Переименовать
                                                </button>
                                                <button onClick={() => deleteType(t)} style={pillDanger}>
                                                    Удалить
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        {types.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', padding: '16px 0' }}>
                                Список пуст. Добавьте первый документ ниже.
                            </p>
                        )}
                    </div>

                    <div
                        style={{
                            marginTop: '22px',
                            padding: '20px',
                            borderRadius: '20px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <p style={{ color: 'var(--text)', fontWeight: '700', fontSize: '15px' }}>Новый документ</p>
                        <input
                            placeholder="Название, например «Справка с университета»"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Подсказка для студента (необязательно)"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            style={inputStyle}
                        />
                        <button onClick={addType} style={{ ...pillSolid, alignSelf: 'flex-start', padding: '12px 24px' }}>
                            Добавить
                        </button>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
