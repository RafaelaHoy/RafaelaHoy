"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RSS_FEEDS } from '@/rssFeeds'
import { ExternalLink, RefreshCw, Trash2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export type RadarFeedItem = {
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

const categoryStyles: Record<string, string> = {
  Locales: 'bg-blue-100 text-blue-700',
  Regionales: 'bg-orange-100 text-orange-700',
  Provinciales: 'bg-amber-100 text-amber-700',
  Nacionales: 'bg-violet-100 text-violet-700',
  Internacionales: 'bg-cyan-100 text-cyan-700',
}

export function RadarDashboard() {
  const router = useRouter()
  const [items, setItems] = useState<RadarFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadFeeds = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const requests = RSS_FEEDS.map((source) =>
        fetch(`/api/radar?url=${encodeURIComponent(source.feedUrl)}${forceRefresh ? '&refresh=1' : ''}`).then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}))
            throw new Error(payload?.error || response.statusText)
          }
          return response.json() as Promise<{ source: string; items: RadarFeedItem[] }>
        }),
      )

      const results = await Promise.allSettled(requests)
      const allItems: RadarFeedItem[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const feedResult = result.value
          allItems.push(...feedResult.items)
        } else {
          console.warn(`Error cargando fuente ${RSS_FEEDS[index].name}:`, result.reason)
        }
      })

      const uniqueItems = allItems.reduce<RadarFeedItem[]>((acc, item) => {
        if (!acc.some((existing) => existing.link === item.link)) {
          acc.push(item)
        }
        return acc
      }, [])

      const orderedItems = uniqueItems.sort((a, b) => {
        const aTime = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const bTime = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return bTime - aTime
      })

      setItems(orderedItems)
    } catch (err) {
      console.error('Error cargando radar:', err)
      setError('No se pudieron cargar las noticias del radar. Volvé a intentarlo en unos instantes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeeds(false)
  }, [refreshKey])

  const visibleItems = useMemo(() => {
    return items.filter((item) => !hiddenIds.includes(item.link))
  }, [items, hiddenIds])

  const handleGenerateDraft = async (item: RadarFeedItem) => {
    setGeneratingDraftId(item.link)

    try {
      const response = await fetch('/api/radar/generar-borrador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: item.title,
          url_original: item.link,
          medio: item.sourceName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error generando borrador:', data)
        toast.error(data?.error || 'No se pudo generar el borrador')
        return
      }

      localStorage.setItem('borradorRadar', JSON.stringify(data))
      toast.success('Borrador generado. Redirigiendo al editor...')
      router.push('/admin/noticias/crear')
    } catch (err) {
      console.error('Error generando borrador:', err)
      toast.error('Ocurrió un error al generar el borrador')
    } finally {
      setGeneratingDraftId(null)
    }
  }

  const handleDiscardItem = (link: string) => {
    setHiddenIds((prev) => [...prev, link])
    toast.success('Noticia descartada de la vista')
  }

  const handleSiteStatus = () => {
    console.log('Estado de sitios web:', RSS_FEEDS)
    toast.info('Estado de sitios web: en desarrollo')
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Radar de Noticias</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Consultá las últimas noticias de nuestros medios autorizados y revisá los contenidos más recientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setRefreshKey((prev) => prev + 1)
                loadFeeds(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleSiteStatus}
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Estado de sitios web
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-2/5 rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-5/6 rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-4/6 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleItems.map((item) => (
            <article key={item.link} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.sourceName}</p>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[item.category] || 'bg-slate-100 text-slate-700'}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-tight text-slate-900 break-words">{item.title}</h3>
                </div>

                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <p className="text-sm text-slate-500">
                    {item.pubDate ? new Date(item.pubDate).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Fecha desconocida'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Scrape: {new Date(item.scrapedAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 break-words">{item.contentSnippet || 'Sin resumen disponible.'}</p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-200"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Leer original
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateDraft(item)}
                    disabled={generatingDraftId === item.link}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold text-white transition ${generatingDraftId === item.link ? 'cursor-not-allowed bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {generatingDraftId === item.link ? 'Generando...' : 'Generar borrador'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDiscardItem(item.link)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-700"
                    aria-label="Descartar noticia"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
