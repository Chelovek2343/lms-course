import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { createRouteClient } from '../../../lib/supabase-server';

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
);

export async function POST(request) {
    try {
        const supabase = await createRouteClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return Response.json({ error: 'Не авторизован' }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'superuser', 'owner'].includes(profile.role)) {
            return Response.json({ error: 'Недостаточно прав' }, { status: 403 });
        }

        const { fileName, fileType, lessonId } = await request.json();

        if (!/^[0-9a-f-]{36}$/i.test(lessonId || '')) {
            return Response.json({ error: 'Некорректный lessonId' }, { status: 400 });
        }

        // в ключе оставляем только безопасные символы,
        // настоящее имя файла хранится в базе отдельно
        const safeName = String(fileName || 'file')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(-100);
        const key = `lessons/${lessonId}/${Date.now()}-${safeName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return Response.json({ signedUrl, key });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
