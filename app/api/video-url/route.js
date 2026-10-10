import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createRouteClient } from '../../../lib/supabase-server'
import { supabaseAdmin, STAFF_ROLES } from '../../../lib/server-auth'
import { s3, BUCKET } from '../../../lib/r2'

export async function POST(request) {
  try {
    const supabase = await createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { key } = await request.json()

    // ключ должен быть вида lessons/<lessonId>/...
    const match = /^lessons\/([0-9a-f-]{36})\//i.exec(key || '')
    if (!match || key.includes('..')) {
      return Response.json({ error: 'Некорректный ключ' }, { status: 400 })
    }
    const lessonId = match[1]

    // три запроса одновременно, а не по очереди
    const [profileRes, lessonRes, enrollRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('role').eq('id', user.id).single(),
      supabaseAdmin
        .from('lessons')
        .select('id, sections!inner(course_id)')
        .eq('id', lessonId)
        .maybeSingle(),
      supabaseAdmin.from('enrollments').select('course_id').eq('user_id', user.id),
    ])

    const isStaff = STAFF_ROLES.includes(profileRes.data?.role)

    if (!isStaff) {
      const lesson = lessonRes.data
      if (!lesson) {
        return Response.json({ error: 'Урок не найден' }, { status: 404 })
      }

      const courseId = Array.isArray(lesson.sections)
        ? lesson.sections[0]?.course_id
        : lesson.sections?.course_id

      const enrolled = (enrollRes.data || []).some((e) => e.course_id === courseId)
      if (!enrolled) {
        return Response.json({ error: 'Нет доступа к этому курсу' }, { status: 403 })
      }
    }

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const url = await getSignedUrl(s3, command, { expiresIn: 900 })
    return Response.json({ url })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
