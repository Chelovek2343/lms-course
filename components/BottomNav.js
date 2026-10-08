'use client';

import { useRouter, usePathname } from 'next/navigation';

const ICONS = {
    courses: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    catalog: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    profile: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    ),
};

const ITEMS = [
    { href: '/dashboard', label: 'Мои курсы', icon: 'courses', match: ['/dashboard', '/learn'] },
    { href: '/courses', label: 'Каталог', icon: 'catalog', match: ['/courses'] },
    { href: '/profile', label: 'Профиль', icon: 'profile', match: ['/profile'] },
];

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname() || '';

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
                {ITEMS.map((item) => {
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