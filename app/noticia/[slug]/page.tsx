import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleDetail } from "@/components/article-detail"
import type { Metadata } from "next"

// Forzar renderizado dinámico para evitar caché
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, image_url")
    .eq("slug", slug)
    .single()

  if (!article) {
    return { title: "Noticia no encontrada - Rafaela hoy" }
  }

  // Función para convertir URLs relativas a absolutas
  const getAbsoluteUrl = (url: string | null): string => {
    if (!url) return "https://rafaelahoy.com/og-default-image.jpg"
    
    // Si ya es una URL absoluta, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Si es una URL relativa, convertirla a absoluta
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rafaelahoy.com"
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  const imageUrl = getAbsoluteUrl(article.image_url)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rafaelahoy.com"
  const fullUrl = `${siteUrl}/noticia/${slug}`

  return {
    title: `${article.title} - Rafaela hoy`,
    description: article.excerpt || `Leer más sobre ${article.title} en Rafaela hoy`,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: article.title,
      description: article.excerpt || `Leer más sobre ${article.title} en Rafaela hoy`,
      url: fullUrl,
      siteName: "Rafaela hoy",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: "es_AR",
      type: "article",
      publishedTime: (article as any).published_at,
      authors: ["Rafaela hoy"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || `Leer más sobre ${article.title} en Rafaela hoy`,
      images: [imageUrl],
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article, error } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      image_url,
      image_caption,
      published_at,
      categories (
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  // Debug para verificar si image_caption viene de Supabase
  console.log('=== DEBUG SUPABASE ARTICLE ===')
  console.log('Slug:', slug)
  console.log('Article found:', !!article)
  console.log('Has image_url:', !!article?.image_url)
  console.log('Has image_caption:', !!article?.image_caption)
  console.log('Image caption from DB:', article?.image_caption)
  console.log('============================')

  if (error || !article) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ArticleDetail article={article as any} />
      </main>
      <Footer />
    </div>
  )
}
