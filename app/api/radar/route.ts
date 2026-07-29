import { NextResponse, NextRequest } from 'next/server'
import Parser from 'rss-parser'
import * as cheerio from 'cheerio'
import { createClient } from '@/lib/supabase/server'
import { RSS_FEEDS } from '@/rssFeeds'

const parserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
}

const parser = new Parser({
  customFields: {
    item: ['contentSnippet'],
  },
  timeout: 8000,
  headers: parserHeaders,
})

type ProxyItem = {
  title: string
  link: string
  pubDate: string | null
  contentSnippet: string
  sourceId: string
  sourceName: string
  sourceUrl: string
  category: string
  scrapedAt: string
}

type CachedFeed = {
  id: string
  source_id: string
  data: ProxyItem[]
  fetched_at: string
}

const fetchWithTimeout = async (requestUrl: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    return await fetch(requestUrl, {
      headers: {
        ...parserHeaders,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      signal: controller.signal,
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

const normalizeFeedDate = (dateString: string | null | undefined): string | null => {
  if (!dateString) {
    return null
  }

  const parsed = new Date(dateString.trim())
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const refreshCache = req.nextUrl.searchParams.get('refresh') === '1'

  if (!url) {
    return NextResponse.json({ error: 'Parámetro url requerido' }, { status: 400 })
  }

  const source = RSS_FEEDS.find((feed) => feed.feedUrl === url)

  if (!source) {
    return NextResponse.json({ error: 'Fuente no autorizada' }, { status: 403 })
  }

  try {
    const supabase = await createClient()

    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    const { data: cached, error: cacheError } = await supabase
      .from('radar_noticias')
      .select('*')
      .eq('medio', source.name)
      .eq('descartado', false)
      .gte('created_at', oneHourAgo)
      .order('fecha_publicacion', { ascending: false })
      .order('created_at', { ascending: false })

    if (cacheError) {
      console.error('Error leyendo cache radar_noticias:', cacheError)
    }

    const normalizeRadarRow = (row: any) => ({
      id: row.id,
      title: row.titulo || 'Sin título',
      link: row.url_original || '',
      pubDate: row.fecha_publicacion || null,
      isoDate: row.fecha_publicacion || null,
      contentSnippet: row.copete || '',
      sourceId: source.id,
      sourceName: row.medio || source.name,
      sourceUrl: source.url,
      category: row.categoria || source.category || 'Locales',
      scrapedAt: row.created_at || new Date().toISOString(),
      titulo: row.titulo,
      url_original: row.url_original,
      medio: row.medio,
      copete: row.copete,
      fecha_publicacion: row.fecha_publicacion,
    })

    if (cached && cached.length > 0 && !refreshCache) {
      const mappedCached = cached.map(normalizeRadarRow)
      return NextResponse.json({ source: source.name, items: mappedCached })
    }

    let xmlText = ''
    let feedItems: ProxyItem[] = []

    try {
      const apiKey = process.env.SCRAPER_API_KEY
      const cacheBustedUrl = url.includes('?') ? `${url}&nocache=${Date.now()}` : `${url}?nocache=${Date.now()}`
      const targetUrl = encodeURIComponent(cacheBustedUrl)
      const fetchUrl = apiKey ? `https://api.scraperapi.com/?api_key=${apiKey}&url=${targetUrl}` : cacheBustedUrl
      const primaryResponse = await fetchWithTimeout(fetchUrl)

      if (!primaryResponse.ok) {
        const fallbackUrl = `https://api.allorigins.win/raw?url=${targetUrl}`
        const fallbackResponse = await fetchWithTimeout(fallbackUrl)

        if (!fallbackResponse.ok) {
          throw new Error(
            `Primary fetch failed with ${primaryResponse.status} ${primaryResponse.statusText}; fallback failed with ${fallbackResponse.status} ${fallbackResponse.statusText}`,
          )
        }

        xmlText = await fallbackResponse.text()
      } else {
        xmlText = await primaryResponse.text()
      }

      const cleanXml = xmlText
        .trimStart()
        .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')

      const feed = await parser.parseString(cleanXml)
      const scrapedAt = new Date().toISOString()

      const firstItemDate = feed.items?.[0]?.pubDate || feed.items?.[0]?.isoDate || null
      console.log(
        `[radar] ${source.name} fetch ${refreshCache ? 'refresh' : 'cached'} - first raw item date:`,
        firstItemDate,
        'normalized:',
        normalizeFeedDate(firstItemDate),
      )

      feedItems = (feed.items || [])
        .map((item) => ({
          title: item.title || '',
          link: item.link || item.guid || '',
          pubDate: normalizeFeedDate(item.pubDate || item.isoDate),
          contentSnippet: item.contentSnippet || item.content?.slice(0, 280) || '',
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          category: source.category,
          scrapedAt,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.pubDate || 0).getTime()
          const dateB = new Date(b.pubDate || 0).getTime()
          return dateB - dateA
        })
    } catch (parserError) {
      console.warn(`RSS parser failed for ${source.name}, using fallback scraping:`, parserError)

      try {
        const homeResponse = await fetchWithTimeout(source.url)

        if (!homeResponse.ok) {
          throw new Error(`Fallback scraping failed with ${homeResponse.status} ${homeResponse.statusText}`)
        }

        const html = await homeResponse.text()
        const $ = cheerio.load(html)
        const uniqueLinks = new Set<string>()
        const fallbackItems: { title: string; link: string; pubDate: string; contentSnippet: string }[] = []
        const blacklist = [
          'clima',
          'contacto',
          'ingresar',
          'leer más',
          'ver más',
          'whatsapp',
          'getty images',
          'afp',
          'reuters',
          'bloomberg',
          'crédito',
          'foto:',
          'fotografía:',
          'ver todas',
          'últimas noticias',
          'youtube',
          'foto /',
          '/ ap',
          'imágenes',
        ]

        $('main a, article a, h2 a, h3 a, .entry-title a, .noticia a')
          .not('nav a, header a, footer a, .menu a, .navbar a')
          .each((_, element) => {
            const href = $(element).attr('href')?.trim()
            $(element).find('svg, style, script').remove()
            const text = $(element).text().replace(/\s+/g, ' ').trim()

            if (!href || href === '#' || href === '/' || href.includes('javascript:')) {
              return
            }

            const title = text.replace(/\s+/g, ' ').trim()

            if (title.length < 30) {
              return
            }

            if (title.includes('{') || title.includes('}')) {
              return
            }

            if (blacklist.some((word) => title.toLowerCase().includes(word))) {
              return
            }

            const absoluteLink = href.startsWith('http') ? href : new URL(href, source.url).toString()

            if (!absoluteLink || absoluteLink === source.url || absoluteLink.includes('#') || uniqueLinks.has(absoluteLink)) {
              return
            }

            uniqueLinks.add(absoluteLink)

            fallbackItems.push({
              title,
              link: absoluteLink,
              pubDate: new Date().toISOString(),
              contentSnippet: 'Noticia extraída de la portada.',
            })

            if (fallbackItems.length >= 10) {
              return false
            }
          })

        const scrapedAt = new Date().toISOString()
        feedItems = fallbackItems
          .slice(0, 10)
          .map((item) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            contentSnippet: item.contentSnippet,
            sourceId: source.id,
            sourceName: source.name,
            sourceUrl: source.url,
            category: source.category,
            scrapedAt,
          }))
      } catch (fallbackError) {
        console.error('Error en fallback de scraping de portada:', fallbackError)
        throw fallbackError
      }
    }

    const sortedItems = feedItems.slice().sort((a, b) => {
      const dateA = new Date(a.pubDate || 0).getTime()
      const dateB = new Date(b.pubDate || 0).getTime()
      return dateB - dateA
    })

    // Reducir ventana de retención a 24 horas
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { error: purgeError } = await supabase
      .from('radar_noticias')
      .delete()
      .lt('created_at', hace24Horas)

    if (purgeError) {
      console.error('Error purgando radar_noticias antiguas:', purgeError)
    }

    const radarRows = sortedItems.map((item) => ({
      titulo: item.title,
      url_original: item.link,
      medio: item.sourceName,
      categoria: item.category,
      copete: item.contentSnippet,
      fecha_publicacion: item.pubDate,
    }))

    if (radarRows.length > 0) {
      const { error: upsertError } = await supabase
        .from('radar_noticias')
        .upsert(radarRows, { onConflict: 'url_original', ignoreDuplicates: true })

      if (upsertError) {
        console.error('Error guardando radar_noticias:', upsertError)
      }
    }

    const { data: savedItems, error: selectError } = await supabase
      .from('radar_noticias')
      .select('*')
      .eq('medio', source.name)
      .eq('descartado', false)
      .order('fecha_publicacion', { ascending: false })
      .order('created_at', { ascending: false })

    if (selectError) {
      console.error('Error consultando radar_noticias:', selectError)
      throw selectError
    }

    const mappedItems = (savedItems ?? []).map((item: any) => ({
      id: item.id,
      title: item.titulo || 'Sin título',
      link: item.url_original || '',
      pubDate: item.fecha_publicacion || null,
      isoDate: item.fecha_publicacion || null,
      contentSnippet: item.copete || '',
      sourceId: source.id,
      sourceName: item.medio || source.name,
      sourceUrl: source.url,
      category: item.categoria || source.category || 'Locales',
      scrapedAt: item.created_at || new Date().toISOString(),
      titulo: item.titulo,
      url_original: item.url_original,
      medio: item.medio,
      copete: item.copete,
      fecha_publicacion: item.fecha_publicacion,
    }))

    return NextResponse.json({ source: source.name, items: mappedItems })
  } catch (error) {
    console.error('Error proxy RSS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener el feed' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const id = body?.id || req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de noticia requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('radar_noticias')
      .update({ descartado: true })
      .eq('id', id)
      .select('id')

    if (error) {
      console.error('Error actualizando noticia descartada:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error en PATCH radar:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al descartar la noticia' },
      { status: 500 },
    )
  }
}
