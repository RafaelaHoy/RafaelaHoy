"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LogOut, Plus, Pencil, Trash2, FileText, Eye, EyeOff, Star, ChevronUp, ChevronDown, Settings } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ServicesManagementSection } from "./services-management-section"
import { MediaManager } from "./media-manager"
import { ObituariesManager } from "./obituaries-manager"

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  alt_text?: string
  caption?: string
  sort_order: number
}

interface Article {
  id: string
  title: string
  slug: string
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  created_at: string
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
  userEmail: string
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function AdminDashboard({ articles: initialArticles, categories, userEmail }: AdminDashboardProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentMedia, setCurrentMedia] = useState<MediaItem[]>([])
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isPublished, setIsPublished] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)

  const resetForm = () => {
    setTitle("")
    setContent("")
    setExcerpt("")
    setImageUrl("")
    setCategoryId("")
    setIsPublished(true)
    setIsFeatured(false)
    setEditingArticle(null)
    setCurrentMedia([])
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const loadArticleMedia = async (articleId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('article_media')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setCurrentMedia(data)
    }
  }

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const slug = generateSlug(title)

      const { data, error } = await supabase
        .from("articles")
        .insert({
          title,
          content,
          excerpt: excerpt || null,
          image_url: imageUrl || null,
          category_id: categoryId || null,
          is_published: isPublished,
          is_featured: isFeatured,
          slug,
          sort_order: 0,
        })
        .select(`
          id,
          title,
          slug,
          is_published,
          is_featured,
          published_at,
          created_at,
          sort_order,
          categories (
            name,
            slug
          )
        `)
        .single()

      if (error) throw error

      setArticles([data as Article, ...articles])
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error creating article:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("articles")
        .update({
          title,
          content,
          excerpt: excerpt || null,
          image_url: imageUrl || null,
          category_id: categoryId || null,
          is_published: isPublished,
          is_featured: isFeatured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingArticle!.id)
        .select(`
          id,
          title,
          slug,
          is_published,
          is_featured,
          published_at,
          created_at,
          sort_order,
          categories (
            name,
            slug
          )
        `)
        .single()

      if (error) throw error

      setArticles(
        articles.map((article) =>
          article.id === editingArticle!.id ? data as Article : article
        )
      )
      setEditingArticle(null)
      resetForm()
    } catch (error) {
      console.error("Error updating article:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePublished = async (id: string, published: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("articles")
        .update({ is_published: published, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      setArticles(
        articles.map((article) =>
          article.id === id ? { ...article, is_published: published } : article
        )
      )
    } catch (error) {
      console.error("Error toggling published:", error)
    }
  }

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("articles")
        .update({ is_featured: featured, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      setArticles(
        articles.map((article) =>
          article.id === id ? { ...article, is_featured: featured } : article
        )
      )
    } catch (error) {
      console.error("Error toggling featured:", error)
    }
  }

  const moveArticle = async (id: string, direction: "up" | "down") => {
    try {
      const supabase = createClient()
      const article = articles.find((a) => a.id === id)
      if (!article) return

      const currentIndex = articles.findIndex((a) => a.id === id)
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
      
      if (newIndex < 0 || newIndex >= articles.length) return

      const { error } = await supabase
        .from("articles")
        .update({ sort_order: newIndex, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      const newArticles = [...articles]
      const [movedArticle] = newArticles.splice(currentIndex, 1)
      newArticles.splice(newIndex, 0, movedArticle)
      setArticles(newArticles)
    } catch (error) {
      console.error("Error moving article:", error)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este artículo?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id)

      if (error) throw error

      setArticles(articles.filter((article) => article.id !== id))
    } catch (error) {
      console.error("Error deleting article:", error)
    }
  }

  const openEditDialog = async (article: Article) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article.id)
      .single()

    if (data) {
      setTitle(data.title)
      setContent(data.content)
      setExcerpt(data.excerpt || "")
      setImageUrl(data.image_url || "")
      setCategoryId(data.category_id || "")
      setIsPublished(data.is_published)
      setIsFeatured(data.is_featured)
      setEditingArticle(article)
      
      // Load media for this article
      await loadArticleMedia(article.id)
    }
  }

  const publishedCount = articles.filter((a) => a.is_published).length
  const draftCount = articles.filter((a) => !a.is_published).length
  const featuredCount = articles.filter((a) => a.is_featured).length

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
            <span className="text-sm text-white/70">{userEmail}</span>
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{articles.length}</div>
              <p className="text-sm text-muted-foreground">Total de artículos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
              <p className="text-sm text-muted-foreground">Publicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{draftCount}</div>
              <p className="text-sm text-muted-foreground">Borradores</p>
            </CardContent>
          </Card>
        </div>

        {/* Noticias Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Noticias
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver sitio
                </Link>
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo artículo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear nuevo artículo</DialogTitle>
                    <DialogDescription>
                      Completa los campos para crear una nueva noticia.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateArticle} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Extracto</Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Imagen principal (URL)</Label>
                      <Input
                        id="image_url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isPublished"
                          checked={isPublished}
                          onCheckedChange={setIsPublished}
                        />
                        <Label htmlFor="isPublished">Publicado</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isFeatured"
                          checked={isFeatured}
                          onCheckedChange={setIsFeatured}
                        />
                        <Label htmlFor="isFeatured">Destacar</Label>
                      </div>
                    </div>

                    {/* Media Manager */}
                    <MediaManager
                      articleId={null}
                      mediaItems={currentMedia}
                      onMediaChange={setCurrentMedia}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creando..." : "Crear artículo"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Articles Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Título</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No hay artículos. Crea el primero.
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/noticia/${article.slug}`}
                            className="hover:text-primary transition-colors"
                            target="_blank"
                          >
                            {article.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {article.categories ? (
                            <Badge variant="secondary">{article.categories.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {article.is_published ? (
                              <Badge className="bg-green-100 text-green-800">Publicado</Badge>
                            ) : (
                              <Badge variant="secondary">Borrador</Badge>
                            )}
                            {article.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">Destacado</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(article.published_at || article.created_at).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(article)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFeatured(article.id, !article.is_featured)}
                              className="h-8 w-8"
                            >
                              {article.is_featured ? (
                                <Star className="h-4 w-4 fill-current text-primary" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePublished(article.id, !article.is_published)}
                              className="h-8 w-8"
                            >
                              {article.is_published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteArticle(article.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Servicios Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Servicios
            </h1>
          </div>
          <ServicesManagementSection />
        </section>

        {/* Obituaries Section */}
        <section>
          <ObituariesManager />
        </section>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar artículo</DialogTitle>
            <DialogDescription>
              Modifica los campos del artículo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateArticle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-excerpt">Extracto</Label>
              <Textarea
                id="edit-excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image_url">Imagen principal (URL)</Label>
              <Input
                id="edit-image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="edit-isPublished">Publicado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isFeatured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <Label htmlFor="edit-isFeatured">Destacar</Label>
              </div>
            </div>

            {/* Media Manager */}
            <MediaManager
              articleId={editingArticle?.id}
              mediaItems={currentMedia}
              onMediaChange={setCurrentMedia}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingArticle(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
