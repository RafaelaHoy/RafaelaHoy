import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { RSS_FEEDS } from '@/rssFeeds'

type SourceStatus = {
  id: string
  nombre: string
  url: string
  estado: 'Operativo' | 'Sin noticias' | 'Error'
  cantidad: number | null
  mensajeError: string | null
}

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

const normalizeXml = (rawXml: string) =>
  rawXml.trimStart().replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')

export async function GET() {
  const sourceStatuses = await Promise.all(
    RSS_FEEDS.map(async (source) => {
      try {
        const response = await fetchWithTimeout(source.feedUrl)

        if (!response.ok) {
          return {
            id: source.id,
            nombre: source.name,
            url: source.url,
            estado: 'Error' as const,
            cantidad: null,
            mensajeError: `HTTP ${response.status} ${response.statusText}`,
          }
        }

        const rawText = await response.text()
        const xmlText = normalizeXml(rawText)
        const feed = await parser.parseString(xmlText)
        const itemCount = Array.isArray(feed.items) ? feed.items.length : 0

        if (itemCount === 0) {
          return {
            id: source.id,
            nombre: source.name,
            url: source.url,
            estado: 'Sin noticias' as const,
            cantidad: 0,
            mensajeError: 'Feed parseado sin items',
          }
        }

        return {
          id: source.id,
          nombre: source.name,
          url: source.url,
          estado: 'Operativo' as const,
          cantidad: itemCount,
          mensajeError: null,
        }
      } catch (error) {
        return {
          id: source.id,
          nombre: source.name,
          url: source.url,
          estado: 'Error' as const,
          cantidad: null,
          mensajeError: error instanceof Error ? error.message : 'Error desconocido',
        }
      }
    }),
  )

  return NextResponse.json({
    sources: sourceStatuses,
    checkedAt: new Date().toISOString(),
  })
}
