import * as cheerio from 'cheerio'

export type ScrapedFeedItem = {
  title: string
  link: string
  pubDate: string | null
}

const fetchHtml = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.7,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

const normalizeLink = (href: string | undefined, baseUrl: string) => {
  if (!href) return ''
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return ''
  }
}

const buildItems = ($: cheerio.CheerioAPI, baseUrl: string, elements: cheerio.Cheerio<cheerio.Element>) => {
  const uniqueLinks = new Set<string>()
  const items: ScrapedFeedItem[] = []

  elements.each((_, el) => {
    const anchor = $(el).is('a') ? $(el) : $(el).find('a').first()
    const href = normalizeLink(anchor.attr('href'), baseUrl)
    const text = anchor.text().replace(/\s+/g, ' ').trim() || $(el).text().replace(/\s+/g, ' ').trim()

    if (!href || !text || text.length < 20) {
      return
    }

    if (uniqueLinks.has(href)) {
      return
    }

    uniqueLinks.add(href)
    items.push({
      title: text,
      link: href,
      pubDate: null,
    })
  })

  return items
}

export async function scrapeHtmlFeed(feedUrl: string, medio: string) {
  try {
    const homeUrls: Record<string, string> = {
      'Rafaela Noticias': 'https://www.rafaelanoticias.com/',
      'Diario La Opinión': 'https://www.diariolaopinion.com.ar/',
    }
    const targetUrl = homeUrls[medio] || feedUrl

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    let candidates: cheerio.Cheerio<cheerio.Element> = $('article a, h2 a, h3 a, .entry-title a, .post-title a, .noticia a, .td-module-thumb a')

    if (medio === 'Rafaela Noticias') {
      candidates = $('article a, h2 a, h3 a, .entry-title a, .noticia a')
    } else if (medio === 'Diario La Opinión') {
      candidates = $('article a, .entry-title a, .post-title a, h2 a, h3 a, .td-module-thumb a')
    }

    const items = buildItems($, targetUrl, candidates)

    if (items.length > 0) {
      return items.slice(0, 10)
    }

    const fallback = buildItems($, targetUrl, $('a').filter((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      return text.length >= 30
    }))

    return fallback.slice(0, 10)
  } catch (error) {
    console.warn(`Fallback HTML scraping failed for ${medio} (${targetUrl}):`, error)
    return []
  }
}
