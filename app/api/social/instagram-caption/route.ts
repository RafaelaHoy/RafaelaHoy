import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInstagramCaption } from '@/lib/services/instagram-caption'

export const dynamic = 'force-dynamic'

type InstagramCaptionRequest = {
  title?: string
  excerpt?: string
  content?: string
  category?: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = (await req.json().catch(() => null)) as InstagramCaptionRequest | null
    const title = body?.title?.trim() || ''
    const excerpt = body?.excerpt?.trim() || ''
    const content = body?.content?.trim() || ''
    const category = body?.category?.trim() || 'Locales'

    if (!title && !excerpt) {
      return NextResponse.json(
        { error: 'Se requiere al menos el título o extracto de la noticia' },
        { status: 400 },
      )
    }

    const caption = await generateInstagramCaption({
      title,
      excerpt,
      content,
      category,
    })

    return NextResponse.json({ caption })
  } catch (error) {
    console.error('[Instagram Caption API] Error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error inesperado al generar el caption de Instagram',
      },
      { status: 500 },
    )
  }
}
