import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from './supabase-server'

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)

export const STAFF_ROLES = ['admin', 'superuser', 'owner']

// Кто делает запрос: пользователь, его роль и признак «персонал»
export async function getCaller() {
    const supabase = await createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'student'
    return { user, role, isStaff: STAFF_ROLES.includes(role) }
}
