'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        setError('');
        setResult(null);
        setLoading(true);

        const res = await fetch('/api/admin/create-user', { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Не удалось создать аккаунт');
        } else {
            setResult(data);
        }
        setLoading(false);
    };

    const login = result?.login ?? '';
const password = result?.password ?? '';

const copyCreds = async () => {
    if (!login || !password) return;

    try {
        const text = `Логин: ${login}\nПароль: ${password}`;
        await navigator.clipboard.writeText(text);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch {
        setError('Не удалось скопировать. Скопируйте данные вручную.');
    }
};

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'monospace', padding: '20px' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,22px)' }}>➕ Создать студента</h1>
                    <button onClick={() => router.push('/admin/users')} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #1e2433', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                        ← Пользователи
                    </button>
                </div>

                <div style={{ background: '#111827', border: '1px solid #1e2433', borderRadius: '12px', padding: '20px' }}>
                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                        Логин и пароль сгенерируются автоматически.
                    </p>
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '8px', color: '#00e5ff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        {loading ? 'Создаю...' : 'Создать аккаунт'}
                    </button>

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '14px' }}>{error}</p>
                    )}

                    {result && (
                        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px' }}>
                            <p style={{ color: '#10b981', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>
                                ✅ Аккаунт создан
                            </p>
                            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '4px' }}>
                                Логин: <span style={{ color: '#00e5ff' }}>{result.login}</span>
                            </p>
                            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '14px' }}>
                                Пароль: <span style={{ color: '#00e5ff' }}>{result.password}</span>
                            </p>
                            <p style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '14px' }}>
                                ⚠️ Пароль показывается только один раз — скопируйте и отправьте студенту сейчас.
                            </p>
                            <button
                                onClick={copyCreds}
                                style={{ width: '100%', padding: '10px', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '8px', color: '#00e5ff', cursor: 'pointer', fontSize: '13px' }}
                            >
                                {copied ? 'Скопировано ✓' : 'Скопировать логин + пароль'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
