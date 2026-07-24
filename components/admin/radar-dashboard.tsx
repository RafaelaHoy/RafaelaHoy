"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RSS_FEEDS } from '@/rssFeeds'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

type FeedSourceStatus = {
  status: 'ok' | 'error'
  errorMessage?: string
}

const categoryStyles: Record<string, { badge: string; border: string }> = {
  locales: { badge: 'bg-blue-100 text-blue-700', border: 'border-blue-500' },
  regionales: { badge: 'bg-green-100 text-green-700', border: 'border-green-500' },
  provinciales: { badge: 'bg-orange-100 text-orange-700', border: 'border-orange-500' },
  nacionales: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-500' },
  internacionales: { badge: 'bg-teal-100 text-teal-700', border: 'border-teal-500' },
}

const radarCategoryOptions = [
  'Todas',
  'Locales',
  'Regionales',
  'Provinciales',
  'Nacionales',
  'Internacionales',
]

const getCategoryBadgeClass = (category: string) => {
  return categoryStyles[category.toLowerCase()]?.badge || 'bg-slate-100 text-slate-700'
}

const getCategoryBorderClass = (category: string) => {
  return categoryStyles[category.toLowerCase()]?.border || 'border-slate-400'
}

type RadarCardProps = {
  item: RadarFeedItem
  generatingDraftId: string | null
  onGenerateDraft: (item: RadarFeedItem) => void
  onDiscard: (link: string) => void
}

function RadarCard({ item, generatingDraftId, onGenerateDraft, onDiscard }: RadarCardProps) {
  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 border-l-4 ${getCategoryBorderClass(item.category)}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClass(item.category)}`}>
              {item.category}
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.sourceName}</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-tight text-slate-900 break-words">{item.title}</h3>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-sm text-slate-500">{formatRadarDate(item.pubDate)}</p>
          <p className="text-xs text-slate-400">Scrape: {formatRadarDate(item.scrapedAt)}</p>
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
            onClick={() => onGenerateDraft(item)}
            disabled={generatingDraftId === item.link}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold text-white transition ${generatingDraftId === item.link ? 'cursor-not-allowed bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            <Sparkles className="h-4 w-4" />
            {generatingDraftId === item.link ? 'Generando...' : 'Generar borrador'}
          </button>

          <button
            type="button"
            onClick={() => onDiscard(item.link)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-700"
            aria-label="Descartar noticia"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

const formatRadarDate = (value: string | null) => {
  if (!value) return 'Fecha desconocida'

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function RadarDashboard() {
  const router = useRouter()
  const [items, setItems] = useState<RadarFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, FeedSourceStatus>>({})

  const loadFeeds = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const requests = RSS_FEEDS.map((source) =>
        fetch(`/api/radar?url=${encodeURIComponent(source.feedUrl)}${forceRefresh ? '&refresh=1' : ''}`).then(async (response) => {
          const data = await response.json().catch(() => ({})) as {
            source?: string
            items?: RadarFeedItem[]
            error?: string
            details?: string
          }

          if (!response.ok || !Array.isArray(data.items)) {
            const errorMessage = data.error || data.details || response.statusText || 'Error desconocido'
            throw new Error(errorMessage)
          }

          return {
            source: data.source || source.name,
            items: data.items,
          } as { source: string; items: RadarFeedItem[] }
        }),
      )

      const results = await Promise.allSettled(requests)
      const allItems: RadarFeedItem[] = []
      const nextSourceStatuses: Record<string, FeedSourceStatus> = {}

      results.forEach((result, index) => {
        const source = RSS_FEEDS[index]
        if (result.status === 'fulfilled') {
          const feedResult = result.value
          allItems.push(...feedResult.items)
          nextSourceStatuses[source.id] = { status: 'ok' }
        } else {
          const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason)
          console.warn(`Error cargando fuente ${source.name}:`, errorMessage)
          nextSourceStatuses[source.id] = {
            status: 'error',
            errorMessage,
          }
        }
      })

      setSourceStatuses(nextSourceStatuses)

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

  const urgentKeywords = ['urgente', 'último momento', 'ultimo momento', 'ahora', 'en vivo', 'alerta', 'impactante', 'exclusivo', 'único medio en el lugar', 'unico medio en el lugar', 'en desarrollo']
  const urgentRegex = new RegExp(`(^|\\s|\\W)(${urgentKeywords.join('|')})(\\s|\\W|$)`, 'i')

  const urgentNews = useMemo(() => {
    return items.filter((news) => urgentRegex.test(news.title))
  }, [items, urgentRegex])

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = activeCategory === 'Todas' || item.category === activeCategory
      const isVisible = !hiddenIds.includes(item.link)
      return matchCategory && isVisible
    })
  }, [items, hiddenIds, activeCategory])

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

      const text = await response.text()

      if (!response.ok) {
        let payload: { error?: string } | null = null

        if (text) {
          try {
            payload = JSON.parse(text) as { error?: string }
          } catch {
            payload = null
          }
        }

        toast.error(payload?.error || text || 'No se pudo generar el borrador')
        return
      }

      if (!text) {
        toast.error('La respuesta del servidor llegó vacía')
        return
      }

      let data: { tituloNuevo?: string; contenido?: string }

      try {
        data = JSON.parse(text) as { tituloNuevo?: string; contenido?: string }
      } catch {
        toast.error('La respuesta del servidor no es JSON válido')
        return
      }

      if (!data.tituloNuevo || !data.contenido) {
        toast.error('La respuesta del servidor no contiene un borrador válido')
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

            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Estado de sitios web
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-0">
                <DialogHeader className="border-b border-slate-200 px-6 py-5">
                  <DialogTitle className="text-2xl font-semibold text-slate-900">Estado de sitios web</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    Panel de monitoreo del último scrape de cada fuente RSS autorizada.
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-slate-700">Medio y Categoría</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Feed URL</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Estado</th>
                            <th className="px-4 py-3 font-semibold text-slate-700">Detalle del Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {RSS_FEEDS.map((source) => {
                            const status = sourceStatuses[source.id] || { status: 'error', errorMessage: 'Sin datos de monitoreo' }
                            const isOk = status.status === 'ok'

                            return (
                              <tr key={source.id} className="align-top">
                                <td className="px-4 py-4">
                                  <div className="space-y-2">
                                    <p className="font-semibold text-slate-900">{source.name}</p>
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getCategoryBadgeClass(source.category)}`}>
                                      {source.category}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-slate-600">
                                  <span className="break-all text-xs md:text-sm">{source.feedUrl}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOk ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className={`text-xs font-semibold ${isOk ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {isOk ? 'OK' : 'Error'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className={`break-all rounded-xl border px-3 py-2 text-xs font-mono ${isOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                    {isOk ? 'Operativo' : status.errorMessage || 'Error sin detalle'}
                                  </p>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {radarCategoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
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
        <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
            {visibleItems.map((item) => (
              <RadarCard
                key={item.link}
                item={item}
                generatingDraftId={generatingDraftId}
                onGenerateDraft={handleGenerateDraft}
                onDiscard={handleDiscardItem}
              />
            ))}
          </div>

          <aside className="sticky top-4 rounded-xl border-t-4 border-red-500 bg-red-50/50 p-4 lg:col-span-1">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-red-700">🚨 URGENTE</h3>

            {urgentNews.length > 0 ? (
              <div className="space-y-3">
                {urgentNews.map((item) => (
                  <RadarCard
                    key={item.link}
                    item={item}
                    generatingDraftId={generatingDraftId}
                    onGenerateDraft={handleGenerateDraft}
                    onDiscard={handleDiscardItem}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-red-700/80">No hay noticias de último momento.</p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
