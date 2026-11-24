import { NextResponse } from 'next/server'
import { generarBorradorConIA } from '@/lib/services/borrador-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type GenerarBorradorRequest = {
  news?: {
    title?: string
    contentSnippet?: string
    link?: string
  }
  titulo?: string
  url_original?: string
  medio?: string
  copete?: string
  contentSnippet?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerarBorradorRequest
    const news = body.news || {
      title: body.titulo,
      contentSnippet: body.contentSnippet || body.copete,
      link: body.url_original,
    }

    const noticiaTitulo = news?.title || body.titulo || ''
    const noticiaLink = news?.link || body.url_original || ''
    const noticiaSnippet = news?.contentSnippet || body.copete || ''

    if (!noticiaTitulo.trim()) {
      return NextResponse.json({ error: 'No se recibió el título de la noticia' }, { status: 400 })
    }

    const result = await generarBorradorConIA({
      titulo: noticiaTitulo,
      link: noticiaLink,
      copete: noticiaSnippet,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error global en generar borrador:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado al generar el borrador' },
      { status: 500 },
    )
  }
}
