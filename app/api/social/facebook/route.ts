import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type FacebookPostRequest = {
  titulo?: string
  extracto?: string
  slug?: string
  categoria?: string
}

export async function POST(req: Request) {
  try {
    // 1. Verificar autenticación de administrador en Supabase
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Validar payload
    const body = (await req.json().catch(() => null)) as FacebookPostRequest | null
    const titulo = body?.titulo?.trim() || ''
    const extracto = body?.extracto?.trim() || ''
    const slug = body?.slug?.trim() || ''
    const categoria = body?.categoria?.trim() || ''

    if (!titulo || !slug) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos (titulo y slug)' },
        { status: 400 },
      )
    }

    // 3. Leer variables de entorno de Meta y URL del sitio
    const pageId = process.env.FACEBOOK_PAGE_ID
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

    if (!pageId || !accessToken) {
      return NextResponse.json({
        success: false,
        skipped: true,
        error:
          'Variables FACEBOOK_PAGE_ID o FACEBOOK_PAGE_ACCESS_TOKEN no configuradas. Se omitió la publicación en Facebook.',
      })
    }

    const rawSiteUrl =
      process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://rafaelahoy.com'
    const siteUrl = rawSiteUrl.replace(/\/$/, '')
    const articleUrl = `${siteUrl}/noticia/${slug}`

    // 4. Armar texto atractivo para el posteo
    const messageParts = [`🔴 ${titulo}`]
    if (extracto) {
      messageParts.push(extracto)
    }
    if (categoria) {
      const cleanTag = categoria.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '')
      if (cleanTag) {
        messageParts.push(`#${cleanTag} #RafaelaHoy`)
      }
    }
    messageParts.push('📲 Leé la nota completa acá 👇')

    const message = messageParts.join('\n\n')

    // 5. Publicar en Facebook Page Feed vía Graph API v21.0
    const graphUrl = `https://graph.facebook.com/v21.0/${pageId}/feed`
    const fbResponse = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        link: articleUrl,
        access_token: accessToken,
      }),
    })

    const fbData = await fbResponse.json().catch(() => ({}))

    if (!fbResponse.ok) {
      const metaMessage =
        fbData?.error?.message || `Error HTTP ${fbResponse.status} al publicar en Facebook`
      console.error('[Facebook API] Error publicando en feed:', fbData)

      return NextResponse.json(
        {
          success: false,
          error: metaMessage,
          details: fbData?.error || fbData,
        },
        { status: fbResponse.status >= 400 ? fbResponse.status : 502 },
      )
    }

    return NextResponse.json({
      success: true,
      postId: fbData.id,
    })
  } catch (error) {
    console.error('[Facebook API] Error inesperado:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado al publicar en Facebook',
      },
      { status: 500 },
    )
  }
}
