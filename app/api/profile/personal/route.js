import { supabaseAdmin, getCaller } from '../../../../lib/server-auth'
import { validatePersonal, normalizePersonal } from '../../../../lib/personal'
import { TERMS_VERSION, PRIVACY_VERSION } from '../../../../lib/legal-version'

export async function POST(request) {
    try {
        const caller = await getCaller()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const body = await request.json()
        const values = {
            lastName: String(body.lastName ?? ''),
            firstName: String(body.firstName ?? ''),
            middleName: String(body.middleName ?? ''),
            birthDate: String(body.birthDate ?? ''),
            phone: String(body.phone ?? ''),
            contactEmail: String(body.contactEmail ?? ''),
        }

        const errors = validatePersonal(values)
        if (Object.keys(errors).length > 0) {
            return Response.json({ error: 'Проверьте заполнение полей', fields: errors }, { status: 400 })
        }
        const clean = normalizePersonal(values)

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('onboarded_at, terms_version, privacy_version')
            .eq('id', caller.user.id)
            .single()

        if (!profile) {
            return Response.json({ error: 'Профиль не найден' }, { status: 404 })
        }

        const update = {
            last_name: clean.lastName,
            first_name: clean.firstName,
            middle_name: clean.middleName || null,
            birth_date: clean.birthDate,
            phone: clean.phone,
            contact_email: clean.contactEmail || null,
        }

        // студенту без принятых соглашений нужно принять их (первый вход или новая редакция)
        const needsAcceptance =
            caller.role === 'student' &&
            (!profile.onboarded_at ||
                profile.terms_version !== TERMS_VERSION ||
                profile.privacy_version !== PRIVACY_VERSION)

        if (needsAcceptance) {
            const accepted =
                body.acceptedTerms === true &&
                body.acceptedPrivacy === true &&
                body.termsVersion === TERMS_VERSION &&
                body.privacyVersion === PRIVACY_VERSION

            if (!accepted) {
                return Response.json(
                    { error: 'Нужно принять пользовательское соглашение и политику конфиденциальности' },
                    { status: 400 },
                )
            }

            const now = new Date().toISOString()
            update.terms_version = TERMS_VERSION
            update.privacy_version = PRIVACY_VERSION
            update.agreements_accepted_at = now
            update.onboarded_at = profile.onboarded_at || now
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(update)
            .eq('id', caller.user.id)

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}