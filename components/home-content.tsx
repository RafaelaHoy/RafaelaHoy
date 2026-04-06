"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "./article-card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  is_featured: boolean
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
      categories (
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(30)

  if (error) throw error
  return data as Article[]
}

function ArticleSkeleton({ variant = "default" }: { variant?: "featured" | "default" | "compact" | "secondary" }) {
  if (variant === "featured") {
    return (
      <div className="rounded-lg overflow-hidden bg-muted">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="p-4">
          <Skeleton className="h-5 w-20 mb-3" />
          <Skeleton className="h-7 w-full mb-2" />
          <Skeleton className="h-7 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (variant === "secondary") {
    return (
      <div className="flex gap-3 p-3 border-b border-border last:border-b-0">
        <Skeleton className="w-24 h-20 rounded-md flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-3">
        <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Skeleton className="aspect-video rounded-lg mb-3" />
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-5 w-full mb-1" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
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
          <p className="text-muted-foreground">Error al cargar las noticias. Por favor, intenta de nuevo.</p>
        </div>
      </div>
    )
  }

  const featuredArticle = articles?.find((a) => a.is_featured)
  const allOtherArticles = articles?.filter((a) => !a.is_featured) || []
  const secondaryArticles = allOtherArticles.slice(0, 3)
  const gridArticles = allOtherArticles.slice(3, 12)
  
  // Group articles by category for sections
  const articlesByCategory = articles?.reduce((acc, article) => {
    if (article.categories) {
      const slug = article.categories.slug
      if (!acc[slug]) {
        acc[slug] = { name: article.categories.name, articles: [] }
      }
      acc[slug].articles.push(article)
    }
    return acc
  }, {} as Record<string, { name: string; articles: Article[] }>) || {}

  const categoryColors: Record<string, { bg: string; border: string }> = {
    locales: { bg: "bg-secondary", border: "border-secondary" },
    policiales: { bg: "bg-background", border: "border-primary" },
    deportes: { bg: "bg-secondary", border: "border-secondary" },
    politica: { bg: "bg-background", border: "border-primary" },
    economia: { bg: "bg-secondary", border: "border-secondary" },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Section - Featured Article + Secondary Articles */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Featured Article - Left */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <ArticleSkeleton variant="featured" />
          ) : featuredArticle ? (
            <ArticleCard article={featuredArticle} variant="featured" />
          ) : allOtherArticles[0] ? (
            <ArticleCard article={allOtherArticles[0]} variant="featured" />
          ) : null}
        </div>

        {/* Three Secondary Features - Right (in framed box) */}
        <div className="bg-card rounded-lg border-2 border-border overflow-hidden">
          <div className="bg-muted px-4 py-2 border-b border-border">
            <h2 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Destacados
            </h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <>
                <ArticleSkeleton variant="secondary" />
                <ArticleSkeleton variant="secondary" />
                <ArticleSkeleton variant="secondary" />
              </>
            ) : (
              secondaryArticles.map((article) => (
                <Link 
                  key={article.id} 
                  href={`/noticia/${article.slug}`}
                  className="flex gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  {article.image_url && (
                    <div className="w-24 h-20 flex-shrink-0 rounded-md overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-1">
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
      {Object.entries(articlesByCategory).slice(0, 4).map(([slug, { name, articles: categoryArticles }], index) => {
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
