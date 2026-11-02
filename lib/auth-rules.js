export function passwordError(p) {
    if (!p) return 'Введите пароль'
    if (p.length < 8) return 'Минимум 8 символов'
    if (!/[A-Z]/.test(p)) return 'Добавьте хотя бы одну заглавную букву'
    if (!/[0-9]/.test(p)) return 'Добавьте хотя бы одну цифру'
    return ''
}

const BLOCKED_DOMAINS = [
    'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaways.com',
    'sharklasers.com', 'spam4.me', 'yopmail.com', 'trashmail.com',
    'dispostable.com', 'fakeinbox.com', 'temp-mail.org', 'maildrop.cc',
]

export function isDisposableEmail(email) {
    const domain = String(email || '').split('@')[1]?.toLowerCase()
    return !!domain && BLOCKED_DOMAINS.includes(domain)
}

export function friendlyAuthError(message = '') {
    const m = String(message).toLowerCase()
    if (m.includes('already registered') || m.includes('already been registered')) {
        return 'Этот email уже зарегистрирован. Войдите в аккаунт.'
    }
    if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
        return 'Слишком много попыток. Подождите немного и попробуйте снова.'
    }
    if (m.includes('signups not allowed') || m.includes('signup is disabled') || m.includes('signups are disabled')) {
        return 'Регистрация сейчас закрыта. Обратитесь к куратору.'
    }
    if (m.includes('database error')) {
        return 'Не удалось создать аккаунт. Проверьте данные и попробуйте ещё раз.'
    }
    if (m.includes('password')) return 'Пароль не подходит. Придумайте другой.'
    if (m.includes('invalid') && m.includes('email')) return 'Проверьте email.'
    return 'Не удалось выполнить действие. Попробуйте ещё раз.'
}
