export const EMPTY_PERSONAL = {
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    phone: '',
    contactEmail: '',
}

const NAME_RE = /^[\p{L}][\p{L}\s'’-]{0,59}$/u
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s()-]+$/

export function normalizePhone(value) {
    const t = String(value || '').trim()
    const digits = t.replace(/\D/g, '')
    return (t.startsWith('+') ? '+' : '') + digits
}

export function normalizePersonal(v) {
    return {
        lastName: String(v.lastName || '').trim(),
        firstName: String(v.firstName || '').trim(),
        middleName: String(v.middleName || '').trim(),
        birthDate: String(v.birthDate || '').trim(),
        phone: normalizePhone(v.phone),
        contactEmail: String(v.contactEmail || '').trim().toLowerCase(),
    }
}

export function validatePersonal(raw) {
    const v = normalizePersonal(raw)
    const e = {}

    if (!v.lastName) e.lastName = 'Введите фамилию'
    else if (!NAME_RE.test(v.lastName)) e.lastName = 'Только буквы, пробел и дефис'

    if (!v.firstName) e.firstName = 'Введите имя'
    else if (!NAME_RE.test(v.firstName)) e.firstName = 'Только буквы, пробел и дефис'

    if (v.middleName && !NAME_RE.test(v.middleName)) e.middleName = 'Только буквы, пробел и дефис'

    if (!v.birthDate) {
        e.birthDate = 'Укажите дату рождения'
    } else {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.birthDate)
        let ok = false
        if (m) {
            const y = Number(m[1])
            const mo = Number(m[2])
            const da = Number(m[3])
            const d = new Date(y, mo - 1, da)
            ok =
                d.getFullYear() === y &&
                d.getMonth() === mo - 1 &&
                d.getDate() === da &&
                d <= new Date() &&
                y >= 1930
        }
        if (!ok) e.birthDate = 'Проверьте дату рождения'
    }

    const digits = v.phone.replace(/\D/g, '')
    if (!String(raw.phone || '').trim()) {
        e.phone = 'Введите номер телефона'
    } else if (!PHONE_RE.test(String(raw.phone).trim()) || digits.length < 9 || digits.length > 15) {
        e.phone = 'Проверьте номер, например +996 700 00 00 00'
    }

    if (v.contactEmail && !EMAIL_RE.test(v.contactEmail)) e.contactEmail = 'Проверьте email'

    return e
}

export function fromProfile(p) {
    return {
        lastName: p?.last_name || '',
        firstName: p?.first_name || '',
        middleName: p?.middle_name || '',
        birthDate: p?.birth_date || '',
        phone: p?.phone || '',
        contactEmail: p?.contact_email || '',
    }
}
