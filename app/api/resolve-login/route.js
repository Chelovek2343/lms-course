import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const { identifier } = await request.json()

        if (!identifier || !identifier.trim()) {
            return Response.json({ error: 'Введите логин или email' }, { status: 400 })
        }

        const value = identifier.trim()

        // если это похоже на email — используем как есть (админы/суперюзеры/owner)
        if (value.includes('@')) {
            return Response.json({ email: value })
        }

        // иначе ищем по логину (студенты)
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('login', value)
            .maybeSingle()

        if (error || !data) {
            return Response.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        return Response.json({ email: data.email })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}