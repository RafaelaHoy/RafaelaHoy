"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LogOut, Plus, Pencil, Trash2, FileText, Eye, EyeOff, Star, Settings, ChevronUp, ChevronDown, Cross, MapPin } from "lucide-react"
import Link from "next/link"
import { ServicesManagementSection } from "./services-management-section"
import { ObituariesManager } from "./obituaries-manager"
import { PharmaciesManager } from "./pharmacies-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  category_id: string
  is_published: boolean
  is_featured: boolean
  image_url: string
  slug: string
  sort_order: number
  created_at: string
  updated_at: string
  published_at: string
  categories?: {
    name: string
  }
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

export function AdminDashboard({ articles: initialArticles, categories }: AdminDashboardProps) {
  const [articles, setArticles] = useState(initialArticles)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const deleteArticle = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId)

    if (!error) {
      setArticles(articles.filter((article) => article.id !== articleId))
    }
  }

  const moveArticle = async (articleId: string, direction: "up" | "down") => {
    const currentIndex = articles.findIndex(a => a.id === articleId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= articles.length) return

    const reorderedArticles = [...articles]
    const [movedArticle] = reorderedArticles.splice(currentIndex, 1)
    reorderedArticles.splice(newIndex, 0, movedArticle)

    // Update sort_order in database
    const supabase = createClient()
    for (let i = 0; i < reorderedArticles.length; i++) {
      await supabase
        .from("articles")
        .update({ sort_order: i })
        .eq("id", reorderedArticles[i].id)
    }

    setArticles(reorderedArticles)
  }

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

      <main className="max-w-7xl mx-auto px-4 py-6">
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

          {/* Noticias Tab */}
          <TabsContent value="noticias" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestión de Noticias</h2>
              <Button asChild>
                <Link href="/admin/noticias/crear">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo artículo
                </Link>
              </Button>
            </div>

            {/* Articles Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Título</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Orden</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay artículos creados aún.
                        </TableCell>
                      </TableRow>
                    ) : (
                      articles.map((article, index) => (
                        <TableRow key={article.id}>
                          <TableCell>
                            <div className="max-w-md">
                              <p className="font-medium truncate">{article.title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {article.excerpt}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {article.categories ? (
                              <Badge variant="secondary">
                                {article.categories.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Sin categoría</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(article.published_at || article.created_at).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveArticle(article.id, "up")}
                                disabled={index === 0}
                                className="h-8 w-8"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveArticle(article.id, "down")}
                                disabled={index === articles.length - 1}
                                className="h-8 w-8"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8"
                              >
                                <Link href={`/admin/noticias/editar/${article.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
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
          </TabsContent>

          {/* Necrológicas Tab */}
          <TabsContent value="necrologicas" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestión de Necrológicas</h2>
            </div>
            <ObituariesManager />
          </TabsContent>

          {/* Farmacias Tab */}
          <TabsContent value="farmacias" className="space-y-6">
            <PharmaciesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
