import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '../../../../lib/supabase-server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
    try {
        const { userId } = await request.json()

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

        if (userId === caller.id) {
            return Response.json({ error: 'Нельзя удалить самого себя' }, { status: 400 })
        }

        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (!targetProfile) {
            return Response.json({ error: 'Пользователь не найден' }, { status: 404 })
        }

        if (targetProfile.role === 'owner') {
            return Response.json({ error: 'Владельца удалить нельзя' }, { status: 403 })
        }

        if (targetProfile.role === 'superuser' && callerProfile.role !== 'owner') {
            return Response.json({ error: 'Суперпользователя может удалить только владелец' }, { status: 403 })
        }

        if (callerProfile.role === 'admin' && ['admin', 'superuser'].includes(targetProfile.role)) {
            return Response.json({ error: 'Недостаточно прав для удаления этого пользователя' }, { status: 403 })
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) return Response.json({ error: error.message }, { status: 500 })

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
