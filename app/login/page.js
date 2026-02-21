'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = 'Введи email'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Введи корректный email'
    } else {
      const blockedDomains = [
        'mailinator.com', 'tempmail.com', 'guerrillamail.com',
        'throwaways.com', 'sharklasers.com', 'spam4.me', 'yopmail.com',
        'trashmail.com', 'dispostable.com', 'fakeinbox.com',
        'temp-mail.org', 'throwam.com', 'maildrop.cc'
      ]
      const domain = email.split('@')[1]?.toLowerCase()
      if (blockedDomains.includes(domain)) {
        newErrors.email = 'Одноразовые почты не разрешены'
      }
    }
    if (!password) {
      newErrors.password = 'Введи пароль'
    } else if (password.length < 8) {
      newErrors.password = 'Минимум 8 символов'
    } else if (!/[A-Z]/.test(password) && mode === 'register') {
      newErrors.password = 'Добавь хотя бы одну заглавную букву'
    } else if (!/[0-9]/.test(password) && mode === 'register') {
      newErrors.password = 'Добавь хотя бы одну цифру'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Неверный email или пароль'); setLoading(false); return }
    router.push('/dashboard')
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    setError('✅ Проверь почту — отправили письмо для подтверждения')
    setLoading(false)
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
          // ===== FORGOT PASSWORD =====
          <div>
            <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
              Восстановление пароля
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Введи email — отправим ссылку для сброса пароля
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
          // ===== ОСНОВНАЯ ФОРМА =====
          <>
            {/* Переключатель вкладок */}
            <div style={{
              display: 'flex', background: '#0a0e1a',
              borderRadius: '8px', padding: '4px', marginBottom: '24px'
            }}>
              <button
                onClick={() => { setMode('register'); setError(''); setErrors({}) }}
                style={{
                  flex: 1, padding: '10px',
                  background: mode === 'register' ? '#1e2433' : 'transparent',
                  border: 'none', borderRadius: '6px',
                  color: mode === 'register' ? '#fff' : '#64748b',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: mode === 'register' ? '600' : '400'
                }}
              >
                Регистрация
              </button>
              <button
                onClick={() => { setMode('login'); setError(''); setErrors({}) }}
                style={{
                  flex: 1, padding: '10px',
                  background: mode === 'login' ? '#1e2433' : 'transparent',
                  border: 'none', borderRadius: '6px',
                  color: mode === 'login' ? '#fff' : '#64748b',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: mode === 'login' ? '600' : '400'
                }}
              >
                Вход
              </button>
            </div>

            {/* Подсказка для входа */}
            {mode === 'login' && (
              <div style={{
                background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
                display: 'flex', gap: '10px', alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
                <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                  Нет аккаунта? Перейди на вкладку{' '}
                  <strong
                    onClick={() => setMode('register')}
                    style={{ color: '#00e5ff', cursor: 'pointer' }}
                  >
                    Регистрация
                  </strong>
                </p>
              </div>
            )}

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ ...inputStyle, marginBottom: '4px' }}
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
                ⚠️ {errors.email}
              </p>
            )}

            {/* Пароль */}
            <div style={{ position: 'relative', marginTop: '8px' }}>
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

            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>
                ⚠️ {errors.password}
              </p>
            )}

            {/* Подсказки пароля при регистрации */}
            {mode === 'register' && password.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', marginTop: '6px' }}>
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
            )}

            {/* Чекбокс для регистрации */}
            {mode === 'register' && (
              <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: '3px', flexShrink: 0 }}
                  />
                  <span style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
                    Я согласен с{' '}
                    <span
                      onClick={() => setShowTerms(true)}
                      style={{ color: '#00e5ff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      условиями использования
                    </span>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p style={{
                color: error.startsWith('✅') ? '#10b981' : '#ef4444',
                marginBottom: '16px', fontSize: '13px'
              }}>
                {error}
              </p>
            )}

            {/* Кнопка входа/регистрации */}
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading || (mode === 'register' && !agreed)}
              style={{
                width: '100%', padding: '12px',
                background: (mode === 'register' && !agreed) ? 'rgba(255,255,255,0.02)' : 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.3)', borderRadius: '8px',
                color: (mode === 'register' && !agreed) ? '#374151' : '#00e5ff',
                fontSize: '14px', fontWeight: '600',
                cursor: (loading || (mode === 'register' && !agreed)) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>

            {/* Забыл пароль */}
            {mode === 'login' && (
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
            )}
          </>
        )}

        {/* Модальное окно условий */}
        {showTerms && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              background: '#111827', border: '1px solid #1e2433',
              borderRadius: '12px', padding: '30px', maxWidth: '500px',
              width: '100%', maxHeight: '80vh', overflowY: 'auto'
            }}>
              <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>
                Условия использования
              </h2>
              <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#fff' }}>1. Авторские права</strong><br/>
                  Все видеоматериалы, тексты и материалы курсов являются интеллектуальной собственностью платформы и защищены законом об авторских правах.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#fff' }}>2. Запрет на распространение</strong><br/>
                  Строго запрещается скачивать, копировать, записывать, передавать третьим лицам или публично демонстрировать любые материалы платформы.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#fff' }}>3. Персональный доступ</strong><br/>
                  Доступ предоставляется исключительно для личного использования. Передача аккаунта запрещена.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#fff' }}>4. Ответственность</strong><br/>
                  Нарушение условий влечёт блокировку аккаунта и юридическую ответственность.
                </p>
                <p>
                  <strong style={{ color: '#fff' }}>5. Мониторинг</strong><br/>
                  Платформа отслеживает активность пользователей в целях защиты авторских прав.
                </p>
              </div>
              <button
                onClick={() => setShowTerms(false)}
                style={{
                  marginTop: '20px', width: '100%', padding: '12px',
                  background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                  borderRadius: '8px', color: '#00e5ff', cursor: 'pointer', fontSize: '14px'
                }}
              >
                Понятно
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}