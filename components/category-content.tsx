"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "./article-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Category {
  id: string
  name: string
  slug: string
}

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  sort_order: number
  categories: {
    name: string
    slug: string
  } | null
}

async function fetchCategoryArticles(categoryId: string): Promise<Article[]> {
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
      sort_order,
      categories (
        name,
        slug
      )
    `)
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(50)

  if (error) throw error
  return data as any[]
}

function ArticleSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video rounded-lg mb-3" />
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-5 w-full mb-1" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function CategoryContent({ category }: { category: Category }) {
  const { data: articles, error, isLoading } = useSWR(
    `category-${category.id}`,
    () => fetchCategoryArticles(category.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
        <p className="text-muted-foreground mt-2">
          Últimas noticias de {category.name} en Rafaela y la región
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Error al cargar las noticias. Por favor, intenta de nuevo.</p>
        </div>
      )}

      {/* Articles grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {isLoading ? (
          <>
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
            <ArticleSkeleton />
          </>
        ) : articles && articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article as any} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No hay noticias en esta categoría.</p>
          </div>
        )}
      </div>
    </div>
  )
}
