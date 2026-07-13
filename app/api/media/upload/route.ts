import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function sanitizeFileName(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '')
    const bucketName = process.env.R2_BUCKET_NAME

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
      return NextResponse.json(
        { error: 'Faltan variables de entorno de Cloudflare R2.' },
        { status: 500 }
      )
    }

    const key = sanitizeFileName(file.name)
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
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || 'application/octet-stream',
        ACL: 'public-read',
      })
    )

    const publicUrl = `https://media.rafaelahoy.com/${key}`

    return NextResponse.json({ url: publicUrl, key })
  } catch (error) {
    console.error('Error al subir a Cloudflare R2:', error)
    return NextResponse.json(
      { error: 'No se pudo subir la imagen a Cloudflare R2.' },
      { status: 500 }
    )
  }
}
