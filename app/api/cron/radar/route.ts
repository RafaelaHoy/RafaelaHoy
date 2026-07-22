import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@/lib/supabase/server'

const FUENTES_RSS = [
  {
    nombre: 'Rafaela Noticias',
    url: 'https://www.rafaelanoticias.com/feed/',
    categoria: 'Locales',
  },
  {
    nombre: 'Clarín',
    url: 'https://www.clarin.com/rss/lo-ultimo/',
    categoria: 'Nacionales',
  },
  {
    nombre: 'Perfil',
    url: 'https://www.perfil.com/feed',
    categoria: 'Nacionales',
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
  const parser = new Parser({
    customFields: {},
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
  })
  const supabase = await createClient()
  let nuevasNoticiasCount = 0
  let procesadasCount = 0
  const erroresLog: Array<{ medio: string; error: string }> = []

  for (const fuente of FUENTES_RSS) {
    try {
      const feed = await parser.parseURL(fuente.url)
      const items = feed.items || []

      for (const item of items) {
        const titulo = item.title?.trim() || 'Sin título'
        const url_original = item.link?.trim() || item.guid?.trim() || ''
        if (!url_original) continue

        procesadasCount += 1
        const fecha_publicacion = item.isoDate || item.pubDate || null

        const nuevoRegistro: RadarNoticiaInsert = {
          titulo,
          url_original,
          medio: fuente.nombre,
          categoria: fuente.categoria,
          fecha_publicacion,
        }

        const { data, error } = await supabase
          .from('radar_noticias')
          .insert([nuevoRegistro])
          .onConflict('url_original')
          .ignore()

        if (error) {
          erroresLog.push({ medio: fuente.nombre, error: error.message })
        } else if (data && data.length > 0) {
          nuevasNoticiasCount += 1
        }
      }
    } catch (error) {
      erroresLog.push({
        medio: fuente.nombre,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return NextResponse.json({
    status: 'ok',
    procesadas: procesadasCount,
    nuevas: nuevasNoticiasCount,
    errores: erroresLog,
  })
}
