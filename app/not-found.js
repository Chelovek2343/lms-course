import Link from 'next/link';

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                padding: '24px',
                textAlign: 'center',
                fontFamily: 'var(--sans)',
            }}
        >
            <p
                style={{
                    fontFamily: 'var(--serif)',
                    fontWeight: '800',
                    fontSize: '84px',
                    lineHeight: '1',
                    color: 'var(--accent-soft)',
                }}
            >
                404
            </p>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: '700', fontSize: '28px', color: 'var(--text)' }}>
                Страница не найдена
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '10px' }}>
                Возможно, ссылка устарела или адрес введён с ошибкой.
            </p>
            <Link
                href="/dashboard"
                style={{
                    padding: '14px 28px',
                    borderRadius: '999px',
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    fontWeight: '700',
                    fontSize: '15px',
                    textDecoration: 'none',
                }}
            >
                Вернуться в кабинет
            </Link>
        </div>
    );
}
