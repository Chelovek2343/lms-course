'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [linkBroken, setLinkBroken] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Supabase кладёт ошибку в адрес, если ссылка из письма недействительна
  useEffect(() => {
    const raw = `${window.location.hash}${window.location.search}`
    if (raw.includes('error_code=') || raw.includes('error=access_denied')) {
      setLinkBroken(true)
    }
  }, [])

  const handleReset = async () => {
    setError('')

    if (password.length < 8) {
      setError('Минимум 8 символов')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('Добавьте хотя бы одну заглавную букву')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Добавьте хотя бы одну цифру')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (/session/i.test(error.message)) {
        setLinkBroken(true)
      } else if (/different from the old password/i.test(error.message)) {
        setError('Новый пароль должен отличаться от старого')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
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

  const hint = (ok, text) => (
    <span style={{ fontSize: '12.5px', color: ok ? '#6ee7b7' : 'var(--text-faint)' }}>
      {ok ? '✓' : '○'} {text}
    </span>
  )

  const heading = (head, accent) => (
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
      {head}{' '}
      <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>
        {accent}
      </em>
    </h1>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
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
            padding: '14px 20px',
          }}
        >
          <Logo height={28} maxWidth={150} />
        </div>
      </header>

      <div style={{ maxWidth: '460px', margin: '0 auto', padding: '36px 20px 60px' }}>
        {linkBroken ? (
          <>
            <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
              Восстановление доступа
            </p>
            {heading('Ссылка', 'недействительна')}
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.65', marginBottom: '28px' }}>
              Ссылка для сброса пароля устарела или уже использована. Запросите новое письмо на странице входа.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                padding: '17px',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '15.5px',
                fontWeight: '700',
                fontFamily: 'var(--sans)',
              }}
            >
              Ко входу
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
              Восстановление доступа
            </p>
            {heading('Новый', 'пароль')}
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.65', marginBottom: '30px' }}>
              Придумайте новый пароль для входа в кабинет.
            </p>

            {success ? (
              <div
                style={{
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.35)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#6ee7b7', fontSize: '15px' }}>
                  ✅ Пароль изменён! Перенаправляем...
                </p>
              </div>
            ) : (
              <>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    marginBottom: '8px',
                  }}
                >
                  Новый пароль
                </label>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Новый пароль"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleReset()
                    }}
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

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {hint(password.length >= 8, '8+ символов')}
                  {hint(/[A-Z]/.test(password), 'Заглавная буква')}
                  {hint(/[0-9]/.test(password), 'Цифра')}
                </div>

                {error && (
                  <p style={{ color: '#ff9b9b', fontSize: '13.5px', marginTop: '12px' }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleReset}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '17px',
                    marginTop: '22px',
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontSize: '15.5px',
                    fontWeight: '700',
                    fontFamily: 'var(--sans)',
                    boxShadow: '0 8px 28px rgba(255,255,255,0.15)',
                  }}
                >
                  {loading ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
