'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

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
    width: '100%', padding: '12px', paddingRight: '44px',
    background: '#0a0e1a', border: '1px solid #1e2433',
    borderRadius: '8px', color: '#fff', fontSize: '14px',
    boxSizing: 'border-box'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', fontFamily: 'monospace'
    }}>
      <div style={{
        background: '#111827', padding: '40px',
        borderRadius: '12px', border: '1px solid #1e2433',
        width: '100%', maxWidth: '400px'
      }}>
        <h1 style={{ color: '#fff', marginBottom: '6px', fontSize: '24px' }}>LMS Platform</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
          Платформа онлайн-обучения
        </p>

        {forgotMode ? (
          <div>
            <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
              Восстановление пароля
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Доступно только для аккаунтов с привязанным email. Если вы студент и входите по логину, обратитесь к администратору для сброса пароля.
            </p>

            {forgotSent ? (
              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '8px', padding: '16px', textAlign: 'center', marginBottom: '12px'
              }}>
                <p style={{ color: '#10b981', fontSize: '14px' }}>
                  ✅ Письмо отправлено! Проверь почту.
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
                    width: '100%', padding: '12px', marginBottom: '12px',
                    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                    borderRadius: '8px', color: '#00e5ff', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600'
                  }}
                >
                  {loading ? 'Отправка...' : 'Отправить письмо'}
                </button>
              </>
            )}

            <button
              onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }}
              style={{
                width: '100%', padding: '10px', background: 'transparent',
                border: '1px solid #1e2433', borderRadius: '8px',
                color: '#64748b', cursor: 'pointer', fontSize: '13px'
              }}
            >
              ← Назад
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Логин или email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              style={{ ...inputStyle, marginBottom: '12px' }}
            />

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, marginBottom: '4px' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <p style={{ color: '#ef4444', marginTop: '10px', marginBottom: '6px', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: '16px',
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: '8px', color: '#00e5ff',
                fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Загрузка...' : 'Войти'}
            </button>

            <button
              onClick={() => setForgotMode(true)}
              style={{
                width: '100%', padding: '10px', marginTop: '10px',
                background: 'transparent', border: 'none',
                color: '#64748b', cursor: 'pointer', fontSize: '12px'
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
