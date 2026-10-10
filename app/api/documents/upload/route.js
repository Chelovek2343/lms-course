import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3, BUCKET } from '../../../../lib/r2'
import { supabaseAdmin, getCaller } from '../../../../lib/server-auth'
import {
    ALLOWED_DOC_TYPES,
    ALLOWED_DOC_LABEL,
    MAX_DOC_SIZE,
} from '../../../../lib/documents'

const UUID = /^[0-9a-f-]{36}$/i

export async function POST(request) {
    try {
        const caller = await getCaller()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { typeId, fileName, fileType, fileSize } = await request.json()

        if (!UUID.test(typeId || '')) {
            return Response.json({ error: 'Некорректный тип документа' }, { status: 400 })
        }
        if (!ALLOWED_DOC_TYPES[fileType]) {
            return Response.json({ error: `Допустимые форматы: ${ALLOWED_DOC_LABEL}` }, { status: 400 })
        }
        if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_DOC_SIZE) {
            return Response.json(
                { error: `Файл слишком большой (максимум ${MAX_DOC_SIZE / 1024 / 1024} МБ)` },
                { status: 400 },
            )
        }

        const { data: type } = await supabaseAdmin
            .from('document_types')
            .select('id')
            .eq('id', typeId)
            .maybeSingle()
        if (!type) {
            return Response.json({ error: 'Такого документа нет в списке' }, { status: 404 })
        }

        const { data: existing } = await supabaseAdmin
            .from('student_documents')
            .select('status')
            .eq('user_id', caller.user.id)
            .eq('type_id', typeId)
            .maybeSingle()
        if (existing?.status === 'approved') {
            return Response.json({ error: 'Документ уже одобрен, заменить его нельзя' }, { status: 403 })
        }

        const safeName = String(fileName || 'file')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(-100)
        const key = `documents/${caller.user.id}/${typeId}/${Date.now()}-${safeName}`

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: fileType,
        })
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 })

        return Response.json({ signedUrl, key })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}