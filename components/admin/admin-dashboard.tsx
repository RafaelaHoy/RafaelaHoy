"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Plus, Edit, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Cross, MapPin, FileText } from "lucide-react"
import Link from "next/link"
import { ObituariesManager } from "./obituaries-manager"
import { PharmaciesManager } from "./pharmacies-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface Category {
  id: string
  name: string
  slug: string
}

interface AdminDashboardProps {
  articles: Article[]
  categories: Category[]
}

function ArticleRow({ 
  article, 
  onMoveUp, 
  onMoveDown, 
  onTogglePublished, 
  onDelete,
  showMoveButtons = true,
  isFirst = false,
  isLast = false
}: {
  article: Article
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (id: string) => void
  showMoveButtons?: boolean
  isFirst?: boolean
  isLast?: boolean
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
        {showMoveButtons && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveUp?.(article.id)}
              disabled={isFirst}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveDown?.(article.id)}
              disabled={isLast}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </>
        )}
        
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

export function AdminDashboard({ articles: initialArticles, categories }: AdminDashboardProps) {
  const [articles, setArticles] = useState(initialArticles)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  // Funciones de reordenamiento - Ahora trabajan con el array completo
  const moveArticleUp = async (articleId: string) => {
    const articleIndex = articles.findIndex(a => a.id === articleId)
    if (articleIndex <= 0) return

    const articleToMove = articles[articleIndex]
    const articleAbove = articles[articleIndex - 1]

    // Intercambiar sort_order
    const tempOrder = articleToMove.sort_order
    articleToMove.sort_order = articleAbove.sort_order
    articleAbove.sort_order = tempOrder

    try {
      await Promise.all([
        createClient()
          .from("articles")
          .update({ sort_order: articleToMove.sort_order })
          .eq("id", articleToMove.id),
        createClient()
          .from("articles")
          .update({ sort_order: articleAbove.sort_order })
          .eq("id", articleAbove.id)
      ])

      // Actualizar estado local - reordenar todo el array
      const newArticles = [...articles]
      newArticles[articleIndex] = articleAbove
      newArticles[articleIndex - 1] = articleToMove
      
      // Reordenar por sort_order para mantener consistencia
      newArticles.sort((a, b) => a.sort_order - b.sort_order)
      setArticles(newArticles)
    } catch (error) {
      console.error("Error moviendo artículo:", error)
      alert("Error al mover la noticia")
    }
  }

  const moveArticleDown = async (articleId: string) => {
    const articleIndex = articles.findIndex(a => a.id === articleId)
    if (articleIndex >= articles.length - 1) return

    const articleToMove = articles[articleIndex]
    const articleBelow = articles[articleIndex + 1]

    // Intercambiar sort_order
    const tempOrder = articleToMove.sort_order
    articleToMove.sort_order = articleBelow.sort_order
    articleBelow.sort_order = tempOrder

    try {
      await Promise.all([
        createClient()
          .from("articles")
          .update({ sort_order: articleToMove.sort_order })
          .eq("id", articleToMove.id),
        createClient()
          .from("articles")
          .update({ sort_order: articleBelow.sort_order })
          .eq("id", articleBelow.id)
      ])

      // Actualizar estado local - reordenar todo el array
      const newArticles = [...articles]
      newArticles[articleIndex] = articleBelow
      newArticles[articleIndex + 1] = articleToMove
      
      // Reordenar por sort_order para mantener consistencia
      newArticles.sort((a, b) => a.sort_order - b.sort_order)
      setArticles(newArticles)
    } catch (error) {
      console.error("Error moviendo artículo:", error)
      alert("Error al mover la noticia")
    }
  }

  // Toggle publicado
  const togglePublished = async (articleId: string, published: boolean) => {
    try {
      await createClient()
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
    } catch (error) {
      console.error("Error cambiando estado:", error)
      alert("Error al cambiar el estado")
    }
  }

  // Eliminar artículo
  const deleteArticle = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta noticia?")) return

    try {
      await createClient()
        .from("articles")
        .delete()
        .eq("id", articleId)

      setArticles(prev => prev.filter(article => article.id !== articleId))
    } catch (error) {
      console.error("Error eliminando artículo:", error)
      alert("Error al eliminar la noticia")
    }
  }

  // Organizar artículos según la estructura de la Home
  const allFeaturedArticles = articles.filter(article => article.is_featured)
  const mainFeaturedArticle = allFeaturedArticles[0] || null
  const secondaryFeaturedArticles = allFeaturedArticles.slice(1, 4)
  const latestArticles = articles.slice(6, 16)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" noLink />
            <span className="text-white/60">|</span>
            <span className="font-medium">Panel de Administración</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs for different sections */}
        <Tabs defaultValue="noticias" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="noticias" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Noticias
            </TabsTrigger>
            <TabsTrigger value="necrologicas" className="flex items-center gap-2">
              <Cross className="h-4 w-4" />
              Necrológicas
            </TabsTrigger>
            <TabsTrigger value="farmacias" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Farmacias
            </TabsTrigger>
          </TabsList>

          {/* Noticias Tab - Nueva Estructura */}
          <TabsContent value="noticias" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Panel de Noticias</h1>
              <Button asChild>
                <Link href="/admin/noticias/crear">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Noticia
                </Link>
              </Button>
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
                    onMoveUp={moveArticleUp}
                    onMoveDown={moveArticleDown}
                    onTogglePublished={togglePublished}
                    onDelete={deleteArticle}
                    isFirst={true}
                    isLast={false}
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
                      onMoveUp={moveArticleUp}
                      onMoveDown={moveArticleDown}
                      onTogglePublished={togglePublished}
                      onDelete={deleteArticle}
                      isFirst={false}
                      isLast={false}
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
                      onMoveUp={moveArticleUp}
                      onMoveDown={moveArticleDown}
                      onTogglePublished={togglePublished}
                      onDelete={deleteArticle}
                      isFirst={false}
                      isLast={false}
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
                  <Badge variant="secondary">{articles.length - 14}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {articles.length <= 14 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay noticias en el repositorio
                  </p>
                ) : (
                  <div className="space-y-2">
                    {articles.slice(14).map((article) => (
                      <ArticleRow
                        key={article.id}
                        article={article}
                        onMoveUp={moveArticleUp}
                        onMoveDown={moveArticleDown}
                        onTogglePublished={togglePublished}
                        onDelete={deleteArticle}
                        isFirst={false}
                        isLast={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Necrológicas Tab */}
          <TabsContent value="necrologicas">
            <ObituariesManager />
          </TabsContent>

          {/* Farmacias Tab */}
          <TabsContent value="farmacias">
            <PharmaciesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
