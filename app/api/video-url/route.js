import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export async function POST(request) {
  try {
    const { key } = await request.json()

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