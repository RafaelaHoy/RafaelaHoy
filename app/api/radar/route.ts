import { NextResponse } from 'next/server'
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
      headers: parserHeaders,
      signal: controller.signal,
      redirect: 'follow',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(req: Request) {
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
      .from('rss_cache')
      .select('id, source_id, data, fetched_at')
      .eq('source_id', source.id)
      .gte('fetched_at', oneHourAgo)
      .limit(1)
      .maybeSingle()

    if (cacheError) {
      console.error('Error leyendo cache RSS:', cacheError)
    }

    if (cached && !refreshCache) {
      return NextResponse.json({ source: source.name, items: cached.data })
    }

    let xmlText = ''
    let feedItems: ProxyItem[] = []

    try {
      const primaryResponse = await fetchWithTimeout(url)

      if (!primaryResponse.ok) {
        const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
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
      feedItems = (feed.items || []).map((item) => ({
        title: item.title || '',
        link: item.link || item.guid || '',
        pubDate: item.pubDate || item.isoDate || null,
        contentSnippet: item.contentSnippet || item.content?.slice(0, 280) || '',
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        category: source.category,
        scrapedAt,
      }))
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
        const blacklist = ['clima', 'contacto', 'ingresar', 'leer más', 'ver más', 'whatsapp']

        $('a').not('nav a, header a, footer a, .menu a, .navbar a').each((_, element) => {
          const href = $(element).attr('href')?.trim()
          const text = $(element).text().replace(/\s+/g, ' ').trim()

          if (!href || href === '#' || href === '/' || href.includes('javascript:')) {
            return
          }

          const title = text.replace(/\s+/g, ' ').trim()

          if (title.length < 25) {
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
        feedItems = fallbackItems.slice(0, 10).map((item) => ({
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

    const items = feedItems

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('rss_cache')
        .upsert(
          [
            {
              source_id: source.id,
              data: items,
              fetched_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'source_id' },
        )

      if (insertError) {
        console.error('Error guardando cache RSS:', insertError)
      }
    }

    return NextResponse.json({ source: source.name, items })
  } catch (error) {
    console.error('Error proxy RSS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener el feed' },
      { status: 500 },
    )
  }
}
