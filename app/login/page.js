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
    padding: '13px 14px',
    paddingRight: '44px',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text)',
    fontSize: '14.5px',
    fontFamily: 'var(--sans)',
    fontWeight: '500',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
        padding: '24px',
        background: 'var(--bg)',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 15% 0%, rgba(111,163,224,0.14) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 30%, rgba(255,255,255,0.05) 0%, transparent 60%)',
        fontFamily: 'var(--sans)',
      }}
    >
      <Logo height={40} maxWidth={220} />

      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '36px 32px 40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.03), 0 24px 60px rgba(0,0,0,0.45), 0 0 80px var(--accent-glow)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: '600',
            fontSize: '24px',
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          Личный кабинет
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '26px' }}>
          Платформа обучения BAT Consulting
        </p>

        {forgotMode ? (
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: '600', color: 'var(--text)', fontSize: '18px', marginBottom: '8px' }}>
              Восстановление пароля
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
              Доступно только для аккаунтов с привязанным email. Если вы студент и входите по логину, обратитесь к администратору.
            </p>

            {forgotSent ? (
              <div
                style={{
                  background: 'rgba(111,163,224,0.1)',
                  border: '1px solid rgba(111,163,224,0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  marginBottom: '12px',
                }}
              >
                <p style={{ color: 'var(--accent-soft)', fontSize: '14px' }}>
                  ✅ Письмо отправлено! Проверьте почту.
                </p>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '16px' }}
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginBottom: '12px',
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14.5px',
                    fontWeight: '700',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {loading ? 'Отправка...' : 'Отправить письмо'}
                </button>
              </>
            )}

            <button
              onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'var(--sans)',
              }}
            >
              ← Назад
            </button>
          </div>
        ) : (
          <>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
              Логин или email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              style={{ ...inputStyle, marginBottom: '14px' }}
            />

            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: '4px' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '13px',
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
              <p style={{ color: '#ff9b9b', marginTop: '10px', marginBottom: '6px', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '20px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14.5px',
                fontWeight: '700',
                fontFamily: 'var(--sans)',
                boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
              }}
            >
              {loading ? 'Загрузка...' : 'Войти'}
            </button>

            <button
              onClick={() => setForgotMode(true)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--sans)',
              }}
            >
              Забыл пароль?
            </button>
          </>
        )}
      </div>
    </div>
  )
}
