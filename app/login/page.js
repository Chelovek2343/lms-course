'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setError('')
    if (!identifier.trim() || !password) {
      setError('Введите логин/email и пароль')
      return
    }
    setLoading(true)

    const res = await fetch('/api/resolve-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
    })
    const resolved = await res.json()

    if (!res.ok) {
      setError('Неверный логин/email или пароль')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    })

    if (error) {
      setError('Неверный логин/email или пароль')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { setError(error.message) } else { setForgotSent(true) }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '15px 16px',
    paddingRight: '46px',
    background: 'var(--input-bg)',
    border: '1.5px solid rgba(111,163,224,0.25)',
    borderRadius: '14px',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text)',
    marginBottom: '8px',
  }

  const stats = [
    { title: '1 оплата', desc: 'Неограниченно вузов и стран' },
    { title: 'Личный куратор', desc: 'Рядом на каждом шаге подачи' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Шапка */}
          {/* Шапка */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(10,10,10,0.86)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
          }}
        >
          <Logo height={28} maxWidth={150} />
          <a
            href="https://batconsultingg-bit.github.io/batconsulting/#form"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              fontWeight: '700',
              fontSize: '13.5px',
              padding: '10px 20px',
              borderRadius: '999px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Заявка
          </a>
        </div>
      </header>

      {/* Контент */}
      <div style={{ maxWidth: '460px', margin: '0 auto', padding: '36px 20px 60px' }}>
        {forgotMode ? (
          <div>
            <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
              Восстановление доступа
            </p>
            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: '800',
                fontSize: 'clamp(30px, 8vw, 38px)',
                lineHeight: '1.1',
                letterSpacing: '-0.5px',
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              Забыли пароль?
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
              Доступно только для аккаунтов с привязанным email. Если вы входите по логину, выданному куратором, обратитесь к нему для сброса пароля.
            </p>

            {forgotSent ? (
              <div
                style={{
                  background: 'rgba(111,163,224,0.1)',
                  border: '1px solid rgba(111,163,224,0.3)',
                  borderRadius: '14px',
                  padding: '18px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <p style={{ color: 'var(--accent-soft)', fontSize: '14px' }}>
                  ✅ Письмо отправлено! Проверьте почту.
                </p>
              </div>
            ) : (
              <>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '18px' }}
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    marginBottom: '14px',
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {loading ? 'Отправка...' : 'Отправить письмо'}
                </button>
              </>
            )}

            {error && (
              <p style={{ color: '#ff9b9b', fontSize: '13px', marginBottom: '14px' }}>{error}</p>
            )}

            <button
              onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'var(--sans)',
                padding: 0,
              }}
            >
              ← Назад ко входу
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
              С возвращением
            </p>

            <h1
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: '800',
                fontSize: 'clamp(34px, 9vw, 46px)',
                lineHeight: '1.08',
                letterSpacing: '-1px',
                color: 'var(--text)',
                marginBottom: '18px',
              }}
            >
              Войти{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
                в кабинет
              </em>
            </h1>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '16px',
                lineHeight: '1.65',
                marginBottom: '34px',
                maxWidth: '40ch',
              }}
            >
              Используй данные, выданные куратором. Все уроки, материалы и задания — здесь.
            </p>

            <label style={labelStyle}>Логин или email</label>
            <input
              type="text"
              placeholder="Ваш логин"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              style={{ ...inputStyle, marginBottom: '18px' }}
            />

            <label style={labelStyle}>Пароль</label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: 'var(--text-faint)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <p style={{ color: '#ff9b9b', fontSize: '13px', marginTop: '8px', marginBottom: '8px' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '17px',
                marginTop: '20px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '999px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15.5px',
                fontWeight: '700',
                fontFamily: 'var(--sans)',
                boxShadow: '0 8px 28px rgba(255,255,255,0.15)',
              }}
            >
              {loading ? 'Загрузка...' : 'Войти в кабинет'}
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <button
                onClick={() => { setForgotMode(true); setError('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'var(--sans)',
                  padding: 0,
                }}
              >
                Не помню пароль
              </button>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: 'var(--accent-soft)', fontSize: '14px', textDecoration: 'none' }}
              >
                Пример кабинета →
              </a>
            </div>

            <div style={{ height: '1px', background: 'var(--border-soft)', margin: '40px 0 4px' }} />

            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '22px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--serif)',
                    fontWeight: '600',
                    fontSize: '22px',
                    color: 'var(--accent-soft)',
                    marginBottom: '4px',
                  }}
                >
                  {s.title}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.4' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
