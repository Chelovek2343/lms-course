import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3, BUCKET } from '../../../../lib/r2'
import { supabaseAdmin, getCaller } from '../../../../lib/server-auth'

const UUID = /^[0-9a-f-]{36}$/i

export async function POST(request) {
    try {
        const caller = await getCaller()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { documentId } = await request.json()
        if (!UUID.test(documentId || '')) {
            return Response.json({ error: 'Некорректный документ' }, { status: 400 })
        }

        const { data: doc } = await supabaseAdmin
            .from('student_documents')
            .select('user_id, file_key')
            .eq('id', documentId)
            .maybeSingle()

        if (!doc) {
            return Response.json({ error: 'Документ не найден' }, { status: 404 })
        }
        if (doc.user_id !== caller.user.id && !caller.isStaff) {
            return Response.json({ error: 'Нет доступа' }, { status: 403 })
        }

        const command = new GetObjectCommand({ Bucket: BUCKET, Key: doc.file_key })
        const url = await getSignedUrl(s3, command, { expiresIn: 300 })

        return Response.json({ url })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}