import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createAdminClient } from '@/lib/supabase/admin'
import { RSS_FEEDS } from '@/rssFeeds'
import { scrapeHtmlFeed } from '@/lib/services/html-scraper'
import { notifyTelegramNewNews, type NoticiaNotificacion } from '@/lib/notifications/telegram'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type RadarNoticiaInsert = {
  titulo: string
  url_original: string
  medio: string
  categoria: string
  copete: string | null
  fecha_publicacion: string | null
}

export async function GET(req: Request) {
  // Validación de seguridad opcional si CRON_SECRET está configurado (acepta Bearer header o ?secret=...)
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get('authorization')
    const { searchParams } = new URL(req.url)
    const secretQuery = searchParams.get('secret')

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      secretQuery === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const parser = new Parser({
    requestOptions: {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    },
    customFields: {
      item: ['contentSnippet'],
    },
    timeout: 15000,
  })

  // Cliente administrativo que bypasses RLS
  const supabase = createAdminClient()

  // Purgar noticias del radar de más de 24 horas para mantener limpia la BD
  const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { error: purgeError } = await supabase
    .from('radar_noticias')
    .delete()
    .lt('created_at', hace24Horas)

  if (purgeError) {
    console.error('[CRON RADAR] Error purgando noticias antiguas:', purgeError)
  }

  let nuevasNoticiasCount = 0
  let procesadasCount = 0
  const erroresLog: Array<{ medio: string; error: string }> = []
  const auditoriaMedios: Record<string, number> = {}
  const nuevasNoticiasParaNotificar: NoticiaNotificacion[] = []

  const fuentesLocales = RSS_FEEDS.filter((fuente) => fuente.category === 'Locales')

  for (const fuente of fuentesLocales) {
    let items: Array<{
      title?: string
      link?: string
      pubDate?: string | null
      isoDate?: string | null
      contentSnippet?: string | null
    }> = []
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
          contentSnippet: item.contentSnippet || (item.content ? item.content.slice(0, 280) : null),
        }))
      } catch (rssError) {
        // Fallback a scraper HTML con Cheerio
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
              contentSnippet: 'Noticia extraída de la portada.',
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

      const registrosParaInsertar = items
        .map((item) => {
          const titulo = item.title?.trim() || ''
          const url_original = item.link?.trim() || ''
          if (!url_original || !titulo) return null

          return {
            titulo,
            url_original,
            medio: fuente.name,
            categoria: fuente.category as string,
            copete: item.contentSnippet || null,
            fecha_publicacion: item.isoDate || item.pubDate || null,
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      if (registrosParaInsertar.length > 0) {
        procesadasCount += registrosParaInsertar.length

        // Con ignoreDuplicates: true y .select(), PostgREST retorna ÚNICAMENTE las filas insertadas (no las repetidas)
        const { data, error } = await supabase
          .from('radar_noticias')
          .upsert(registrosParaInsertar, {
            onConflict: 'url_original',
            ignoreDuplicates: true,
          })
          .select('id, titulo, url_original, medio, categoria, copete, fecha_publicacion')

        if (error) {
          erroresLog.push({ medio: fuente.name, error: error.message })
        } else if (Array.isArray(data) && data.length > 0) {
          nuevasNoticiasCount += data.length
          nuevasNoticiasParaNotificar.push(...(data as NoticiaNotificacion[]))
        }
      }
    } catch (error) {
      erroresLog.push({
        medio: fuente.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Notificar por Telegram las noticias estrictamente nuevas detectadas
  if (nuevasNoticiasParaNotificar.length > 0) {
    try {
      await notifyTelegramNewNews(nuevasNoticiasParaNotificar)
    } catch (tgError) {
      console.error('[CRON RADAR] Error notificando a Telegram:', tgError)
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
