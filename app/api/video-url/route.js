import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'
import { createRouteClient } from '../../../lib/supabase-server'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isStaff = ['admin', 'superuser', 'owner'].includes(profile?.role)

    if (!isStaff) {
      const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('id, sections!inner(course_id)')
        .eq('id', lessonId)
        .maybeSingle()

      if (!lesson) {
        return Response.json({ error: 'Урок не найден' }, { status: 404 })
      }

      const courseId = Array.isArray(lesson.sections)
        ? lesson.sections[0]?.course_id
        : lesson.sections?.course_id

      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (!enrollment) {
        return Response.json({ error: 'Нет доступа к этому курсу' }, { status: 403 })
      }
    }

    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: key,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 900 })
    return Response.json({ url })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
