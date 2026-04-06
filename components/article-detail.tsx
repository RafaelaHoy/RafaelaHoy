"use client"

import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Facebook, Twitter, Linkedin, Share2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "./article-card"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  published_at: string
  categories: {
    name: string
    slug: string
  } | null
}

type RelatedArticle = {
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

async function fetchRelatedArticles(categorySlug: string | undefined, currentId: string): Promise<RelatedArticle[]> {
  if (!categorySlug) return []
  
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
      categories!inner (
        name,
        slug
      )
    `)
    .eq("categories.slug", categorySlug)
    .eq("is_published", true)
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(3)

  if (error) return []
  return data as RelatedArticle[]
}

export function ArticleDetail({ article }: { article: Article }) {
  const { data: relatedArticles } = useSWR(
    article.categories ? `related-${article.categories.slug}-${article.id}` : null,
    () => fetchRelatedArticles(article.categories?.slug, article.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const formattedDate = format(new Date(article.published_at), "d 'de' MMMM 'de' yyyy, HH:mm", {
    locale: es,
  })

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.excerpt || "",
        url: shareUrl,
      })
    }
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      {/* Category badge */}
      {article.categories && (
        <Link
          href={`/categoria/${article.categories.slug}`}
          className="inline-block px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-full mb-4 hover:bg-primary/90 transition-colors"
        >
          {article.categories.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-balance">
        {article.title}
      </h1>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
          {article.excerpt}
        </p>
      )}

      {/* Meta and share */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b">
        <time className="text-sm text-muted-foreground" dateTime={article.published_at}>
          {formattedDate}
        </time>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Compartir:</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
          >
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Compartir en Facebook</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`, "_blank")}
          >
            <Twitter className="h-4 w-4" />
            <span className="sr-only">Compartir en Twitter</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`, "_blank")}
          >
            <Linkedin className="h-4 w-4" />
            <span className="sr-only">Compartir en LinkedIn</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Compartir</span>
          </Button>
        </div>
      </div>

      {/* Featured image */}
      {article.image_url && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {article.content.split("\n").map((paragraph, index) => (
          <p key={index} className="text-foreground leading-relaxed mb-4">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Related articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Noticias relacionadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.id} article={relatedArticle} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
