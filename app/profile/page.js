'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase';
import { CURATOR_LINK } from '../../lib/config';
import AppHeader from '../../components/AppHeader';
import BottomNav from '../../components/BottomNav';
import PersonalDataFields from '../../components/PersonalDataFields';
import { validatePersonal, fromProfile } from '../../lib/personal';
import { TERMS_DATE, PRIVACY_DATE } from '../../lib/legal-version';
import { TERMS_HTML, PRIVACY_HTML } from '../../lib/legal';

const MAX_WIDTH = 1180;
const INTERNAL_DOMAIN = '@lms.internal';

const ROLE_META = {
    owner: { label: '🔱 Owner', color: '#c084fc', border: 'rgba(192,132,252,0.4)', bg: 'rgba(168,85,247,0.1)' },
    superuser: { label: '👑 Superuser', color: '#f87171', border: 'rgba(248,113,113,0.4)', bg: 'rgba(239,68,68,0.1)' },
    admin: { label: '⚙️ Admin', color: '#f5b84a', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.1)' },
};

const MONTHS = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatBirth(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return '';
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

function formatPhone(p) {
    const d = String(p || '').replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('996')) {
        return `+996 ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
    }
    return p || '';
}

const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    overflow: 'hidden',
};

const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '8px',
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

const solidBtn = (disabled) => ({
    padding: '15px 28px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
});

const outlineBtn = {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1.5px solid rgba(111,163,224,0.5)',
    background: 'transparent',
    color: 'var(--accent-soft)',
    fontSize: '13.5px',
    fontWeight: '700',
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
};

const ICONS = {
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
        </>
    ),
    phone: (
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    ),
    mail: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </>
    ),
    doc: (
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M8 13h8M8 17h6" />
        </>
    ),
    shield: <path d="M12 3 4 6v6c0 5 3.4 8.5 8 9.5 4.6-1 8-4.5 8-9.5V6z" />,
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    logout: (
        <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
        </>
    ),
    pencil: (
        <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </>
    ),
    lock: (
        <>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
    ),
    at: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </>
    ),
};

function Icon({ name, size = 20 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: 'none' }}
        >
            {ICONS[name]}
        </svg>
    );
}

function Msg({ m }) {
    if (!m) return null;
    return (
        <p style={{ color: m.ok ? '#6ee7b7' : '#ff9b9b', fontSize: '13.5px', lineHeight: '1.5', marginTop: '12px' }}>
            {m.text}
        </p>
    );
}

// строка с раскрывающимся содержимым
function Row({ icon, title, hint, open, onToggle, first, children }) {
    return (
        <div style={{ borderTop: first ? 'none' : '1px solid var(--border-soft)' }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--sans)',
                    color: 'var(--text)',
                }}
            >
                <span style={{ color: 'var(--accent-soft)', display: 'flex' }}>
                    <Icon name={icon} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: '700', fontSize: '16px' }}>{title}</span>
                    {hint && (
                        <span
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                marginTop: '3px',
                                color: 'var(--text-muted)',
                                wordBreak: 'break-word',
                            }}
                        >
                            {hint}
                        </span>
                    )}
                </span>
                <span
                    style={{
                        flex: 'none',
                        color: 'var(--accent-soft)',
                        fontSize: '24px',
                        transform: open ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                >
                    ›
                </span>
            </button>
            {open && <div style={{ padding: '0 24px 24px' }}>{children}</div>}
        </div>
    );
}

// строка-ссылка в блоке «О платформе»
function Item({ icon, title, onClick, href, first }) {
    const style = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '18px 24px',
        background: 'transparent',
        border: 'none',
        borderTop: first ? 'none' : '1px solid var(--border-soft)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--sans)',
        color: 'var(--text)',
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: '600',
        boxSizing: 'border-box',
    };
    const content = (
        <>
            <span style={{ color: 'var(--accent-soft)', display: 'flex' }}>
                <Icon name={icon} />
            </span>
            <span style={{ flex: 1 }}>{title}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: '22px' }}>›</span>
        </>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
                {content}
            </a>
        );
    }
    return (
        <button onClick={onClick} style={style}>
            {content}
        </button>
    );
}

function LegalModal({ title, date, accepted, html, onClose }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, []);

    return (
        <div
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'rgba(1,10,24,0.82)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '22px 22px 14px',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontFamily: 'var(--serif)',
                                fontWeight: '700',
                                fontSize: '22px',
                                color: 'var(--text)',
                                marginBottom: '4px',
                            }}
                        >
                            {title}
                        </h2>
                        <p style={{ color: 'var(--text-faint)', fontSize: '13px' }}>
                            Редакция: {date}
                            {accepted ? ` · принято вами ${accepted}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Закрыть"
                        style={{
                            flex: 'none',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--text)',
                            fontSize: '22px',
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
                </div>
                <div
                    className="legal-rich"
                    dangerouslySetInnerHTML={{ __html: html }}
                    style={{ padding: '0 22px 22px', overflowY: 'auto' }}
                />
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const [authUser, setAuthUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(null);
    const [legal, setLegal] = useState(null); // 'terms' | 'privacy' | null

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [dataMsg, setDataMsg] = useState(null);
    const [saving, setSaving] = useState(false);

    const [newLogin, setNewLogin] = useState('');
    const [loginMsg, setLoginMsg] = useState(null);
    const [loginBusy, setLoginBusy] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [passMsg, setPassMsg] = useState(null);
    const [passBusy, setPassBusy] = useState(false);

    const [newEmail, setNewEmail] = useState('');
    const [emailMsg, setEmailMsg] = useState(null);
    const [emailBusy, setEmailBusy] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const loadProfile = async (userId) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setProfile(data);
        setNewLogin(data?.login || '');
        return data;
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
            setAuthUser(user);
            await loadProfile(user.id);
            setLoading(false);
        };
        init();
    }, []);

    const toggle = (name) => setOpen((cur) => (cur === name ? null : name));

    /* ----- личные данные ----- */

    const realAuthEmail =
        authUser?.email && !authUser.email.endsWith(INTERNAL_DOMAIN) ? authUser.email : '';

    const startEdit = () => {
        setForm({
            ...fromProfile(profile),
            contactEmail: profile?.contact_email || realAuthEmail,
        });
        setFormErrors({});
        setDataMsg(null);
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setFormErrors({});
    };

    const onFormChange = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        setFormErrors((e) => ({ ...e, [name]: undefined }));
        setDataMsg(null);
    };

    const saveData = async () => {
        setDataMsg(null);
        const errs = validatePersonal(form);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const res = await fetch('/api/profile/personal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (data.fields) setFormErrors(data.fields);
                setDataMsg({ ok: false, text: data.error || 'Не удалось сохранить' });
            } else {
                await loadProfile(authUser.id);
                setEditing(false);
                setDataMsg({ ok: true, text: '✅ Данные сохранены' });
            }
        } catch {
            setDataMsg({ ok: false, text: 'Не удалось связаться с сервером' });
        }
        setSaving(false);
    };

    /* ----- логин, пароль, email ----- */

    const handleLoginChange = async () => {
        setLoginMsg(null);
        if (!newLogin.trim()) return;
        setLoginBusy(true);

        const res = await fetch('/api/profile/update-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: newLogin }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setLoginMsg({ ok: false, text: data.error || 'Не удалось изменить логин' });
        } else {
            setProfile((p) => ({ ...p, login: data.login }));
            setNewLogin(data.login);
            setLoginMsg({ ok: true, text: '✅ Логин изменён' });
        }
        setLoginBusy(false);
    };

    const handlePasswordChange = async () => {
        setPassMsg(null);

        if (!currentPassword) {
            setPassMsg({ ok: false, text: 'Введите текущий пароль' });
            return;
        }
        if (newPassword.length < 8) {
            setPassMsg({ ok: false, text: 'Новый пароль: минимум 8 символов' });
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setPassMsg({ ok: false, text: 'Добавьте хотя бы одну заглавную букву' });
            return;
        }
        if (!/[0-9]/.test(newPassword)) {
            setPassMsg({ ok: false, text: 'Добавьте хотя бы одну цифру' });
            return;
        }
        if (newPassword !== repeatPassword) {
            setPassMsg({ ok: false, text: 'Пароли не совпадают' });
            return;
        }

        setPassBusy(true);

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: authUser.email,
            password: currentPassword,
        });
        if (verifyError) {
            setPassMsg({ ok: false, text: 'Текущий пароль неверный' });
            setPassBusy(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPassMsg({ ok: false, text: error.message });
        } else {
            setPassMsg({ ok: true, text: '✅ Пароль изменён' });
            setCurrentPassword('');
            setNewPassword('');
            setRepeatPassword('');
        }
        setPassBusy(false);
    };

    const handleEmailLink = async () => {
        setEmailMsg(null);
        const value = newEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailMsg({ ok: false, text: 'Введите корректный email' });
            return;
        }
        if (value.toLowerCase().endsWith(INTERNAL_DOMAIN)) {
            setEmailMsg({ ok: false, text: 'Укажите настоящий email' });
            return;
        }
        setEmailBusy(true);

        const { error } = await supabase.auth.updateUser(
            { email: value },
            { emailRedirectTo: `${window.location.origin}/profile` },
        );

        if (error) {
            setEmailMsg({ ok: false, text: error.message });
        } else {
            setEmailMsg({
                ok: true,
                text: `✅ Отправили письмо на ${value}. Перейдите по ссылке из письма, чтобы подтвердить адрес.`,
            });
            setNewEmail('');
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) setAuthUser(user);
        }
        setEmailBusy(false);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
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

    const pendingEmail = authUser?.new_email;
    const fullName = [profile?.last_name, profile?.first_name, profile?.middle_name].filter(Boolean).join(' ');
    const shortName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
    const displayName = shortName || profile?.login || realAuthEmail.split('@')[0] || 'Профиль';
    const initial = displayName.trim().charAt(0).toUpperCase();
    const handle = profile?.login ? `@${profile.login}` : realAuthEmail || 'Логин не задан';
    const roleMeta = ROLE_META[profile?.role];
    const contactEmail = profile?.contact_email || realAuthEmail;
    const acceptedDate = profile?.agreements_accepted_at
        ? new Date(profile.agreements_accepted_at).toLocaleDateString('ru-RU')
        : '';
    const loginUnchanged = newLogin.trim().toLowerCase() === (profile?.login || '');

    const dataRows = [
        { icon: 'user', label: 'ФИО', value: fullName },
        { icon: 'calendar', label: 'Дата рождения', value: formatBirth(profile?.birth_date) },
        { icon: 'phone', label: 'Телефон', value: formatPhone(profile?.phone) },
        { icon: 'mail', label: 'Email для связи', value: contactEmail },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)', paddingBottom: '100px' }}>
            <style>{`
                .profile-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; align-items: start; }
                @media (min-width: 960px) {
                    .profile-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
                }
                .legal-rich { color: var(--text-muted); font-size: 14.5px; line-height: 1.65; }
                .legal-rich h2 { font-family: var(--serif); font-weight: 700; color: var(--text); font-size: 20px; margin: 18px 0 8px; }
                .legal-rich h2:first-child { margin-top: 0; }
                .legal-rich p { margin: 0 0 10px; }
                .legal-rich b { color: var(--text); }
            `}</style>

            <AppHeader initial={initial} maxWidth={MAX_WIDTH} />

            <main style={{ maxWidth: `${MAX_WIDTH}px`, margin: '0 auto', padding: '32px 20px 0' }}>
                <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
                    Личный кабинет
                </p>
                <h1
                    style={{
                        fontFamily: 'var(--serif)',
                        fontWeight: '800',
                        fontSize: 'clamp(40px, 9vw, 58px)',
                        lineHeight: '1.04',
                        letterSpacing: '-1px',
                        color: 'var(--text)',
                        marginBottom: '28px',
                    }}
                >
                    Профиль
                </h1>

                <div className="profile-grid">
                    {/* Левая колонка */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Карточка пользователя */}
                        <section style={{ ...cardStyle, padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div
                                style={{
                                    flex: 'none',
                                    width: '76px',
                                    height: '76px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6fa3e0, #2f6fbf)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'var(--serif)',
                                    fontWeight: '700',
                                    fontSize: '32px',
                                    color: '#fff',
                                }}
                            >
                                {initial}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px' }}>
                                    Личная информация
                                </p>
                                <p
                                    style={{
                                        fontFamily: 'var(--serif)',
                                        fontWeight: '700',
                                        fontSize: '24px',
                                        lineHeight: '1.2',
                                        color: 'var(--text)',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {displayName}
                                </p>
                                <p
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'var(--text-muted)',
                                        fontSize: '14px',
                                        marginTop: '4px',
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    <Icon name="user" size={16} />
                                    {handle}
                                </p>
                                {roleMeta && (
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '10px',
                                            padding: '3px 11px',
                                            borderRadius: '999px',
                                            background: roleMeta.bg,
                                            border: `1px solid ${roleMeta.border}`,
                                            color: roleMeta.color,
                                            fontSize: '11.5px',
                                            fontWeight: '700',
                                        }}
                                    >
                                        {roleMeta.label}
                                    </span>
                                )}
                            </div>
                        </section>

                        {/* Мои данные */}
                        <section style={{ ...cardStyle, padding: '24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                    marginBottom: editing ? '20px' : '10px',
                                }}
                            >
                                <h2
                                    style={{
                                        fontFamily: 'var(--serif)',
                                        fontWeight: '700',
                                        fontSize: '22px',
                                        color: 'var(--text)',
                                    }}
                                >
                                    Мои данные
                                </h2>
                                {!editing && (
                                    <button onClick={startEdit} style={outlineBtn}>
                                        <Icon name="pencil" size={16} />
                                        Изменить
                                    </button>
                                )}
                            </div>

                            {editing ? (
                                <>
                                    <PersonalDataFields
                                        values={form}
                                        errors={formErrors}
                                        onChange={onFormChange}
                                        disabled={saving}
                                        emailHint="Для связи с куратором. Вход и восстановление пароля настраиваются ниже, в разделе «Безопасность»."
                                    />
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
                                        <button onClick={saveData} disabled={saving} style={solidBtn(saving)}>
                                            {saving ? 'Сохраняю...' : 'Сохранить'}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            disabled={saving}
                                            style={{ ...outlineBtn, padding: '14px 24px', fontSize: '15px' }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {!profile?.first_name && (
                                        <p style={{ color: '#f5b84a', fontSize: '13.5px', lineHeight: '1.5', marginBottom: '6px' }}>
                                            Данные не заполнены. Они нужны для подачи документов, нажмите «Изменить».
                                        </p>
                                    )}
                                    {dataRows.map((r) => (
                                        <div
                                            key={r.label}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: '16px',
                                                padding: '13px 0',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    color: 'var(--text-muted)',
                                                    fontSize: '15px',
                                                    flex: 'none',
                                                }}
                                            >
                                                <Icon name={r.icon} size={19} />
                                                {r.label}
                                            </span>
                                            <span
                                                style={{
                                                    textAlign: 'right',
                                                    fontSize: '15px',
                                                    fontWeight: r.value ? '700' : '500',
                                                    color: r.value ? 'var(--text)' : 'var(--text-faint)',
                                                    wordBreak: 'break-word',
                                                    minWidth: 0,
                                                }}
                                            >
                                                {r.value || 'Не указан'}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}

                            <Msg m={dataMsg} />
                        </section>
                    </div>

                    {/* Правая колонка */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Безопасность */}
                        <section style={cardStyle}>
                            <h2
                                style={{
                                    fontFamily: 'var(--serif)',
                                    fontWeight: '700',
                                    fontSize: '22px',
                                    color: 'var(--text)',
                                    padding: '24px 24px 8px',
                                }}
                            >
                                Безопасность
                            </h2>

                            <Row
                                first
                                icon="at"
                                title="Логин"
                                hint={profile?.login ? `@${profile.login}` : 'Не задан'}
                                open={open === 'login'}
                                onToggle={() => toggle('login')}
                            >
                                <label style={labelStyle}>{profile?.login ? 'Новый логин' : 'Ваш логин'}</label>
                                <input
                                    type="text"
                                    value={newLogin}
                                    autoComplete="username"
                                    onChange={(e) => setNewLogin(e.target.value)}
                                    style={inputStyle}
                                />
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginTop: '10px' }}>
                                    Латиница, цифры, символы . _ - от 3 до 30 символов. По логину можно входить
                                    вместо email.
                                </p>
                                <button
                                    onClick={handleLoginChange}
                                    disabled={loginBusy || loginUnchanged || !newLogin.trim()}
                                    style={{
                                        ...solidBtn(loginBusy || loginUnchanged || !newLogin.trim()),
                                        marginTop: '18px',
                                        width: '100%',
                                    }}
                                >
                                    {loginBusy ? 'Сохраняю...' : profile?.login ? 'Сохранить логин' : 'Задать логин'}
                                </button>
                                <Msg m={loginMsg} />
                            </Row>

                            <Row
                                icon="lock"
                                title="Пароль"
                                hint="Сменить пароль"
                                open={open === 'password'}
                                onToggle={() => toggle('password')}
                            >
                                <label style={labelStyle}>Текущий пароль</label>
                                <input
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: '16px' }}
                                />
                                <label style={labelStyle}>
                                    Новый пароль{' '}
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                                        (8+ символов, заглавная буква, цифра)
                                    </span>
                                </label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: '16px' }}
                                />
                                <label style={labelStyle}>Повторите новый пароль</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={repeatPassword}
                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                    style={inputStyle}
                                />
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={passBusy}
                                    style={{ ...solidBtn(passBusy), marginTop: '20px', width: '100%' }}
                                >
                                    {passBusy ? 'Сохраняю...' : 'Сменить пароль'}
                                </button>
                                <Msg m={passMsg} />
                            </Row>

                            <Row
                                icon="mail"
                                title="Email для входа и восстановления"
                                hint={realAuthEmail || 'Не привязан'}
                                open={open === 'email'}
                                onToggle={() => toggle('email')}
                            >
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                                    Нужен, чтобы восстановить пароль, если вы его забудете. Мы отправим письмо со
                                    ссылкой подтверждения.
                                </p>
                                {pendingEmail && (
                                    <p style={{ color: '#f5b84a', fontSize: '13.5px', marginBottom: '14px' }}>
                                        ⏳ Ожидает подтверждения: {pendingEmail}
                                    </p>
                                )}
                                <label style={labelStyle}>{realAuthEmail ? 'Новый email' : 'Ваш email'}</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    style={inputStyle}
                                />
                                <button
                                    onClick={handleEmailLink}
                                    disabled={emailBusy}
                                    style={{ ...solidBtn(emailBusy), marginTop: '20px', width: '100%' }}
                                >
                                    {emailBusy ? 'Отправляю...' : 'Отправить письмо подтверждения'}
                                </button>
                                <Msg m={emailMsg} />
                            </Row>
                        </section>

                        {/* О платформе */}
                        <section style={cardStyle}>
                            <h2
                                style={{
                                    fontFamily: 'var(--serif)',
                                    fontWeight: '700',
                                    fontSize: '22px',
                                    color: 'var(--text)',
                                    padding: '24px 24px 8px',
                                }}
                            >
                                О платформе
                            </h2>
                            {CURATOR_LINK && <Item first icon="chat" title="Написать куратору" href={CURATOR_LINK} />}
                            <Item
                                first={!CURATOR_LINK}
                                icon="doc"
                                title="Пользовательское соглашение"
                                onClick={() => setLegal('terms')}
                            />
                            <Item icon="shield" title="Политика конфиденциальности" onClick={() => setLegal('privacy')} />
                        </section>

                        {/* Выход */}
                        <button
                            onClick={logout}
                            style={{
                                ...cardStyle,
                                width: '100%',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                color: '#f87171',
                                fontSize: '16px',
                                fontWeight: '700',
                                fontFamily: 'var(--sans)',
                            }}
                        >
                            <Icon name="logout" />
                            Выйти из аккаунта
                        </button>
                    </div>
                </div>
            </main>

            {legal && (
                <LegalModal
                    title={legal === 'terms' ? 'Пользовательское соглашение' : 'Политика конфиденциальности'}
                    date={legal === 'terms' ? TERMS_DATE : PRIVACY_DATE}
                    accepted={acceptedDate}
                    html={legal === 'terms' ? TERMS_HTML : PRIVACY_HTML}
                    onClose={() => setLegal(null)}
                />
            )}

            <BottomNav />
        </div>
    );
}
