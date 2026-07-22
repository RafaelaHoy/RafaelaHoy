import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@/lib/supabase/server'

const FUENTES_RSS = [
  {
    nombre: 'Infobae',
    url: 'https://www.infobae.com/arc/outboundfeeds/rss/',
    categoria: 'Nacionales',
  },
  {
    nombre: 'La Capital',
    url: 'https://www.lacapital.com.ar/rss/general.xml',
    categoria: 'Provinciales',
  },
  {
    nombre: 'Rafaela Noticias',
    url: 'https://www.rafaelanoticias.com/feed',
    categoria: 'Locales',
  },
]

type FuenteRss = (typeof FUENTES_RSS)[number]

type RadarNoticiaInsert = {
  titulo: string
  url_original: string
  medio: string
  categoria: string
  fecha_publicacion: string | null
}

export async function GET() {
  const parser = new Parser()
  const supabase = await createClient()
  let nuevasNoticiasCount = 0
  let procesadasCount = 0

  for (const fuente of FUENTES_RSS) {
    try {
      const feed = await parser.parseURL(fuente.url)
      const items = feed.items || []

      for (const item of items) {
        const titulo = item.title?.trim() || 'Sin título'
        const url_original = item.link?.trim() || item.guid?.trim() || ''
        if (!url_original) continue

        const fecha_publicacion = item.isoDate || item.pubDate || null

        const nuevoRegistro: RadarNoticiaInsert = {
          titulo,
          url_original,
          medio: fuente.nombre,
          categoria: fuente.categoria,
          fecha_publicacion,
        }

        const { error } = await supabase
          .from('radar_noticias')
          .insert([nuevoRegistro])
          .onConflict('url_original')
          .ignore()

        procesadasCount += 1
        if (!error) {
          nuevasNoticiasCount += 1
        }
      }
    } catch (error) {
      console.error(`Error procesando feed ${fuente.nombre}:`, error)
    }
  }

  return NextResponse.json({
    status: 'ok',
    procesadas: procesadasCount,
    nuevas: nuevasNoticiasCount,
  })
}
