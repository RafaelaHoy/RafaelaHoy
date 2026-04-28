"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus
} from "lucide-react"
import Link from "next/link"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string
  is_featured: boolean
  is_published: boolean
  sort_order: number
  categories: {
    name: string
    slug: string
  } | null
}

function ArticleRow({ 
  article, 
  onTogglePublished, 
  onDelete
}: {
  article: Article
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Miniatura */}
      <div className="w-16 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <img
              src="/images/logo.jpg"
              alt="Sin imagen"
              className="w-full h-full object-contain opacity-30 p-1"
            />
          </div>
        )}
      </div>

      {/* Título, categoría y fecha */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{article.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          {article.categories && (
            <Badge variant="outline" className="text-xs">
              {article.categories.name}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(article.published_at).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onTogglePublished(article.id, !article.is_published)}
          className={`h-8 w-8 p-0 ${
            article.is_published ? "text-green-600" : "text-gray-400"
          }`}
        >
          {article.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        <Link href={`/admin/noticias/editar/${article.id}`}>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(article.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function AdminNoticiasPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Cargar artículos
  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
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
          is_published,
          sort_order,
          categories (
            name,
            slug
          )
        `)
        .order("published_at", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(50) // Limitar para reducir memoria

      if (error) throw error
      setArticles(data as any || [])
    } catch (error) {
      console.error("Error cargando artículos:", error)
      alert("Error al cargar las noticias")
    } finally {
      setLoading(false)
    }
  }

  // Organizar artículos según la estructura de la Home usando sort_order
  const mainFeaturedArticle = articles.find(article => article.sort_order === 0)
  const secondaryFeaturedArticles = articles.filter(article => article.sort_order !== null && article.sort_order >= 1 && article.sort_order <= 3).sort((a, b) => {
    // Primero por sort_order ascendente, luego por published_at descendente
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })
  const latestArticles = articles.filter(article => article.sort_order !== null && article.sort_order >= 4 && article.sort_order <= 13).sort((a, b) => {
    // Primero por sort_order ascendente, luego por published_at descendente
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })
  
  // Repositorio: artículos con sort_order === null || article.sort_order > 13
  const repositoryArticles = articles.filter(article => article.sort_order === null || article.sort_order > 13).sort((a, b) => {
    // Primero por sort_order ascendente (null al final), luego por published_at descendente
    if (a.sort_order === null && b.sort_order !== null) return 1
    if (a.sort_order !== null && b.sort_order === null) return -1
    if (a.sort_order !== null && b.sort_order !== null && a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  // Toggle publicado
  const togglePublished = async (articleId: string, published: boolean) => {
    try {
      await supabase
        .from("articles")
        .update({ is_published: published })
        .eq("id", articleId)

      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, is_published: published }
            : article
        )
      )

      alert(published ? "Noticia publicada" : "Noticia despublicada")
    } catch (error) {
      console.error("Error cambiando estado:", error)
      alert("Error al cambiar el estado")
    }
  }

  // Eliminar artículo
  const deleteArticle = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta noticia?")) return

    try {
      await supabase
        .from("articles")
        .delete()
        .eq("id", articleId)

      setArticles(prev => prev.filter(article => article.id !== articleId))
      alert("Noticia eliminada")
    } catch (error) {
      console.error("Error eliminando artículo:", error)
      alert("Error al eliminar la noticia")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-muted rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Panel de Noticias</h1>
          <Link href="/admin/noticias/crear">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Noticia
            </Button>
          </Link>
        </div>

        {/* Bloque 1: Noticia Principal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Noticia Principal
              <Badge variant="secondary">{mainFeaturedArticle ? 1 : 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mainFeaturedArticle ? (
              <ArticleRow
                article={mainFeaturedArticle}
                onTogglePublished={togglePublished}
                onDelete={deleteArticle}
              />
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay noticia principal
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bloque 2: Noticias Destacadas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Noticias Destacadas
              <Badge variant="secondary">{secondaryFeaturedArticles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {secondaryFeaturedArticles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay noticias destacadas
              </p>
            ) : (
              secondaryFeaturedArticles.map((article, index) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onTogglePublished={togglePublished}
                  onDelete={deleteArticle}
                  />
              ))
            )}
          </CardContent>
        </Card>

        {/* Bloque 3: Últimas Noticias */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Últimas Noticias
              <Badge variant="secondary">{latestArticles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestArticles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay últimas noticias
              </p>
            ) : (
              latestArticles.map((article, index) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  
                  onTogglePublished={togglePublished}
                  onDelete={deleteArticle}
                  
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Repositorio General de Noticias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Repositorio General de Noticias
              <Badge variant="secondary">{repositoryArticles.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repositoryArticles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay noticias en el repositorio
              </p>
            ) : (
              <div className="space-y-2">
                {repositoryArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onTogglePublished={togglePublished}
                    onDelete={deleteArticle}
                    
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
