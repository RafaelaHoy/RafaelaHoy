"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "./article-card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

function ArticleSkeleton({ variant }: { variant?: "featured" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <div className="flex gap-3 p-3">
        <div className="w-20 h-16 bg-muted rounded-md"></div>
        <div className="flex-1">
          <div className="h-3 bg-muted rounded mb-2 w-3/4"></div>
          <div className="h-2 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }
  
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

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  is_featured: boolean
  sort_order: number
  categories: {
    name: string
    slug: string
  } | null
}

async function fetchArticles(): Promise<Article[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      image_url,
      published_at,
      is_featured,
      sort_order,
      categories (
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false })
    .limit(30)

  if (error) throw error
  return data as Article[]
}

export function HomeContent() {
  const { data: articles, error, isLoading } = useSWR("articles", fetchArticles, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar las noticias</h2>
          <p className="text-muted-foreground">Por favor, intenta recargar la página.</p>
        </div>
      </div>
    )
  }

  // Separate featured and other articles
  const featuredArticle = articles?.find(article => article.is_featured)
  const secondaryArticles = articles?.filter(article => !article.is_featured).slice(0, 5) || []
  const gridArticles = articles?.slice(6, 15) || []

  // Group articles by category for category sections
  const articlesByCategory = articles?.reduce((acc, article) => {
    if (article.categories) {
      if (!acc[article.categories.slug]) {
        acc[article.categories.slug] = {
          name: article.categories.name,
          articles: []
        }
      }
      acc[article.categories.slug].articles.push(article)
    }
    return acc
  }, {} as Record<string, { name: string; articles: Article[] }>) || {}

  const categoryColors = {
    locales: { bg: "bg-secondary", border: "border-secondary" },
    provinciales: { bg: "bg-background", border: "border-primary" },
    policiales: { bg: "bg-secondary", border: "border-secondary" },
    deportes: { bg: "bg-background", border: "border-primary" },
    politica: { bg: "bg-secondary", border: "border-secondary" },
    economia: { bg: "bg-background", border: "border-primary" },
    "cultura-y-espectaculos": { bg: "bg-secondary", border: "border-secondary" },
    tecnologia: { bg: "bg-background", border: "border-primary" },
    salud: { bg: "bg-secondary", border: "border-secondary" },
    agroindustria: { bg: "bg-background", border: "border-primary" },
    internacionales: { bg: "bg-secondary", border: "border-secondary" },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Section - Featured Article + Secondary Articles */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Featured Article - Left */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <ArticleSkeleton variant="featured" />
            ) : featuredArticle ? (
              <Link href={`/noticia/${featuredArticle.slug}`} className="block group">
                <div className="relative">
                  <div className="aspect-[825/490] w-full max-h-[490px] overflow-hidden rounded-lg">
                    {featuredArticle.image_url && (
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 line-clamp-3">
                      {featuredArticle.title}
                    </h1>
                    <p className="text-white/90 text-sm md:text-base line-clamp-2 mb-3">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      {featuredArticle.categories && (
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                          {featuredArticle.categories.name}
                        </span>
                      )}
                      <span className="text-white/70 text-xs">
                        {new Date(featuredArticle.published_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : secondaryArticles[0] ? (
              <Link href={`/noticia/${secondaryArticles[0].slug}`} className="block group">
                <div className="relative">
                  <div className="aspect-[825/490] w-full max-h-[490px] overflow-hidden rounded-lg">
                    {secondaryArticles[0].image_url && (
                      <img
                        src={secondaryArticles[0].image_url}
                        alt={secondaryArticles[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 line-clamp-3">
                      {secondaryArticles[0].title}
                    </h1>
                    <p className="text-white/90 text-sm md:text-base line-clamp-2 mb-3">
                      {secondaryArticles[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      {secondaryArticles[0].categories && (
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                          {secondaryArticles[0].categories.name}
                        </span>
                      )}
                      <span className="text-white/70 text-xs">
                        {new Date(secondaryArticles[0].published_at).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>

          {/* Five Secondary Features - Right (in framed box) */}
          <div className="lg:col-span-4 bg-card rounded-lg border-2 border-border overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border">
              <h2 className="font-bold text-sm uppercase tracking-wide text-foreground">
                Destacados
              </h2>
            </div>
            <div className="divide-y divide-border max-h-[490px] overflow-y-auto">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <ArticleSkeleton key={i} variant="secondary" />
                  ))}
                </>
              ) : (
                secondaryArticles.slice(0, 5).map((article) => (
                  <Link 
                    key={article.id} 
                    href={`/noticia/${article.slug}`}
                    className="flex gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    {article.image_url && (
                      <div className="w-20 h-16 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug mb-1">
                        {article.title}
                      </h3>
                      {article.categories && (
                        <span className="text-xs text-primary font-medium">
                          {article.categories.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Secondary News Grid - 3x3 */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {[...Array(9)].map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </>
          ) : (
            gridArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>
      </section>

      {/* Category Sections with themed backgrounds */}
      {Object.entries(articlesByCategory).map(([slug, { name, articles: categoryArticles }], index) => {
        const colors = categoryColors[slug] || { bg: index % 2 === 0 ? "bg-secondary" : "bg-background", border: "border-border" }
        const isAltBg = index % 2 === 0
        
        return (
          <section 
            key={slug} 
            className={`mb-8 rounded-lg border-2 ${colors.border} overflow-hidden ${isAltBg ? "bg-secondary text-white" : "bg-card"}`}
          >
            <div className={`px-6 py-4 border-b ${isAltBg ? "border-white/20" : "border-border"} flex items-center justify-between`}>
              <h2 className={`text-xl font-bold uppercase tracking-wide ${isAltBg ? "text-white" : "text-foreground"}`}>
                {name}
              </h2>
              <Link
                href={`/categoria/${slug}`}
                className={`text-sm font-medium flex items-center hover:underline ${isAltBg ? "text-primary" : "text-primary"}`}
              >
                Ver más <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {categoryArticles.slice(0, 5).map((article) => (
                  <Link 
                    key={article.id} 
                    href={`/noticia/${article.slug}`}
                    className="group"
                  >
                    {article.image_url && (
                      <div className="aspect-video rounded-md overflow-hidden mb-2">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className={`text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors ${isAltBg ? "text-white" : "text-foreground"}`}>
                      {article.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
