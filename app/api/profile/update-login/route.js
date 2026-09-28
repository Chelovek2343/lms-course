import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '../../../../lib/supabase-server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

const LOGIN_REGEX = /^[a-z0-9._-]{3,30}$/

export async function POST(request) {
    try {
        const { login } = await request.json()
        const value = (login || '').trim().toLowerCase()

        if (!LOGIN_REGEX.test(value)) {
            return Response.json(
                { error: 'Логин: 3–30 символов, только латиница, цифры и . _ -' },
                { status: 400 }
            )
        }

        const supabase = await createRouteClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('login', value)
            .maybeSingle()

        if (existing && existing.id !== user.id) {
            return Response.json({ error: 'Этот логин уже занят' }, { status: 409 })
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ login: value })
            .eq('id', user.id)

        if (error) {
            if (error.code === '23505') {
                return Response.json({ error: 'Этот логин уже занят' }, { status: 409 })
            }
            return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, login: value })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}