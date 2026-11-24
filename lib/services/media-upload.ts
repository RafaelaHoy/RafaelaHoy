import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export function sanitizeMediaFileName(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const safeBase = baseName || 'archivo'
  const safeExtension = extension ? `.${extension}` : ''
  return `${Date.now()}-${safeBase}${safeExtension}`.slice(0, 120)
}

export async function uploadBufferToR2(
  buffer: Buffer,
  fileName: string,
  contentType = 'image/jpeg',
): Promise<{ url: string; key: string }> {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '')
  const bucketName = process.env.R2_BUCKET_NAME

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error('Faltan variables de entorno de Cloudflare R2.')
  }

  const key = sanitizeMediaFileName(fileName)
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  })

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )

  const publicUrl = `https://media.rafaelahoy.com/${key}`
  return { url: publicUrl, key }
}
