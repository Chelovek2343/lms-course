'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async () => {
    if (password.length < 8) {
      setError('Минимум 8 символов')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('Добавь хотя бы одну заглавную букву')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('Добавь хотя бы одну цифру')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
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
        <h1 style={{ color: '#fff', fontSize: '22px', marginBottom: '8px' }}>
          Новый пароль
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
          Введи новый пароль для аккаунта
        </p>

        {success ? (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '8px', padding: '16px', textAlign: 'center'
          }}>
            <p style={{ color: '#10b981', fontSize: '14px' }}>
              ✅ Пароль изменён! Перенаправляем...
            </p>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px', paddingRight: '44px',
                  background: '#0a0e1a', border: '1px solid #1e2433',
                  borderRadius: '8px', color: '#fff', fontSize: '14px',
                  boxSizing: 'border-box'
                }}
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

            {/* Подсказки пароля */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: password.length >= 8 ? '#10b981' : '#64748b' }}>
                {password.length >= 8 ? '✓' : '○'} 8+ символов
              </span>
              <span style={{ fontSize: '11px', color: /[A-Z]/.test(password) ? '#10b981' : '#64748b' }}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Заглавная буква
              </span>
              <span style={{ fontSize: '11px', color: /[0-9]/.test(password) ? '#10b981' : '#64748b' }}>
                {/[0-9]/.test(password) ? '✓' : '○'} Цифра
              </span>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>
                ⚠️ {error}
              </p>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: '8px', color: '#00e5ff', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600'
              }}
            >
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}