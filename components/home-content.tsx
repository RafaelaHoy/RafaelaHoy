"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from './article-card'
import Link from "next/link"
import { ChevronRight } from 'lucide-react'
import { WeatherWidget } from './widgets/weather-widget'
import { CurrencyWidget } from './widgets/currency-widget'
import { ObituariesWidget } from './widgets/obituaries-widget'
import { PharmaciesOnDutyWidget } from './widgets/pharmacies-on-duty-widget'

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
  excerpt: string
  image_url: string | null
  image_caption: string | null
  published_at: string
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
      image_caption,
      published_at,
      sort_order,
      categories (
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(50)

  if (error) throw error
  return data as any[]
}

// Nueva función específica para noticias por categoría con orden cronológico
async function fetchArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      image_url,
      image_caption,
      created_at,
      sort_order,
      categories!inner(
        name,
        slug
      )
    `)
    .eq("is_published", true)
    .eq("categories.slug", categorySlug)
    .order("published_at", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(4)

  if (error) throw error
  return data as any[]
}

export function HomeContent() {
  const { data: articles, error, isLoading } = useSWR("articles", fetchArticles, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  // Fetch específico para cada categoría con orden cronológico
  const { data: localesArticles } = useSWR("category-locales", () => fetchArticlesByCategory("locales"))
  const { data: policialesArticles } = useSWR("category-policiales", () => fetchArticlesByCategory("policiales"))
  const { data: deportesArticles } = useSWR("category-deportes", () => fetchArticlesByCategory("deportes"))
  const { data: provincialesArticles } = useSWR("category-provinciales", () => fetchArticlesByCategory("provinciales"))
  const { data: regionalesArticles } = useSWR("category-regionales", () => fetchArticlesByCategory("regionales"))
  const { data: agroindustriaArticles } = useSWR("category-agroindustria", () => fetchArticlesByCategory("agroindustria"))

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Error al cargar las noticias</h2>
          <p className="text-muted-foreground">Por favor, intenta recargar la página.</p>
        </div>
      </div>
    )
  }

  // Separate featured and other articles by sort_order (solo para sección superior)
  const mainFeaturedArticle = articles?.find(a => a.sort_order === 0)
  // Garantizar exactamente 3 noticias destacadas con sort_order 1, 2, 3
  const secondaryFeaturedArticles = articles?.filter(a => a.sort_order >= 1 && a.sort_order <= 3).sort((a, b) => {
    // Primero por sort_order ascendente, luego por published_at descendente
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  }).slice(0, 3) || []
  // Obtener las siguientes 10 noticias después de las destacadas (sort_order 4 al 13)
  const latestArticles = articles?.filter(a => a.sort_order >= 4 && a.sort_order <= 13).sort((a, b) => {
    // Primero por sort_order ascendente, luego por published_at descendente
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  }).slice(0, 10) || []
  
  // Debug: Verificar el orden de las noticias
  console.log('=== DEBUG ORDEN DE NOTICIAS ===')
  console.log('Destacadas (orden 1-3):')
  secondaryFeaturedArticles.forEach((article, index) => {
    console.log(`  ${index + 1}. sort_order: ${article.sort_order}, título: ${article.title}`)
  })
  console.log('Últimas noticias (orden 4-13):')
  latestArticles.forEach((article, index) => {
    console.log(`  ${index + 1}. sort_order: ${article.sort_order}, título: ${article.title}`)
  })
  console.log('============================')
  
  // Para compatibilidad con el código existente
  const featuredArticle = mainFeaturedArticle
  const sidebarFeaturedArticles = secondaryFeaturedArticles
  const gridArticles = latestArticles

  // Definir las 6 categorías con sus datos específicos
  const categoriesWithArticles = [
    { slug: 'locales', name: 'Locales', articles: localesArticles || [] },
    { slug: 'policiales', name: 'Policiales', articles: policialesArticles || [] },
    { slug: 'deportes', name: 'Deportes', articles: deportesArticles || [] },
    { slug: 'provinciales', name: 'Provinciales', articles: provincialesArticles || [] },
    { slug: 'regionales', name: 'Regionales', articles: regionalesArticles || [] },
    { slug: 'agroindustria', name: 'Agroindustria', articles: agroindustriaArticles || [] }
  ]

  // Debug: Log para verificar cuántas noticias hay por categoría y si tienen image_caption
  console.log('=== DEBUG NOTICIAS POR CATEGORÍA ===')
  categoriesWithArticles.forEach(category => {
    const count = category.articles.length
    console.log(`${category.name}: ${count} noticias`)
    if (count > 0) {
      console.log(`  - Últimas: ${category.articles.slice(0, 3).map(a => a.title).join(', ')}`)
      // Verificar si tienen image_caption
      const withCaption = category.articles.filter(a => a.image_caption)
      console.log(`  - Con pie de foto: ${withCaption.length}`)
      if (withCaption.length > 0) {
        console.log(`  - Ejemplos: ${withCaption.slice(0, 2).map(a => `"${a.image_caption}"`).join(', ')}`)
      }
    }
  })
  
  // Debug para noticia principal
  if (featuredArticle) {
    console.log(`=== NOTICIA PRINCIPAL ===`)
    console.log(`Título: ${featuredArticle.title}`)
    console.log(`Tiene image_caption: ${featuredArticle.image_caption ? 'SÍ' : 'NO'}`)
    console.log(`Image_caption: "${featuredArticle.image_caption}"`)
    console.log(`========================`)
  }
  console.log('========================================')

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
          bg: 'bg-red-600 text-white',
          border: 'border-secondary',
          button: 'bg-secondary text-white hover:bg-red-700'
        }
      case 2: // Style C - Sections 3, 6
        return {
          bg: 'bg-white text-black',
          border: 'border-secondary',
          button: 'bg-red-500 text-white hover:bg-red-600'
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
                  {/* Image - Desktop only */}
                  <div className="hidden lg:block relative aspect-[825/490] w-full max-h-[490px] overflow-hidden rounded-lg border border-red-600">
                    {featuredArticle.image_url && (
                      <img
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Section badge - Top left inside image */}
                    <div className="lg:absolute lg:top-6 lg:left-6 hidden lg:block">
                      {featuredArticle.categories && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          {featuredArticle.categories.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Pie de foto - Desktop only */}
                    {featuredArticle.image_caption && (
                      <div className="lg:absolute lg:bottom-6 lg:left-6 lg:right-6 hidden lg:block">
                        <p className="text-white text-sm italic text-center bg-black/50 px-3 py-2 rounded-lg backdrop-blur-sm">
                          {featuredArticle.image_caption}
                        </p>
                      </div>
                    )}
                    
                    {/* Overlay content - Desktop only */}
                    <div className="lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:bg-gradient-to-t lg:from-black/80 lg:to-transparent lg:p-6 hidden lg:block">
                      <div className="max-w-4xl">
                        <div className="bg-secondary px-4 py-2 rounded-lg">
                          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                            {featuredArticle.title}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile content - Below image */}
                  <div className="lg:hidden">
                    <div className="bg-card rounded-lg overflow-hidden border border-red-600 hover:border-primary transition-colors">
                      {/* Image */}
                      <div className="aspect-video overflow-hidden">
                        {featuredArticle.image_url && (
                          <img
                            src={featuredArticle.image_url}
                            alt={featuredArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      {/* Pie de foto - Mobile */}
                      {featuredArticle.image_caption && (
                        <div className="px-4 pt-2">
                          <p className="text-gray-600 text-sm italic text-center">
                            {featuredArticle.image_caption}
                          </p>
                        </div>
                      )}
                      {/* Content */}
                      <div className="p-4 space-y-2">
                        {/* Category */}
                        {featuredArticle.categories && (
                          <div className="text-red-600 font-bold text-xs uppercase tracking-wide">
                            {featuredArticle.categories.name}
                          </div>
                        )}
                        {/* Title */}
                        <h1 className="font-semibold text-black leading-relaxed text-base">
                          {featuredArticle.title}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
          {/* Three Featured Articles - Right */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="space-y-4">
              {isLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex h-[150px] bg-secondary border border-red-600 rounded-lg overflow-hidden">
                      <div className="w-[45%] bg-muted"></div>
                      <div className="w-[55%] p-3 space-y-2">
                        <div className="h-2 bg-red-600 rounded w-20"></div>
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
                    className="block group h-[150px] bg-secondary border border-red-600 rounded-lg overflow-hidden hover:bg-secondary/90 transition-colors"
                  >
                    <div className="flex h-full">
                      {/* Thumbnail - Left (45%) */}
                      <div className="w-[45%] relative overflow-hidden">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      {/* Content Block - Right (55%) */}
                      <div className="w-[55%] p-3 flex flex-col justify-start">
                        {/* Category */}
                        {article.categories && (
                          <div className="text-red-600 font-bold text-xs uppercase tracking-wide mb-2 border-b border-white">
                            {article.categories.name}
                          </div>
                        )}
                        {/* Title */}
                        <h3 className="font-bold text-white text-sm leading-tight">
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
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground">Últimas Noticias</h2>
        </div>
        {/* 3 Column Grid: 2 for news, 1 for sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* News Columns - 8 columns total */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg overflow-hidden border border-secondary">
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
                  <div className="bg-card rounded-lg overflow-hidden border border-secondary hover:border-primary transition-colors h-full flex flex-col">
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
                      <h3 className="font-semibold text-foreground leading-tight flex-1">
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
            
            {/* Pharmacies On Duty Widget */}
            <div className="border border-red-600 rounded-lg overflow-hidden">
              <PharmaciesOnDutyWidget />
            </div>
          </div>
        </div>
      </section>
      {/* Category Sections - New Design */}
      {categoriesWithArticles.map((category, index) => {
        // Las noticias ya vienen ordenadas cronológicamente desde fetchArticlesByCategory
        // Mostrar hasta 4 noticias, CSS grid se encargará de la responsividad
        const articlesToShow = category.articles.slice(0, 4)
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {articlesToShow.map((article, articleIndex) => (
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
                      <h3 className="font-semibold leading-tight text-sm line-clamp-3 group-hover:text-primary transition-colors">
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
