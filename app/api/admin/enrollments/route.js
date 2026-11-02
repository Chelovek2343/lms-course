import { supabaseAdmin, getCaller } from '../../../../lib/server-auth'

const UUID = /^[0-9a-f-]{36}$/i

export async function POST(request) {
    try {
        const caller = await getCaller()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }
        if (!caller.isStaff) {
            return Response.json({ error: 'Недостаточно прав' }, { status: 403 })
        }

        const { userId, courseId, enroll } = await request.json()

        if (!UUID.test(userId || '') || !UUID.test(courseId || '') || typeof enroll !== 'boolean') {
            return Response.json({ error: 'Некорректный запрос' }, { status: 400 })
        }

        const [{ data: target }, { data: course }] = await Promise.all([
            supabaseAdmin.from('profiles').select('id').eq('id', userId).maybeSingle(),
            supabaseAdmin.from('courses').select('id').eq('id', courseId).maybeSingle(),
        ])
        if (!target) return Response.json({ error: 'Пользователь не найден' }, { status: 404 })
        if (!course) return Response.json({ error: 'Курс не найден' }, { status: 404 })

        if (enroll) {
            const { error } = await supabaseAdmin
                .from('enrollments')
                .upsert(
                    { user_id: userId, course_id: courseId },
                    { onConflict: 'user_id,course_id', ignoreDuplicates: true },
                )
            if (error) return Response.json({ error: error.message }, { status: 500 })
        } else {
            const { error } = await supabaseAdmin
                .from('enrollments')
                .delete()
                .eq('user_id', userId)
                .eq('course_id', courseId)
            if (error) return Response.json({ error: error.message }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}