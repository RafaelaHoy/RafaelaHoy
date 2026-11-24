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
    let response = await fetch(url, {
      headers: browserHeaders,
      redirect: 'follow',
      signal: controller.signal,
    })

    // Cloudflare o protección bot bloqueando headers estándar de navegador
    if (response.status === 403 || response.status === 429) {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'curl/8.4.0',
          Accept: '*/*',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
    }

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

const blacklistKeywords = [
  'clima',
  'contacto',
  'ingresar',
  'login',
  'leer más',
  'ver más',
  'whatsapp',
  'facebook',
  'twitter',
  'instagram',
  'youtube',
  'edición impresa',
  'cotizaciones',
  'suscribite',
  'términos',
  'privacidad',
  'buscar',
]

const buildItems = ($: cheerio.CheerioAPI, baseUrl: string, elements: cheerio.Cheerio<any>) => {
  const uniqueLinks = new Set<string>()
  const items: ScrapedFeedItem[] = []

  elements.each((_, el) => {
    const anchor = $(el).is('a') ? $(el) : $(el).find('a').first()
    const href = normalizeLink(anchor.attr('href'), baseUrl)
    
    // Remover elementos visuales o de tracking antes de extraer texto
    anchor.find('svg, style, script, img').remove()
    const text = anchor.text().replace(/\s+/g, ' ').trim() || $(el).text().replace(/\s+/g, ' ').trim()

    if (!href || !text || text.length < 25) {
      return
    }

    // Filtrar enlaces a la propia home, anclas o vacíos
    if (href === baseUrl || href === `${baseUrl}/` || href.includes('#') || href.startsWith('javascript:')) {
      return
    }

    const lowerText = text.toLowerCase()
    if (blacklistKeywords.some((word) => lowerText.includes(word))) {
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
      const article = $(el).closest('article, .noticia, .item')
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
        // fallback to now
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
      'Diario La Opinión': 'https://diariolaopinion.com.ar/',
      'Rafaela Informa': 'https://rafaelainforma.com/',
      'Radio Rafaela': 'https://radiorafaela.com.ar/',
      'ADN 97.9': 'https://adn979.com/',
    }

    const urlObj = new URL(feedUrl)
    targetUrl = homeUrls[medio] || urlObj.origin

    const html = await fetchHtml(targetUrl)
    const $ = cheerio.load(html)

    let candidates: cheerio.Cheerio<any>

    if (medio === 'Rafaela Noticias') {
      candidates = $('article a, .noticia a, .titulo a, .titulo-principal a, h2 a, h3 a, a:has(h2), a:has(h3)')
    } else if (medio === 'Diario La Opinión') {
      candidates = $('article a, .entry-title a, .post-title a, .titulo a, .titulo-principal a, h2 a, h3 a, .td-module-thumb a, a:has(h2), a:has(h3)')
    } else if (medio === 'Rafaela Informa') {
      candidates = $('article a, .noticia a, .titulo-bloque a, h2 a, h3 a, a:has(h3), a[href*="/contenido/"]')
    } else if (medio === 'ADN 97.9') {
      candidates = $('article a, .post__titulo a, h2 a, h3 a, a:has(h2), a[href*="/contenido/"]')
    } else if (medio === 'Radio Rafaela') {
      candidates = $('article a, h2 a, h3 a, a:has(h2), a:has(h3)')
    } else {
      candidates = $('article a, h2 a, h3 a, .entry-title a, .post-title a, .noticia a, .td-module-thumb a')
    }

    const items = buildItems($, targetUrl, candidates)

    if (items.length > 0) {
      return items
    }

    // Fallback general si los selectores específicos no capturaron nada
    const fallback = buildItems($, targetUrl, $('a').filter((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      return text.length >= 30
    }))

    return fallback
  } catch (error) {
    throw new Error(`Fallo en scraper HTML para ${targetUrl} - ${(error as Error).message}`)
  }
}
