'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

const AVATAR_COLORS = ['#00e5ff', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
const colorFor = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

function ProgressRing({ percent, size = 76, stroke = 7, color = '#00e5ff' }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return (
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
            <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2433" strokeWidth={stroke} fill="none" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                stroke={color} strokeWidth={stroke} fill="none"
                strokeDasharray={c} strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <text
                x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize="16" fontWeight="700" fontFamily="monospace"
            >
                {percent}%
            </text>
        </svg>
    );
}

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [overall, setOverall] = useState({ total: 0, completed: 0, percent: 0 });
    const [nextUp, setNextUp] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profile);
            await loadProgress(user.id);
        };

        getUser();
    }, []);

    const loadProgress = async (userId) => {
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id, courses(id, title, description)')
            .eq('user_id', userId);

        const enrolledCourses = (enrollments || [])
            .map((e) => e.courses)
            .filter(Boolean);

        if (enrolledCourses.length === 0) {
            setCourses([]);
            setOverall({ total: 0, completed: 0, percent: 0 });
            setLoadingProgress(false);
            return;
        }

        const courseIds = enrolledCourses.map((c) => c.id);

        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, order_index, sections!inner(course_id, order_index)')
            .in('sections.course_id', courseIds);

        const { data: progress } = await supabase
            .from('progress')
            .select('lesson_id, completed')
            .eq('user_id', userId)
            .eq('completed', true);

        const completedIds = new Set((progress || []).map((p) => p.lesson_id));

        const byCourse = {};
        courseIds.forEach((id) => (byCourse[id] = []));
        (lessons || []).forEach((l) => {
            const cid = l.sections?.course_id;
            if (!byCourse[cid]) return;
            byCourse[cid].push({
                id: l.id,
                order: (l.sections?.order_index || 0) * 10000 + (l.order_index || 0),
            });
        });

        let totalAll = 0;
        let completedAll = 0;
        let nextCandidate = null;

        const result = enrolledCourses.map((course) => {
            const list = (byCourse[course.id] || []).sort((a, b) => a.order - b.order);
            const total = list.length;
            const completed = list.filter((l) => completedIds.has(l.id)).length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            totalAll += total;
            completedAll += completed;

            if (!nextCandidate) {
                const firstUnfinished = list.find((l) => !completedIds.has(l.id));
                if (firstUnfinished) {
                    nextCandidate = {
                        courseId: course.id,
                        courseTitle: course.title,
                        lessonId: firstUnfinished.id,
                    };
                }
            }

            return { ...course, total, completed, percent };
        });

        setCourses(result);
        setOverall({
            total: totalAll,
            completed: completedAll,
            percent: totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0,
        });
        setNextUp(nextCandidate);
        setLoadingProgress(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!user || !profile)
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

    const isStaff = ['admin', 'superuser', 'owner'].includes(profile.role);
    const displayName = profile.login || (profile.email || '').split('@')[0];

    const roleBadge = () => {
        if (profile.role === 'owner') {
            return { bg: 'rgba(168,85,247,0.1)', border: '#a855f7', color: '#a855f7', label: '🔱 Owner' };
        }
        if (profile.role === 'superuser') {
            return { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', color: '#ef4444', label: '👑 Superuser' };
        }
        if (profile.role === 'admin') {
            return { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', color: '#f59e0b', label: '⚙️ Admin' };
        }
        return { bg: 'rgba(0,229,255,0.1)', border: '#00e5ff', color: '#00e5ff', label: '🎓 Student' };
    };
    const badge = roleBadge();

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0e1a',
                fontFamily: 'monospace',
                padding: '20px',
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '24px',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: '#fff',
                                fontSize: 'clamp(18px, 4vw, 24px)',
                                marginBottom: '4px',
                            }}
                        >
                            Привет, {displayName}! 👋
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px' }}>
                            {courses.length > 0 ? 'Продолжим обучение?' : profile.email}
                        </p>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                padding: '6px 14px',
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                borderRadius: '6px',
                                color: badge.color,
                                fontSize: '12px',
                                fontWeight: '600',
                            }}
                        >
                            {badge.label}
                        </span>
                        <button
                            onClick={() => router.push('/profile')}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            👤 Профиль
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #1e2433',
                                borderRadius: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                {!loadingProgress && courses.length > 0 && (
                    <>
                        {/* Мои курсы — горизонтальная лента */}
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>
                            Мои курсы
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                overflowX: 'auto',
                                paddingBottom: '8px',
                                marginBottom: '20px',
                            }}
                        >
                            {courses.map((c) => {
                                const color = colorFor(c.title || c.id);
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => router.push(`/learn/${c.id}`)}
                                        style={{
                                            minWidth: '150px',
                                            background: '#111827',
                                            border: '1px solid #1e2433',
                                            borderRadius: '12px',
                                            padding: '14px',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                background: `${color}22`,
                                                border: `1px solid ${color}55`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color,
                                                fontWeight: '700',
                                                fontSize: '15px',
                                                marginBottom: '10px',
                                            }}
                                        >
                                            {(c.title || '?').trim().charAt(0).toUpperCase()}
                                        </div>
                                        <p
                                            style={{
                                                color: '#fff',
                                                fontSize: '13px',
                                                marginBottom: '6px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {c.title}
                                        </p>
                                        <p style={{ color, fontSize: '12px', fontWeight: '600' }}>
                                            {c.total > 0 ? `${c.percent}% пройдено` : 'Доступ открыт'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Мой прогресс */}
                        <div
                            style={{
                                background: '#111827',
                                border: '1px solid #1e2433',
                                borderRadius: '12px',
                                padding: '18px 20px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                            }}
                        >
                            <ProgressRing percent={overall.percent} />
                            <div>
                                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                                    Мой прогресс
                                </p>
                                <p style={{ color: '#64748b', fontSize: '12px' }}>
                                    {overall.percent >= 100
                                        ? 'Все уроки пройдены 🎉'
                                        : overall.percent >= 50
                                        ? 'Вы на правильном пути'
                                        : 'Хорошее начало, продолжайте'}
                                </p>
                                <p style={{ color: '#374151', fontSize: '11px', marginTop: '4px' }}>
                                    {overall.completed} из {overall.total} уроков
                                </p>
                            </div>
                        </div>

                        {/* Ближайшее действие */}
                        {nextUp && (
                            <div
                                style={{
                                    background: 'rgba(0,229,255,0.05)',
                                    border: '1px solid rgba(0,229,255,0.2)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    marginBottom: '20px',
                                }}
                            >
                                <p style={{ color: '#64748b', fontSize: '11px', letterSpacing: '1px', marginBottom: '6px' }}>
                                    БЛИЖАЙШЕЕ ДЕЙСТВИЕ
                                </p>
                                <p style={{ color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
                                    Продолжить курс «{nextUp.courseTitle}»
                                </p>
                                <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '14px' }}>
                                    Следующий непройденный урок ждёт вас
                                </p>
                                <button
                                    onClick={() => router.push(`/learn/${nextUp.courseId}/${nextUp.lessonId}`)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(0,229,255,0.1)',
                                        border: '1px solid rgba(0,229,255,0.3)',
                                        borderRadius: '8px',
                                        color: '#00e5ff',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                    }}
                                >
                                    Перейти →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {isStaff && (
                    <div
                        style={{
                            background: 'rgba(245,158,11,0.05)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                        }}
                    >
                        <h2
                            style={{
                                color: '#f59e0b',
                                fontSize: '15px',
                                marginBottom: '12px',
                            }}
                        >
                            ⚙️ Админ-панель
                        </h2>
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                onClick={() => router.push('/admin/courses')}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(245,158,11,0.1)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: '8px',
                                    color: '#f59e0b',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                📚 Управление курсами
                            </button>
                            <button
                                onClick={() => router.push('/admin/users')}
                                style={{
                                    padding: '10px 16px',
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}
                            >
                                👥 Пользователи
                            </button>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        background: '#111827',
                        border: '1px solid #1e2433',
                        borderRadius: '12px',
                        padding: '20px',
                    }}
                >
                    <p
                        style={{
                            color: '#64748b',
                            fontSize: '13px',
                            marginBottom: '12px',
                        }}
                    >
                        Каталог курсов:
                    </p>
                    <button
                        onClick={() => router.push('/courses')}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            background: 'rgba(0,229,255,0.05)',
                            border: '1px solid rgba(0,229,255,0.2)',
                            borderRadius: '8px',
                            color: '#00e5ff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            textAlign: 'left',
                        }}
                    >
                        📚 Перейти в каталог курсов →
                    </button>
                </div>
            </div>
        </div>
    );
}
