"use client"

import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
// Componente para logo de WhatsApp
const WhatsAppIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 2.12.548 4.102 1.506 5.822L.058 23.5l5.697-1.484A11.952 11.952 0 0012 24c6.626 0 12-5.373 12-12S18.626 0 12 0zm0 21.818c-1.845 0-3.543-.502-5.014-1.367l-3.656.954.956-3.656A10.9 10.9 0 011.182 12c0-6.009 4.86-10.909 10.818-10.909s10.818 4.9 10.818 10.909c0 6.008-4.86 10.818-10.818 10.818z"/>
    <path d="M16.568 13.935c-.284-.142-1.68-.828-1.94-.923-.26-.095-.45-.142-.64.142-.19.284-.734.923-.9 1.108-.166.186-.332.209-.616.067-.284-.142-1.203-.444-2.291-1.416-.847-.755-1.418-1.688-1.584-1.972-.166-.284-.014-.438.125-.579.138-.14.304-.329.456-.493.152-.165.203-.284.305-.474.101-.19.05-.356-.025-.498-.075-.142-.64-1.543-.878-2.113-.23-.563-.466-.488-.64-.497l-.545-.006c-.19 0-.498.071-.759.356-.261.284-.997.974-.997 2.374s1.02 2.754 1.163 2.939c.142.185 2.008 3.068 4.862 4.304.678.293 1.208.468 1.623.599.682.217 1.303.186 1.795.113.547-.082 1.68-.688 1.917-1.351.237-.664.237-1.233.166-1.353-.071-.119-.26-.185-.544-.327z"/>
  </svg>
)

// Componente para logo de X (Twitter)
const XIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
import { Facebook, Share2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { ArticleCard } from "./article-card"

// Componente para procesar el contenido del artículo
function ArticleContent({ content }: { content: string }) {
  // Si el contenido contiene HTML, procesarlo
  if (content.includes('<')) {
    return (
      <div 
        className="text-foreground leading-relaxed [&_img]:w-full [&_img]:h-auto [&_img]:max-h-96 [&_img]:object-cover [&_img]:rounded-lg [&_img]:my-6 [&_img]:block [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }
  
  // Si es texto plano, mostrar como párrafos
  const paragraphs = content.split("\n").filter(p => p.trim())
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-foreground leading-relaxed mb-4">
          {paragraph}
        </p>
      ))}
    </>
  )
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  image_caption: string | null
  published_at: string | null
  categories: {
    name: string
    slug: string
  } | null
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  alt_text?: string
  caption?: string
  sort_order: number
}

type RelatedArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  image_caption: string | null
  published_at: string | null
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
  return data as any[]
}

async function fetchArticleMedia(articleId: string): Promise<MediaItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('article_media')
    .select('*')
    .eq('article_id', articleId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data as any[]
}

export function ArticleDetail({ article }: { article: Article }) {
  // Debug para verificar si image_caption llega correctamente
  console.log('=== DEBUG ARTICLE DETAIL ===')
  console.log('Article title:', article.title)
  console.log('Has image_url:', !!article.image_url)
  console.log('Has image_caption:', !!article.image_caption)
  console.log('Image caption value:', article.image_caption)
  console.log('============================')

  const { data: relatedArticles } = useSWR(
    article.categories ? `related-${article.categories.slug}-${article.id}` : null,
    () => fetchRelatedArticles(article.categories?.slug, article.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const { data: mediaItems } = useSWR(
    `media-${article.id}`,
    () => fetchArticleMedia(article.id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  // Función para formatear fecha con validación
const formatArticleDate = (dateString: string | null, createdDateString?: string | null) => {
  // Usar published_at, si no usar created_at, si no usar fecha actual
  const dateToUse = dateString || createdDateString || new Date().toISOString()
  
  const date = new Date(dateToUse)
  
  // Validar si la fecha es válida
  if (isNaN(date.getTime())) {
    return new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  // Validar si la fecha es muy antigua (antes de 2020) - probablemente epoch error
  if (date.getFullYear() < 2020) {
    return new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
}

  const formattedDate = formatArticleDate(article.published_at, (article as any).created_at)
  
  const shareUrl = `https://rafaelahoy.com/noticia/${article.slug}`

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
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      {/* Category badge */}
      {article.categories && (
        <div className="mb-8">
          <Link
            href={`/categoria/${article.categories.slug}`}
            className="inline-block px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            {article.categories.name}
          </Link>
        </div>
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
        <time className="text-sm text-muted-foreground" dateTime={article.published_at || undefined}>
          {formattedDate}
        </time>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Compartir:</span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${article.title}\n\n${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
          >
            <WhatsAppIcon />
            <span className="sr-only">Compartir en WhatsApp</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
          >
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Compartir en Facebook</span>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
          >
            <XIcon />
            <span className="sr-only">Compartir en X</span>
          </a>
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
        <>
          <figure className="relative w-full aspect-video mb-6">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </figure>
          {/* Pie de imagen - FUERA del figure pero inmediatamente después */}
          {article.image_caption && (
            <figcaption className="text-sm text-gray-500 italic text-left mt-2 px-4 mb-8">
              {article.image_caption}
            </figcaption>
          )}
        </>
      )}

      {/* Content */}
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        <ArticleContent content={article.content} />
      </div>

      {/* Media Gallery - debajo del contenido */}
      {mediaItems && mediaItems.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaItems
              .filter(media => media.url !== article.image_url) // Excluir imagen de portada
              .map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                  {media.type === 'image' ? (
                    <Image
                      src={media.url}
                      alt={media.alt_text || article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {media.caption && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {media.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
