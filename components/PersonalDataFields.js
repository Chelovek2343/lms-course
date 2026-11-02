'use client';

const baseInput = {
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
    colorScheme: 'dark',
};

function Field({ label, note, hint, error, children }) {
    return (
        <div>
            <label
                style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    marginBottom: '8px',
                }}
            >
                {label}
                {note && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}> — {note}</span>
                )}
            </label>
            {children}
            {hint && !error && (
                <p style={{ color: 'var(--text-faint)', fontSize: '12.5px', lineHeight: '1.45', marginTop: '6px' }}>
                    {hint}
                </p>
            )}
            {error && (
                <p style={{ color: '#ff9b9b', fontSize: '12.5px', marginTop: '6px' }}>{error}</p>
            )}
        </div>
    );
}

const DEFAULT_EMAIL_HINT =
    'Для связи с куратором. Для восстановления пароля email подтверждается в профиле.';

export default function PersonalDataFields({
    values,
    errors = {},
    onChange,
    disabled = false,
    emailHint,
}) {
    const today = new Date().toISOString().slice(0, 10);

    const props = (name) => ({
        value: values[name] || '',
        disabled,
        onChange: (e) => onChange(name, e.target.value),
        style: {
            ...baseInput,
            ...(errors[name] ? { borderColor: 'rgba(248,113,113,0.7)' } : {}),
        },
    });

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '18px',
            }}
        >
            <Field label="Фамилия" error={errors.lastName}>
                <input type="text" autoComplete="family-name" {...props('lastName')} />
            </Field>

            <Field label="Имя" error={errors.firstName}>
                <input type="text" autoComplete="given-name" {...props('firstName')} />
            </Field>

            <Field label="Отчество" note="если есть" error={errors.middleName}>
                <input type="text" autoComplete="additional-name" {...props('middleName')} />
            </Field>

            <Field label="Дата рождения" error={errors.birthDate}>
                <input type="date" min="1930-01-01" max={today} autoComplete="bday" {...props('birthDate')} />
            </Field>

            <Field label="Номер телефона" error={errors.phone}>
                <input
                    type="tel"
                    placeholder="+996 000 00 00 00"
                    autoComplete="tel"
                    {...props('phone')}
                />
            </Field>

            <Field label="Email" hint={emailHint ?? DEFAULT_EMAIL_HINT} error={errors.contactEmail}>
                <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...props('contactEmail')}
                />
            </Field>
        </div>
    );
}
