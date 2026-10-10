'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';
import {
    ALLOWED_DOC_TYPES,
    ALLOWED_DOC_LABEL,
    DOC_ACCEPT,
    MAX_DOC_SIZE,
    STATUS_META,
    formatSize,
} from '../../lib/documents';

const MAX_WIDTH = 1180;
const STAFF = ['admin', 'superuser', 'owner'];

const pillOutline = {
    padding: '11px 20px',
    borderRadius: '999px',
    border: '1.5px solid rgba(111,163,224,0.5)',
    background: 'transparent',
    color: 'var(--accent-soft)',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
};

export default function DocumentsPage() {
    const [profile, setProfile] = useState(null);
    const [types, setTypes] = useState([]);
    const [docs, setDocs] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [msg, setMsg] = useState(null);
    const router = useRouter();
    const supabase = createClient();

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

            // у персонала своя страница проверки
            if (STAFF.includes(prof?.role)) {
                router.replace('/admin/documents');
                return;
            }
            setProfile(prof);

            const [typesRes, docsRes] = await Promise.all([
                supabase.from('document_types').select('*').order('order_index').order('created_at'),
                supabase.from('student_documents').select('*').eq('user_id', user.id),
            ]);

            setTypes(typesRes.data || []);
            const map = {};
            (docsRes.data || []).forEach((d) => {
                map[d.type_id] = d;
            });
            setDocs(map);
            setLoading(false);
        };

        init();
    }, []);

    const handleFile = async (type, file) => {
        if (!file) return;
        setMsg(null);

        if (!ALLOWED_DOC_TYPES[file.type]) {
            setMsg({ ok: false, text: `Допустимые форматы: ${ALLOWED_DOC_LABEL}` });
            return;
        }
        if (file.size > MAX_DOC_SIZE) {
            setMsg({ ok: false, text: `Файл слишком большой (максимум ${MAX_DOC_SIZE / 1024 / 1024} МБ)` });
            return;
        }

        setBusyId(type.id);
        try {
            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: type.id,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Не удалось начать загрузку');

            const put = await fetch(data.signedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!put.ok) throw new Error('Не удалось загрузить файл');

            const sub = await fetch('/api/documents/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ typeId: type.id, key: data.key, fileName: file.name }),
            });
            const subData = await sub.json();
            if (!sub.ok) throw new Error(subData.error || 'Не удалось сохранить документ');

            setDocs((prev) => ({ ...prev, [type.id]: subData.document }));
            setMsg({ ok: true, text: `✅ «${type.title}» отправлен на проверку` });
        } catch (e) {
            setMsg({ ok: false, text: e.message });
        }
        setBusyId(null);
    };

    const openDoc = async (doc) => {
        // вкладку открываем сразу, чтобы телефон не заблокировал её как всплывающее окно
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
            setMsg({ ok: false, text: e.message });
        }
    };

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

    const displayName = profile?.login || profile?.email || '?';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const uploaded = types.filter((t) => docs[t.id]).length;
    const approved = types.filter((t) => docs[t.id]?.status === 'approved').length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
                    Личный кабинет
                </p>
                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(36px, 8vw, 52px)',
                        lineHeight: '1.06',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '16px',
                    }}
                >
                    Твои{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                        документы
                    </em>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '48ch' }}>
                    Загрузи нужные документы, куратор проверит их и отметит статус.
                </p>

                {types.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                            padding: '22px 0',
                            margin: '28px 0 24px',
                            borderTop: '1px solid var(--border-soft)',
                            borderBottom: '1px solid var(--border-soft)',
                        }}
                    >
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                                Загружено
                            </p>
                            <p style={{ fontFamily: 'var(--serif)', fontWeight: '600', fontSize: '32px', color: 'var(--accent-soft)' }}>
                                {uploaded} из {types.length}
                            </p>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Одобрено: {approved}
                        </p>
                    </div>
                )}

                {msg && (
                    <p
                        style={{
                            color: msg.ok ? '#6ee7b7' : '#ff9b9b',
                            fontSize: '14px',
                            marginBottom: '18px',
                        }}
                    >
                        {msg.text}
                    </p>
                )}

                {types.length === 0 ? (
                    <div
                        style={{
                            padding: '28px 22px',
                            borderRadius: '22px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            marginTop: '28px',
                        }}
                    >
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Список документов пока не настроен. Загляните позже.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        {types.map((t) => {
                            const doc = docs[t.id];
                            const meta = STATUS_META[doc ? doc.status : 'none'];
                            const busy = busyId === t.id;
                            const canUpload = !doc || doc.status !== 'approved';

                            return (
                                <article
                                    key={t.id}
                                    style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '22px',
                                        padding: '20px 22px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '14px',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <span
                                            style={{
                                                flex: 'none',
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: 'rgba(111,163,224,0.14)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                            }}
                                        >
                                            📄
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3
                                                style={{
                                                    fontFamily: 'var(--serif)',
                                                    fontWeight: '700',
                                                    fontSize: '20px',
                                                    color: 'var(--text)',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                {t.title}
                                            </h3>
                                            {t.description && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
                                                    {t.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            alignSelf: 'flex-start',
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

                                    {doc && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', wordBreak: 'break-word' }}>
                                            📎 {doc.file_name}
                                            {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ''}
                                        </p>
                                    )}

                                    {doc?.status === 'rejected' && doc.comment && (
                                        <p style={{ color: '#fca5a5', fontSize: '13.5px', lineHeight: '1.5' }}>
                                            Причина: {doc.comment}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {doc && (
                                            <button onClick={() => openDoc(doc)} style={pillOutline}>
                                                Открыть
                                            </button>
                                        )}
                                        {canUpload && (
                                            <label
                                                style={{
                                                    ...pillOutline,
                                                    background: busy ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                                                    color: busy ? 'var(--text-faint)' : 'var(--bg)',
                                                    border: 'none',
                                                    cursor: busy ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {busy ? 'Загрузка...' : doc ? 'Заменить файл' : 'Загрузить'}
                                                <input
                                                    type="file"
                                                    accept={DOC_ACCEPT}
                                                    disabled={busy}
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        handleFile(t, e.target.files[0]);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <p style={{ color: 'var(--text-faint)', fontSize: '12.5px', marginTop: '22px' }}>
                    Форматы: {ALLOWED_DOC_LABEL}. Размер файла до {MAX_DOC_SIZE / 1024 / 1024} МБ.
                </p>
            </main>

            <BottomNav />
        </div>
    );
}
