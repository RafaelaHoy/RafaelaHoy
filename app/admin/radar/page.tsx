"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react"

const tabs = [
  "Todas",
  "Locales",
  "Regionales",
  "Provinciales",
  "Nacionales",
  "Internacionales",
] as const

type Tab = (typeof tabs)[number]

type RadarArticle = {
  id: string
  source: string
  category: Tab
  publishedAt: string
  title: string
  url: string
  urgent?: boolean
}

const radarArticles: RadarArticle[] = [
  {
    id: "1",
    source: "Rafaela Noticias",
    category: "Locales",
    publishedAt: "Hace 8 min",
    title: "Corte de tránsito en el centro por evento deportivo",
    url: "https://rafaelanoticias.com/corte-transito-evento",
  },
  {
    id: "2",
    source: "La Capital",
    category: "Regionales",
    publishedAt: "Hace 22 min",
    title: "Debate sobre polígono industrial y los fondos provinciales",
    url: "https://lacapital.com.ar/region/poligono-industrial",
  },
  {
    id: "3",
    source: "Infobae",
    category: "Nacionales",
    publishedAt: "Hace 35 min",
    title: "Anuncio urgente de medidas económicas para PyMEs",
    url: "https://infobae.com/economia/medidas-economicas-pymes",
    urgent: true,
  },
]

const categoryStyles: Record<Tab, string> = {
  Todas: "bg-slate-100 text-slate-700",
  Locales: "bg-blue-100 text-blue-700",
  Regionales: "bg-orange-100 text-orange-700",
  Provinciales: "bg-amber-100 text-amber-700",
  Nacionales: "bg-violet-100 text-violet-700",
  Internacionales: "bg-cyan-100 text-cyan-700",
}

function RadarCard({ article }: { article: RadarArticle }) {
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm transition ${article.urgent ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:-translate-y-0.5"}`}>
      <button
        type="button"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-700"
        aria-label="Descartar noticia"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{article.source}</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryStyles[article.category]}`}>
            {article.category}
          </span>
        </div>
        <p className="text-sm text-slate-500">{article.publishedAt}</p>
      </div>

      <h2 className="mt-6 text-xl font-semibold leading-tight text-slate-900">
        {article.title}
      </h2>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-200"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Fuente Original
        </a>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Generar borrador
        </button>
      </div>
    </article>
  )
}

export default function AdminRadarPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Todas")

  const visibleArticles = useMemo(() => {
    if (activeTab === "Todas") {
      return radarArticles
    }
    return radarArticles.filter((article) => article.category === activeTab)
  }, [activeTab])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Panel de Administración</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Radar de Noticias</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Explorá las noticias por alcance y prioridad desde el panel administrativo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al dashboard
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6">
          {visibleArticles.length > 0 ? (
            visibleArticles.map((article) => <RadarCard key={article.id} article={article} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              No hay noticias para esta categoría.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
