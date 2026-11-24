import { NextResponse } from 'next/server'
import { uploadBufferToR2 } from '@/lib/services/media-upload'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, key } = await uploadBufferToR2(
      buffer,
      file.name,
      file.type || 'application/octet-stream',
    )

    return NextResponse.json({ url, key })
  } catch (error) {
    console.error('Error al subir a Cloudflare R2:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo subir la imagen a Cloudflare R2.',
      },
      { status: 500 },
    )
  }
}
