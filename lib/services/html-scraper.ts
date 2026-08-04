import * as cheerio from 'cheerio'

export type ScrapedFeedItem = {
  title: string
  link: string
  pubDate: string
}

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.7,en;q=0.5',
  'Upgrade-Insecure-Requests': '1',
}

const fetchHtml = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      headers: browserHeaders,
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

const buildItems = ($: cheerio.CheerioAPI, baseUrl: string, elements: cheerio.Cheerio<any>) => {
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

    // Intentar extraer fecha desde <time> (atributo datetime) o desde clases comunes
    const findDateText = () => {
      const timeEl = anchor.find('time').first()
      if (timeEl && timeEl.attr('datetime')) return timeEl.attr('datetime')
      if (timeEl && timeEl.text()) return timeEl.text()

      const dateSelectors = ['.fecha', '.date', '.time', '.post-date', '.published', '.meta-date']
      for (const sel of dateSelectors) {
        const node = $(el).find(sel).first()
        if (node && node.text()) return node.text().trim()
      }

      // Buscar en el artículo contenedor
      const article = $(el).closest('article')
      if (article.length) {
        const t = article.find('time').first()
        if (t && t.attr('datetime')) return t.attr('datetime')
        for (const sel of dateSelectors) {
          const node = article.find(sel).first()
          if (node && node.text()) return node.text().trim()
        }
      }

      return null
    }

    let pubDateStr = findDateText()
    let pubDate = new Date().toISOString()
    if (pubDateStr) {
      try {
        const parsed = new Date(pubDateStr.trim())
        if (!isNaN(parsed.getTime())) {
          pubDate = parsed.toISOString()
        }
      } catch {
        // ignore and fallback
      }
    }

    items.push({
      title: text,
      link: href,
      pubDate,
    })
  })

  return items
}

export async function scrapeHtmlFeed(feedUrl: string, medio: string) {
  let targetUrl = feedUrl

  try {
    const homeUrls: Record<string, string> = {
      'Rafaela Noticias': 'https://www.rafaelanoticias.com/',
      'Diario La Opinión': 'https://www.diariolaopinion.com.ar/',
    }

    const urlObj = new URL(feedUrl)
    targetUrl = homeUrls[medio] || urlObj.origin

    const html = await fetchHtml(targetUrl)
    const $ = cheerio.load(html)

    let candidates: cheerio.Cheerio<any> = $('article a, h2 a, h3 a, .entry-title a, .post-title a, .noticia a, .td-module-thumb a')

    if (medio === 'Rafaela Noticias') {
      candidates = $('article a, h2 a, h3 a, .entry-title a, .noticia a')
    } else if (medio === 'Diario La Opinión') {
      candidates = $('article a, .entry-title a, .post-title a, h2 a, h3 a, .td-module-thumb a')
    }

    const items = buildItems($, targetUrl, candidates)

    if (items.length > 0) {
      return items
    }

    const fallback = buildItems($, targetUrl, $('a').filter((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      return text.length >= 30
    }))

    return fallback
  } catch (error) {
    throw new Error(`Fallo en scraper HTML para ${targetUrl} - ${(error as Error).message}`)
  }
}
