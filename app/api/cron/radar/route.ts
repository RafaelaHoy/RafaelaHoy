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
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    },
    customFields: {},
  })
  const supabase = await createClient()
  let nuevasNoticiasCount = 0
  let procesadasCount = 0
  const erroresLog: Array<{ medio: string; error: string }> = []
  const auditoriaMedios: Record<string, number> = {}

  for (const fuente of RSS_FEEDS) {
    let items: Array<{ title?: string; link?: string; pubDate?: string | null; isoDate?: string | null }> = []
    let errorMensaje: string | null = null

    try {
      try {
        const feed = await parser.parseURL(fuente.feedUrl)
        const feedItems = feed.items || []

        if (feedItems.length === 0) {
          throw new Error('RSS vacío')
        }

        items = feedItems.map((item) => ({
          title: item.title,
          link: item.link || item.guid,
          pubDate: item.isoDate || item.pubDate || null,
          isoDate: item.isoDate || item.pubDate || null,
        }))
      } catch (rssError) {
        try {
          const scrapedItems = await scrapeHtmlFeed(fuente.feedUrl, fuente.name)
          if (!scrapedItems || scrapedItems.length === 0) {
            errorMensaje = `Scraper HTML no devolvió resultados (${rssError instanceof Error ? rssError.message : String(rssError)})`
          } else {
            items = scrapedItems.map((scraped) => ({
              title: scraped.title,
              link: scraped.link,
              pubDate: scraped.pubDate,
              isoDate: scraped.pubDate,
            }))
          }
        } catch (htmlError) {
          errorMensaje = `${rssError instanceof Error ? rssError.message : String(rssError)} | Fallback error: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`
        }
      }

      if (errorMensaje) {
        throw new Error(errorMensaje)
      }

      auditoriaMedios[fuente.name] = items.length

      for (const item of items) {
        const titulo = item.title?.trim() || 'Sin título'
        const url_original = item.link?.trim() || ''
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
