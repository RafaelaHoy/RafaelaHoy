import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  categories: {
    name: string
    slug: string
  } | null
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  
  return {
    title: q ? `Buscar: "${q}" - Rafaela Hoy` : "Buscar - Rafaela Hoy",
    description: q ? `Resultados de búsqueda para "${q}" en Rafaela Hoy.` : "Busca noticias en Rafaela Hoy.",
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  if (!q || q.trim() === '') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Buscar Noticias</h1>
              <p className="text-muted-foreground">
                Ingresa términos para buscar noticias en nuestro archivo.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { data: articles, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      image_url,
      published_at,
      categories (
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error searching articles:", error)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Resultados de búsqueda: "{q}"
            </h1>
            <p className="text-muted-foreground">
              {articles && articles.length > 0 
                ? `Se encontraron ${articles.length} resultado${articles.length === 1 ? '' : 's'}`
                : 'No se encontraron resultados'
              }
            </p>
          </div>

          {/* Results Grid */}
          {articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No hay resultados
                </h2>
                <p className="text-gray-600 mb-6">
                  No se encontraron noticias que coincidan con "{q}".
                </p>
                <p className="text-sm text-gray-500">
                  Intenta con otros términos más generales.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ArticleSkeleton() {
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="aspect-video bg-muted"></div>
      <div className="p-4">
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-3 bg-muted rounded mb-1"></div>
        <div className="h-3 bg-muted rounded w-3/4"></div>
      </div>
    </div>
  )
}
