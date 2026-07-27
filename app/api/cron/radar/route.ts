import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@/lib/supabase/server'
import { RSS_FEEDS } from '@/rssFeeds'
import { scrapeHtmlFeed } from '@/lib/services/html-scraper'

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
  const auditoriaMedios: Record<string, number> = {}

  for (const fuente of RSS_FEEDS) {
    try {
      let feed = await parser.parseURL(fuente.feedUrl)
      let items = feed.items || []

      if (items.length === 0) {
        const scrapedItems = await scrapeHtmlFeed(fuente.url, fuente.name)
        items = scrapedItems.map((scraped) => ({
          title: scraped.title,
          link: scraped.link,
          pubDate: scraped.pubDate,
        }))
      }

      auditoriaMedios[fuente.name] = items.length

      for (const item of items) {
        const titulo = item.title?.trim() || 'Sin título'
        const url_original = item.link?.trim() || item.guid?.trim() || ''
        if (!url_original) continue

        procesadasCount += 1
        const fecha_publicacion = item.isoDate || item.pubDate || null

        const nuevoRegistro: RadarNoticiaInsert = {
          titulo,
          url_original,
          medio: fuente.name,
          categoria: fuente.category,
          fecha_publicacion,
        }

        const { data, error } = (await supabase
          .from('radar_noticias')
          .upsert([nuevoRegistro], {
            onConflict: 'url_original',
            ignoreDuplicates: true,
          })) as { data: RadarNoticiaInsert[] | null; error: { message: string } | null }

        if (error) {
          erroresLog.push({ medio: fuente.name, error: error.message })
        } else if (Array.isArray(data) && data.length > 0) {
          nuevasNoticiasCount += 1
        }
      }
    } catch (error) {
      erroresLog.push({
        medio: fuente.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return NextResponse.json({
    status: 'ok',
    procesadas: procesadasCount,
    nuevas: nuevasNoticiasCount,
    errores: erroresLog,
    auditoria: auditoriaMedios,
  })
}
