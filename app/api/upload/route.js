import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
);

export async function POST(request) {
    try {
        const { fileName, fileType, lessonId } = await request.json();

        const key = `lessons/${lessonId}/${Date.now()}-${fileName}`;

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
