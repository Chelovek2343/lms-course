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

        const { documentId, status, comment } = await request.json()

        if (!UUID.test(documentId || '')) {
            return Response.json({ error: 'Некорректный документ' }, { status: 400 })
        }
        if (!['approved', 'rejected'].includes(status)) {
            return Response.json({ error: 'Некорректный статус' }, { status: 400 })
        }

        const now = new Date().toISOString()
        const { data, error } = await supabaseAdmin
            .from('student_documents')
            .update({
                status,
                comment:
                    status === 'rejected'
                        ? String(comment || '').trim().slice(0, 500) || null
                        : null,
                reviewed_by: caller.user.id,
                reviewed_at: now,
                updated_at: now,
            })
            .eq('id', documentId)
            .select('id')
            .maybeSingle()

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }
        if (!data) {
            return Response.json({ error: 'Документ не найден' }, { status: 404 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}