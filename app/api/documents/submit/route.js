import { HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3, BUCKET } from '../../../../lib/r2'
import { supabaseAdmin, getCaller } from '../../../../lib/server-auth'
import { ALLOWED_DOC_TYPES, MAX_DOC_SIZE } from '../../../../lib/documents'

const UUID = /^[0-9a-f-]{36}$/i

const removeObject = async (key) => {
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    } catch {
        // не критично
    }
}

export async function POST(request) {
    try {
        const caller = await getCaller()
        if (!caller) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 })
        }

        const { typeId, key, fileName } = await request.json()

        if (!UUID.test(typeId || '')) {
            return Response.json({ error: 'Некорректный тип документа' }, { status: 400 })
        }

        const prefix = `documents/${caller.user.id}/${typeId}/`
        if (typeof key !== 'string' || !key.startsWith(prefix) || key.includes('..')) {
            return Response.json({ error: 'Некорректный ключ файла' }, { status: 400 })
        }

        let head
        try {
            head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
        } catch {
            return Response.json(
                { error: 'Файл не найден в хранилище. Попробуйте загрузить ещё раз.' },
                { status: 400 },
            )
        }

        const size = head.ContentLength || 0
        const contentType = head.ContentType || ''
        if (size <= 0 || size > MAX_DOC_SIZE || !ALLOWED_DOC_TYPES[contentType]) {
            await removeObject(key)
            return Response.json({ error: 'Файл не подходит по размеру или формату' }, { status: 400 })
        }

        const { data: existing } = await supabaseAdmin
            .from('student_documents')
            .select('id, status, file_key')
            .eq('user_id', caller.user.id)
            .eq('type_id', typeId)
            .maybeSingle()

        if (existing?.status === 'approved') {
            await removeObject(key)
            return Response.json({ error: 'Документ уже одобрен, заменить его нельзя' }, { status: 403 })
        }

        const { data: document, error } = await supabaseAdmin
            .from('student_documents')
            .upsert(
                {
                    user_id: caller.user.id,
                    type_id: typeId,
                    file_key: key,
                    file_name: String(fileName || '').slice(0, 200) || 'Документ',
                    file_size: size,
                    file_type: contentType,
                    status: 'pending',
                    comment: null,
                    reviewed_by: null,
                    reviewed_at: null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,type_id' },
            )
            .select()
            .single()

        if (error) {
            await removeObject(key)
            return Response.json({ error: error.message }, { status: 500 })
        }

        // старый файл при замене удаляем из хранилища
        if (existing?.file_key && existing.file_key !== key) {
            await removeObject(existing.file_key)
        }

        return Response.json({ success: true, document })
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}