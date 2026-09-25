import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '../../../../lib/supabase-server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const { targetUserId, newRole } = await request.json()

        if (!['student', 'admin'].includes(newRole)) {
            return Response.json({ error: 'Недопустимая роль' }, { status: 400 })
        }

        const supabase = createRouteClient()
        const { data: { user: caller } } = await supabase.auth.getUser()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single()

        if (!callerProfile || !['admin', 'superuser'].includes(callerProfile.role)) {
            return Response.json({ error: 'Недостаточно прав' }, { status: 403 })
        }

        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', targetUserId)
            .single()

        if (!targetProfile) {
            return Response.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        if (targetProfile.role === 'superuser') {
            return Response.json({ error: 'Нельзя менять роль суперпользователя' }, { status: 403 })
        }

        if (callerProfile.role === 'admin' && targetProfile.role === 'admin') {
            return Response.json({ error: 'Только суперпользователь может менять роль администратора' }, { status: 403 })
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId)

        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}