import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { createClient } from '@/lib/supabase/server'
import { RSS_FEEDS } from '@/rssFeeds'

const parser = new Parser({
  customFields: {
    item: ['contentSnippet'],
  },
  timeout: 8000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
  },
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

    const feed = await Promise.race([
      parser.parseURL(url),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout al obtener el feed RSS')), 8000)
      }),
    ])
    const scrapedAt = new Date().toISOString()
    const items = (feed.items || []).map((item) => ({
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
