'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase';

const STAFF = ['admin', 'superuser', 'owner'];

const svgProps = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

const ICONS = {
    courses: (
        <svg {...svgProps}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    catalog: (
        <svg {...svgProps}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    docs: (
        <svg {...svgProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8M8 17h6" />
        </svg>
    ),
    chat: (
        <svg {...svgProps}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    panel: (
        <svg {...svgProps}>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
        </svg>
    ),
    profile: (
        <svg {...svgProps}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    ),
};

const STUDENT_ITEMS = [
    { href: '/courses', label: 'Мои курсы', icon: 'courses', match: ['/courses', '/learn'] },
    { href: '/documents', label: 'Документы', icon: 'docs', match: ['/documents'] },
    { href: '/community', label: 'Сообщество', icon: 'chat', match: ['/community'] },
    { href: '/profile', label: 'Профиль', icon: 'profile', match: ['/profile'] },
];

const STAFF_ITEMS = [
    { href: '/dashboard', label: 'Панель', icon: 'panel', match: ['/dashboard', '/admin'] },
    { href: '/courses', label: 'Курсы', icon: 'catalog', match: ['/courses', '/learn'] },
    { href: '/profile', label: 'Профиль', icon: 'profile', match: ['/profile'] },
];

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname() || '';
    const [role, setRole] = useState(null);

    useEffect(() => {
        const supabase = createClient();
        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            setRole(data?.role || 'student');
        })();
    }, []);

    if (!role) return null;

    const items = STAFF.includes(role) ? STAFF_ITEMS : STUDENT_ITEMS;

    return (
        <nav
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 30,
                background: 'rgba(2,10,22,0.94)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid var(--border-soft)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex' }}>
                {items.map((item) => {
                    const active = item.match.some((m) => pathname.startsWith(m));
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '10px 0 12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: active ? 'var(--text)' : 'var(--text-faint)',
                                fontFamily: 'var(--sans)',
                                fontSize: '12px',
                                fontWeight: active ? '700' : '500',
                            }}
                        >
                            {ICONS[item.icon]}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
