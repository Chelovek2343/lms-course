import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '../../../../lib/supabase-server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

function randomString(length, chars) {
    let out = ''
    for (let i = 0; i < length; i++) {
        out += chars[Math.floor(Math.random() * chars.length)]
    }
    return out
}

function generateLogin() {
    return 'student' + randomString(6, '0123456789')
}

function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    return randomString(10, chars)
}

export async function POST(request) {
    try {
        const supabase = await createRouteClient()
        const { data: { user: caller } } = await supabase.auth.getUser()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single()

        if (!callerProfile || !['admin', 'superuser', 'owner'].includes(callerProfile.role)) {
            return Response.json({ error: 'Недостаточно прав' }, { status: 403 })
        }

        let login = generateLogin()
        // на всякий случай проверяем уникальность логина
        for (let i = 0; i < 5; i++) {
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('login', login)
                .maybeSingle()
            if (!existing) break
            login = generateLogin()
        }

        const password = generatePassword()
        const internalEmail = `${login}@lms.internal`

        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: internalEmail,
            password,
            email_confirm: true,
        })

        if (error) {
            return Response.json({ error: error.message }, { status: 400 })
        }

        // прописываем логин в профиль (email/role уже заполнил триггер handle_new_user)
        await supabaseAdmin
            .from('profiles')
            .update({ login })
            .eq('id', created.user.id)

        return Response.json({ success: true, login, password })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}