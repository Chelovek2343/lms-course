'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import Logo from '../../components/Logo'
import PersonalDataFields from '../../components/PersonalDataFields'
import LegalCard from '../../components/LegalCard'
import { EMPTY_PERSONAL, validatePersonal, normalizePersonal } from '../../lib/personal'
import { passwordError, isDisposableEmail, friendlyAuthError } from '../../lib/auth-rules'
import { TERMS_VERSION, TERMS_DATE, PRIVACY_VERSION, PRIVACY_DATE } from '../../lib/legal-version'
import { TERMS_HTML, PRIVACY_HTML } from '../../lib/legal'

const cardStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: '24px',
  padding: '24px 22px',
  marginBottom: '18px',
}

const cardTitle = {
  fontFamily: 'var(--serif)',
  fontWeight: '700',
  fontSize: '21px',
  color: 'var(--text)',
  marginBottom: '18px',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--text)',
  marginBottom: '8px',
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '14px 46px 14px 16px',
  background: 'var(--input-bg)',
  border: hasError ? '1.5px solid rgba(248,113,113,0.7)' : '1.5px solid rgba(111,163,224,0.25)',
  borderRadius: '14px',
  color: 'var(--text)',
  fontSize: '15px',
  fontFamily: 'var(--sans)',
  boxSizing: 'border-box',
  outline: 'none',
})

export default function RegisterPage() {
  const [values, setValues] = useState(EMPTY_PERSONAL)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [exists, setExists] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [resendLeft, setResendLeft] = useState(0)
  const [resendMsg, setResendMsg] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  // уже вошедшего человека на регистрацию не пускаем
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/courses')
    })
  }, [])

  useEffect(() => {
    if (resendLeft <= 0) return
    const t = setTimeout(() => setResendLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendLeft])

  const onChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
    setError('')
    setExists(false)
  }

  const submit = async () => {
    setError('')
    setExists(false)

    const errs = validatePersonal(values)
    const email = values.contactEmail.trim()
    if (!email) errs.contactEmail = 'Введите email'
    else if (isDisposableEmail(email)) errs.contactEmail = 'Одноразовые почты не разрешены'

    const pErr = passwordError(password)
    if (pErr) errs.password = pErr
    if (!errs.password && password !== repeat) errs.repeat = 'Пароли не совпадают'

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Проверьте заполнение полей выше.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!terms || !privacy) return

    const clean = normalizePersonal(values)
    setBusy(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: clean.contactEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/courses`,
        data: {
          last_name: clean.lastName,
          first_name: clean.firstName,
          middle_name: clean.middleName,
          birth_date: clean.birthDate,
          phone: clean.phone,
          contact_email: clean.contactEmail,
          accepted_agreements: true,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
      },
    })

    if (authError) {
      console.error('signUp error:', authError)
      setError(friendlyAuthError(authError.message))
      setBusy(false)
      return
    }

    // при включённом подтверждении почты Supabase для уже занятого адреса
    // не сообщает об ошибке, а возвращает пользователя без identities
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setExists(true)
      setBusy(false)
      return
    }

    if (data?.session) {
      router.replace('/courses')
      return
    }

    setSentTo(clean.contactEmail)
    setResendLeft(60)
    setBusy(false)
  }

  const resend = async () => {
    if (resendLeft > 0 || !sentTo) return
    setResendMsg(null)
    const { error: e } = await supabase.auth.resend({
      type: 'signup',
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/courses` },
    })
    if (e) setResendMsg({ ok: false, text: friendlyAuthError(e.message) })
    else setResendMsg({ ok: true, text: 'Письмо отправлено ещё раз' })
    setResendLeft(60)
  }

  const header = (
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
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
        }}
      >
        <Logo height={28} maxWidth={150} />
        <a
          href="/login"
          style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
        >
          Войти
        </a>
      </div>
    </header>
  )

  /* ----- экран «проверьте почту» ----- */
  if (sentTo) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
        {header}
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px 60px' }}>
          <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
            Почти готово
          </p>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: '800',
              fontSize: 'clamp(34px, 9vw, 46px)',
              lineHeight: '1.08',
              letterSpacing: '-1px',
              color: 'var(--text)',
              marginBottom: '16px',
            }}
          >
            Проверьте{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>почту</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.65', marginBottom: '8px' }}>
            Мы отправили письмо на <b style={{ color: 'var(--text)' }}>{sentTo}</b>. Перейдите по ссылке из письма,
            чтобы активировать аккаунт.
          </p>
          <p style={{ color: 'var(--text-faint)', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
            Письмо может идти несколько минут. Проверьте папку «Спам». Если откроете ссылку на другом устройстве,
            вас просто попросят войти: аккаунт уже будет подтверждён.
          </p>

          <button
            onClick={resend}
            disabled={resendLeft > 0}
            style={{
              padding: '14px 26px',
              borderRadius: '999px',
              border: '1.5px solid rgba(111,163,224,0.5)',
              background: 'transparent',
              color: 'var(--accent-soft)',
              fontSize: '14.5px',
              fontWeight: '700',
              fontFamily: 'var(--sans)',
              cursor: resendLeft > 0 ? 'not-allowed' : 'pointer',
              opacity: resendLeft > 0 ? 0.55 : 1,
            }}
          >
            {resendLeft > 0 ? `Отправить ещё раз через ${resendLeft} с` : 'Отправить письмо ещё раз'}
          </button>

          {resendMsg && (
            <p style={{ color: resendMsg.ok ? '#6ee7b7' : '#ff9b9b', fontSize: '14px', marginTop: '14px' }}>
              {resendMsg.text}
            </p>
          )}

          <p style={{ marginTop: '28px' }}>
            <a href="/login" style={{ color: 'var(--accent-soft)', fontWeight: '700', textDecoration: 'none' }}>
              Перейти ко входу
            </a>
          </p>
        </main>
      </div>
    )
  }

  const canSubmit = terms && privacy && !busy

  const hint = (ok, text) => (
    <span style={{ fontSize: '12.5px', color: ok ? '#6ee7b7' : 'var(--text-faint)' }}>
      {ok ? '✓' : '○'} {text}
    </span>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {header}

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <p style={{ color: 'var(--accent-soft)', fontWeight: '600', fontSize: '13px', marginBottom: '14px' }}>
          Регистрация
        </p>
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: '800',
            fontSize: 'clamp(34px, 9vw, 46px)',
            lineHeight: '1.08',
            letterSpacing: '-1px',
            color: 'var(--text)',
            marginBottom: '14px',
          }}
        >
          Давайте{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--accent-soft)', fontWeight: '500' }}>познакомимся</em>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', marginBottom: '28px' }}>
          Данные нужны для подачи документов и заполняются один раз.
        </p>

        <section style={cardStyle}>
          <h2 style={cardTitle}>Личные данные</h2>
          <PersonalDataFields
            values={values}
            errors={errors}
            onChange={onChange}
            disabled={busy}
            emailHint="Это ваш логин для входа. На него придёт письмо для подтверждения."
          />
        </section>

        <section style={cardStyle}>
          <h2 style={cardTitle}>Пароль</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '18px',
            }}
          >
            <div>
              <label style={labelStyle}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  disabled={busy}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((er) => ({ ...er, password: undefined }))
                    setError('')
                  }}
                  style={inputStyle(!!errors.password)}
                />
                <button
                  type="button"
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
              {errors.password && (
                <p style={{ color: '#ff9b9b', fontSize: '12.5px', marginTop: '6px' }}>{errors.password}</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Повторите пароль</label>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={repeat}
                disabled={busy}
                onChange={(e) => {
                  setRepeat(e.target.value)
                  setErrors((er) => ({ ...er, repeat: undefined }))
                  setError('')
                }}
                style={inputStyle(!!errors.repeat)}
              />
              {errors.repeat && (
                <p style={{ color: '#ff9b9b', fontSize: '12.5px', marginTop: '6px' }}>{errors.repeat}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '14px' }}>
            {hint(password.length >= 8, '8+ символов')}
            {hint(/[A-Z]/.test(password), 'Заглавная буква')}
            {hint(/[0-9]/.test(password), 'Цифра')}
          </div>
        </section>

        <LegalCard
          title="Пользовательское соглашение"
          date={TERMS_DATE}
          html={TERMS_HTML}
          checked={terms}
          onChange={setTerms}
          label="Я прочитал(а) и принимаю пользовательское соглашение"
        />

        <LegalCard
          title="Политика конфиденциальности"
          date={PRIVACY_DATE}
          html={PRIVACY_HTML}
          checked={privacy}
          onChange={setPrivacy}
          label="Я прочитал(а) и принимаю политику конфиденциальности"
        />

        {error && <p style={{ color: '#ff9b9b', fontSize: '14px', marginBottom: '14px' }}>{error}</p>}

        {exists && (
          <p style={{ color: '#f5b84a', fontSize: '14px', lineHeight: '1.5', marginBottom: '14px' }}>
            Аккаунт с таким email уже существует.{' '}
            <a href="/login" style={{ color: 'var(--accent-soft)', fontWeight: '700', textDecoration: 'none' }}>
              Войдите
            </a>{' '}
            или восстановите пароль на странице входа.
          </p>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--bg)',
            fontSize: '15.5px',
            fontWeight: '700',
            fontFamily: 'var(--sans)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.45,
          }}
        >
          {busy ? 'Создаю аккаунт...' : 'Зарегистрироваться'}
        </button>

        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '20px', textAlign: 'center' }}>
          Уже есть аккаунт?{' '}
          <a href="/login" style={{ color: 'var(--accent-soft)', fontWeight: '700', textDecoration: 'none' }}>
            Войти
          </a>
        </p>
      </main>
    </div>
  )
}