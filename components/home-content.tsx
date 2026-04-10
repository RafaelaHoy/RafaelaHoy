"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from './article-card'
import Link from "next/link"
import { ChevronRight } from 'lucide-react'
import { WeatherWidget } from './widgets/weather-widget'
import { CurrencyWidget } from './widgets/currency-widget'
import { ObituariesWidget } from './widgets/obituaries-widget'

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
  const allFeaturedArticles = articles?.filter(article => article.is_featured) || []
  const featuredArticle = allFeaturedArticles[0] // La más destacada (principal)
  const sidebarFeaturedArticles = allFeaturedArticles.slice(1, 4) // Las siguientes 3 destacadas
  const gridArticles = articles?.slice(6, 15) || []

  // Filter articles by category for the new sections
  const articlesByCategory = articles?.reduce((acc, article) => {
    if (article.categories) {
      const categorySlug = article.categories.slug
      if (!acc[categorySlug]) {
        acc[categorySlug] = {
          name: article.categories.name,
          articles: []
        }
      }
      acc[categorySlug].articles.push(article)
    }
    return acc
  }, {} as Record<string, { name: string; articles: Article[] }>) || {}

  // Define the 6 categories to show in specific order
  const categoriesToShow = [
    { slug: 'locales', name: 'Locales' },
    { slug: 'policiales', name: 'Policiales' },
    { slug: 'deportes', name: 'Deportes' },
    { slug: 'provinciales', name: 'Provinciales' },
    { slug: 'regionales', name: 'Regionales' },
    { slug: 'agroindustria', name: 'Agroindustria' }
  ]

  // Style patterns for 3-section cycle
  const getCategoryStyle = (index: number) => {
    const patternIndex = index % 3
    switch (patternIndex) {
      case 0: // Style A - Sections 1, 4
        return {
          bg: 'bg-secondary text-white',
          border: 'border-red-500',
          button: 'bg-white text-red-500 hover:bg-red-50'
        }
      case 1: // Style B - Sections 2, 5
        return {
          bg: 'bg-white text-black',
          border: 'border-secondary',
          button: 'bg-red-500 text-white hover:bg-red-600'
        }
      case 2: // Style C - Sections 3, 6
        return {
          bg: 'bg-red-600 text-white',
          border: 'border-white',
          button: 'bg-secondary text-white hover:bg-red-700'
        }
      default:
        return {
          bg: 'bg-white text-black',
          border: 'border-secondary',
          button: 'bg-red-500 text-white hover:bg-red-600'
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Section - Featured Article + Secondary Articles */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Featured Article - Left */}
          <div className="lg:col-span-8 order-1 lg:order-1">
            {isLoading ? (
              <ArticleSkeleton variant="featured" />
            ) : featuredArticle ? (
              <Link href={`/noticia/${featuredArticle.slug}`} className="block group">
                <div className="space-y-4">
                  {/* Image */}
                  <div className="relative aspect-[825/490] w-full max-h-[490px] overflow-hidden rounded-lg border border-red-600">
                    {featuredArticle.image_url && (
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Section badge - Top left */}
                    <div className="lg:absolute lg:top-6 lg:left-6 hidden lg:block">
                      {featuredArticle.categories && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {featuredArticle.categories.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Overlay content - Desktop only */}
                    <div className="lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:bg-gradient-to-t lg:from-black/80 lg:to-transparent lg:p-6 hidden lg:block">
                      <div className="max-w-4xl">
                        <div className="bg-secondary px-4 py-2 rounded-lg">
                          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white line-clamp-3">
                            {featuredArticle.title}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile content - Below image */}
                  <div className="lg:hidden space-y-4">
                    <div className="bg-secondary p-4 rounded-lg">
                      <h1 className="text-xl md:text-2xl font-bold text-white line-clamp-3">
                        {featuredArticle.title}
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base line-clamp-2 mb-3">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
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
            ) : null}
          </div>
          {/* Three Featured Articles - Right */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="space-y-3">
              {isLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex h-40 bg-secondary border border-red-600 rounded-lg overflow-hidden">
                      <div className="w-[40%] bg-muted"></div>
                      <div className="flex-1 p-3 space-y-2">
                        <div className="h-3 bg-red-600 rounded w-20"></div>
                        <div className="h-4 bg-white rounded w-full"></div>
                        <div className="h-4 bg-white rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                sidebarFeaturedArticles.map((article, index) => (
                  <Link 
                    key={article.id} 
                    href={`/noticia/${article.slug}`}
                    className="block group h-40 bg-secondary border border-red-600 rounded-lg overflow-hidden hover:bg-secondary/90 transition-colors"
                  >
                    <div className="flex h-full">
                      {/* Thumbnail - Left */}
                      <div className="w-[40%] relative overflow-hidden">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      {/* Content Block - Right */}
                      <div className="flex-1 p-3 flex flex-col justify-start space-y-2">
                        {/* Category - Red */}
                        {article.categories && (
                          <div className="text-red-600 font-bold text-xs uppercase tracking-wide">
                            {article.categories.name}
                          </div>
                        )}
                        {/* Title - White */}
                        <h3 className="text-white font-medium text-sm leading-tight line-clamp-3">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Latest News Grid - 2 Columns + Sidebar */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>
          <Link href="/categorias" className="text-primary hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {/* 3 Column Grid: 2 for news, 1 for sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* News Columns - 8 columns total */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg overflow-hidden border border-blue-600">
                    <div className="aspect-video bg-muted"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-red-600 rounded w-20"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              gridArticles.slice(0, 10).map((article) => (
                <Link key={article.id} href={`/noticia/${article.slug}`} className="group h-full">
                  <div className="bg-card rounded-lg overflow-hidden border border-blue-600 hover:border-primary transition-colors h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-video overflow-hidden">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      {/* Category */}
                      {article.categories && (
                        <div className="text-red-600 font-bold text-xs uppercase tracking-wide">
                          {article.categories.name}
                        </div>
                      )}
                      {/* Title */}
                      <h3 className="font-semibold text-foreground line-clamp-2 leading-tight flex-1">
                        {article.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            {/* Weather Widget */}
            <div className="border border-red-600 rounded-lg overflow-hidden">
              <WeatherWidget />
            </div>
            
            {/* Currency Widget */}
            <div className="border border-red-600 rounded-lg overflow-hidden">
              <CurrencyWidget />
            </div>
            
            {/* Obituaries Widget */}
            <div className="border border-red-600 rounded-lg overflow-hidden">
              <ObituariesWidget />
            </div>
            
            {/* Advertisement Widget */}
            <div className="bg-muted border-2 border-dashed border-red-600 rounded-lg p-8 text-center">
              <div className="text-muted-foreground">
                <div className="text-4xl mb-2">📢</div>
                <p className="font-medium">Espacio Publicitario</p>
                <p className="text-sm mt-1">300x250px</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Category Sections - New Design */}
      {categoriesToShow.map((category, index) => {
        const categoryArticles = articlesByCategory[category.slug]?.articles || []
        const style = getCategoryStyle(index)
        
        return (
          <section key={category.slug} className={`mb-8 rounded-lg border-2 ${style.border} overflow-hidden ${style.bg}`}>
            <div className="px-6 py-4 border-b border-black/20 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-wide">
                {category.name}
              </h2>
              <Link
                href={`/categoria/${category.slug}`}
                className={`text-sm font-medium flex items-center px-4 py-2 rounded transition-colors ${style.button}`}
              >
                Ver más <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.slice(0, 3).map((article) => (
                  <Link key={article.id} href={`/noticia/${article.slug}`} className="group">
                    <div className="overflow-hidden">
                      {/* Image */}
                      <div className="aspect-video overflow-hidden mb-3">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      {/* Title */}
                      <h3 className="font-semibold line-clamp-2 leading-tight">
                        {article.title}
                      </h3>
                    </div>
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
