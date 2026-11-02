'use client';

import { useEffect, useRef, useState } from 'react';

export default function LegalCard({ title, date, html, checked, onChange, label }) {
    const boxRef = useRef(null);
    const [reached, setReached] = useState(false);

    const check = () => {
        const el = boxRef.current;
        if (!el) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReached(true);
    };

    useEffect(() => {
        check();
    }, []);

    return (
        <section
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '24px 22px',
                marginBottom: '18px',
            }}
        >
            <style>{`
                .legal-rich { color: var(--text-muted); font-size: 14.5px; line-height: 1.65; }
                .legal-rich h2 { font-family: var(--serif); font-weight: 700; color: var(--text); font-size: 20px; margin: 18px 0 8px; }
                .legal-rich h2:first-child { margin-top: 0; }
                .legal-rich p { margin: 0 0 10px; }
                .legal-rich b { color: var(--text); }
            `}</style>

            <h2
                style={{
                    fontFamily: 'var(--serif)',
                    fontWeight: '700',
                    fontSize: '21px',
                    color: 'var(--text)',
                    marginBottom: '6px',
                }}
            >
                {title}
            </h2>
            <p style={{ color: 'var(--text-faint)', fontSize: '13px', marginBottom: '14px' }}>
                Редакция: {date}
            </p>

            <div
                ref={boxRef}
                onScroll={check}
                className="legal-rich"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                }}
            />

            {!reached && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>
                    Пролистайте текст до конца, чтобы принять.
                </p>
            )}

            <label
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginTop: '14px',
                    cursor: reached ? 'pointer' : 'not-allowed',
                    opacity: reached ? 1 : 0.5,
                }}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={!reached}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }}
                />
                <span style={{ color: 'var(--text)', fontSize: '14.5px', lineHeight: '1.45' }}>{label}</span>
            </label>
        </section>
    );
}
