"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Logo } from '@/components/logo'
import { LogOut, Plus, Edit, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Cross, MapPin, FileText } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'
import { DraggableArticleRow } from './draggable-article-row'
import { ObituariesManager } from "./obituaries-manager"
import { PharmaciesManager } from "./pharmacies-manager"

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
  home_location?: string
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

  // FUNCIÓN DE RE-INDEXACIÓN GLOBAL (El Corazón del Sistema)
  const reorderAllArticlesDashboard = async (supabase: any) => {
    try {
      console.log("=== RE-INDEXACIÓN GLOBAL DASHBOARD INICIADA ===")
      
      // 1. Traer TODAS las noticias publicadas ordenadas por sort_order actual
      const { data: allArticles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      if (!allArticles || allArticles.length === 0) {
        console.log("No hay noticias para re-indexar")
        return
      }
      
      console.log(`Re-indexando ${allArticles.length} noticias`)
      
      // 2. Recorrer y asignar nuevo sort_order secuencial estricto
      const reorderPromises = allArticles.map(async (article, index) => {
        const newSortOrder = index // 0, 1, 2, 3, 4...
        
        // Asignar home_location basándose únicamente en la nueva posición
        let newHomeLocation = 'repositorio'
        let newIsFeatured = false
        
        if (newSortOrder === 0) {
          newHomeLocation = 'principal'
          newIsFeatured = true
        } else if (newSortOrder >= 1 && newSortOrder <= 3) {
          newHomeLocation = 'destacada'
          newIsFeatured = true
        } else if (newSortOrder >= 4 && newSortOrder <= 13) {
          newHomeLocation = 'ultimas'
          newIsFeatured = false
        } else {
          newHomeLocation = 'repositorio'
          newIsFeatured = false
        }
        
        console.log(`Re-indexando: "${article.title}" ${article.sort_order} -> ${newSortOrder} (${newHomeLocation})`)
        
        return supabase
          .from('articles')
          .update({ 
            sort_order: newSortOrder,
            home_location: newHomeLocation,
            is_featured: newIsFeatured
          })
          .eq('id', article.id)
      })
      
      // 3. Ejecutar todas las actualizaciones en paralelo
      await Promise.all(reorderPromises)
      
      console.log("=== RE-INDEXACIÓN GLOBAL DASHBOARD COMPLETADA ===")
      
    } catch (error) {
      console.error('Error en re-indexación global dashboard:', error)
      throw error
    }
  }

  // Funciones de Drag & Drop con RE-INDEXACIÓN GLOBAL
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeArticle = articles.find(a => a.id === activeId)
    if (!activeArticle) return

    // Determinar la sección de destino basado en el overId
    let targetSection = ''
    let targetSortOrder = 0

    // Si overId es un artículo, obtener su sección y posición
    const overArticle = articles.find(a => a.id === overId)
    if (overArticle) {
      targetSection = getHomeLocationFromOrder(overArticle.sort_order)
      targetSortOrder = overArticle.sort_order
    } else {
      // Si overId es una sección, determinar la sección y el primer sort_order disponible
      if (overId.includes('principal')) {
        targetSection = 'principal'
        targetSortOrder = 0
      } else if (overId.includes('destacada')) {
        targetSection = 'destacada'
        targetSortOrder = 1
      } else if (overId.includes('ultimas')) {
        targetSection = 'ultimas'
        targetSortOrder = 4
      } else if (overId.includes('repositorio')) {
        targetSection = 'repositorio'
        // Encontrar el siguiente sort_order disponible en repositorio (14+)
        const existingRepositorio = articles
          .filter(a => a.sort_order >= 14)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        targetSortOrder = existingRepositorio.length > 0 
          ? existingRepositorio[existingRepositorio.length - 1].sort_order + 1 
          : 14
      }
    }

    try {
      console.log(`=== DRAG & DROP CON RE-INDEXACIÓN GLOBAL ===`)
      console.log(`Moviendo "${activeArticle.title}" de orden ${activeArticle.sort_order} a orden ${targetSortOrder} (${targetSection})`)
      
      // Solo mover si la posición es diferente
      if (activeArticle.sort_order !== targetSortOrder) {
        const supabase = createClient()
        
        // 1. MOVER NOTICIA ACTIVA a su nueva posición
        const newIsFeatured = targetSection === 'principal' || targetSection === 'destacada'
        
        await supabase
          .from("articles")
          .update({ 
            sort_order: targetSortOrder,
            home_location: targetSection,
            is_featured: newIsFeatured
          })
          .eq("id", activeArticle.id)
        
        console.log(`Movida "${activeArticle.title}" a orden ${targetSortOrder}`)
        
        // 2. DISPARAR RE-INDEXACIÓN GLOBAL para cerrar huecos y empujar al resto
        console.log("Disparando re-indexación global después de drag & drop...")
        await reorderAllArticlesDashboard(supabase)
        
        console.log("=== DRAG & DROP CON RE-INDEXACIÓN COMPLETADO ===")
      }
      
      // Recargar para reflejar cambios
      window.location.reload()
      
    } catch (error) {
      console.error("Error moviendo artículo:", error)
      alert("Error al mover la noticia")
    }
  }

  // Función para auto-rellenar secciones cuando faltan noticias
  const autoFillSections = async () => {
    try {
      console.log("=== AUTO-RELLENANDO SECCIONES ===")
      
      // 1. Verificar y rellenar sección principal
      const mainArticle = articles.find(a => a.sort_order === 0)
      if (!mainArticle) {
        // Buscar primera destacada para subir a principal
        const firstFeatured = articles
          .filter(a => a.sort_order >= 1 && a.sort_order <= 3)
          .sort((a, b) => a.sort_order - b.sort_order)[0]
        
        if (firstFeatured) {
          await createClient()
            .from("articles")
            .update({ 
              sort_order: 0,
              home_location: 'principal',
              is_featured: true
            })
            .eq("id", firstFeatured.id)
          
          console.log("Movido a principal:", firstFeatured.title)
        }
      }
      
      // 2. Verificar y rellenar sección destacadas (deben ser 3)
      const featuredArticles = articles
        .filter(a => a.sort_order >= 1 && a.sort_order <= 3)
        .sort((a, b) => a.sort_order - b.sort_order)
      
      if (featuredArticles.length < 3) {
        const neededCount = 3 - featuredArticles.length
        const latestArticles = articles
          .filter(a => a.sort_order >= 4 && a.sort_order <= 13)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        for (let i = 0; i < neededCount && i < latestArticles.length; i++) {
          const articleToMove = latestArticles[i]
          const newOrder = featuredArticles.length + i + 1
          
          await createClient()
            .from("articles")
            .update({ 
              sort_order: newOrder,
              home_location: 'destacada',
              is_featured: true
            })
            .eq("id", articleToMove.id)
          
          console.log("Movido a destacadas:", articleToMove.title, "orden:", newOrder)
        }
      }
      
      // 3. Verificar y rellenar sección últimas noticias (deben ser 10)
      const latestArticles = articles
        .filter(a => a.sort_order >= 4 && a.sort_order <= 13)
        .sort((a, b) => a.sort_order - b.sort_order)
      
      if (latestArticles.length < 10) {
        const neededCount = 10 - latestArticles.length
        const repoArticles = articles
          .filter(a => a.sort_order >= 14)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        for (let i = 0; i < neededCount && i < repoArticles.length; i++) {
          const articleToMove = repoArticles[i]
          const newOrder = latestArticles.length + i + 4
          
          await createClient()
            .from("articles")
            .update({ 
              sort_order: newOrder,
              home_location: 'ultimas',
              is_featured: false
            })
            .eq("id", articleToMove.id)
          
          console.log("Movido a últimas:", articleToMove.title, "orden:", newOrder)
        }
      }
      
      // 4. Reordenar todas las secciones para mantener consistencia
      await reorganizeAllSections()
      
      console.log("Auto-rellenado completado")
    } catch (error) {
      console.error("Error en auto-rellenado:", error)
    }
  }

  // Función para reorganizar todas las secciones completamente
  const reorganizeAllSections = async () => {
    try {
      // Obtener todas las noticias publicadas
      const { data: allArticles } = await createClient()
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
      
      if (!allArticles) return
      
      // Separar por secciones actuales
      const main = allArticles.filter(a => a.sort_order === 0)
      const featured = allArticles.filter(a => a.sort_order >= 1 && a.sort_order <= 3)
      const latest = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13)
      const repo = allArticles.filter(a => a.sort_order >= 14)
      
      // Asignar órdenes correctos a principales
      if (main.length > 0) {
        await createClient()
          .from("articles")
          .update({ sort_order: 0, home_location: 'principal', is_featured: true })
          .eq("id", main[0].id)
      }
      
      // Asignar órdenes correctos a destacadas (máximo 3)
      const featuredToUpdate = featured.slice(0, 3)
      for (let i = 0; i < featuredToUpdate.length; i++) {
        await createClient()
          .from("articles")
          .update({ sort_order: i + 1, home_location: 'destacada', is_featured: true })
          .eq("id", featuredToUpdate[i].id)
      }
      
      // Asignar órdenes correctos a últimas (máximo 10)
      const latestToUpdate = latest.slice(0, 10)
      for (let i = 0; i < latestToUpdate.length; i++) {
        await createClient()
          .from("articles")
          .update({ sort_order: i + 4, home_location: 'ultimas', is_featured: false })
          .eq("id", latestToUpdate[i].id)
      }
      
      // Asignar órdenes correctos a repositorio (desde 14 en adelante)
      const repoToUpdate = repo
      for (let i = 0; i < repoToUpdate.length; i++) {
        await createClient()
          .from("articles")
          .update({ sort_order: i + 14, home_location: 'repositorio', is_featured: false })
          .eq("id", repoToUpdate[i].id)
      }
      
      console.log("Reorganización completada")
    } catch (error) {
      console.error("Error en reorganización:", error)
    }
  }

  // Función para reordenar noticias al eliminar una
  const handleDeleteArticle = async (articleId: string, currentSortOrder: number) => {
    try {
      console.log("=== ELIMINANDO NOTICIA ===")
      console.log("Noticia eliminada ID:", articleId)
      console.log("Orden actual:", currentSortOrder)
      
      // 1. Eliminar la noticia
      await createClient()
        .from("articles")
        .delete()
        .eq("id", articleId)
      
      // 2. Reordenar todas las noticias según el orden eliminado
      if (currentSortOrder === 0) {
        // Si se eliminó la principal, mover la primera destacada a principal
        const firstFeatured = articles.find(a => a.sort_order >= 1 && a.sort_order <= 3)
        if (firstFeatured) {
          await createClient()
            .from("articles")
            .update({ 
              sort_order: 0,
              home_location: 'principal',
              is_featured: true
            })
            .eq("id", firstFeatured.id)
          
          // Mover las demás destacadas hacia arriba
          const otherFeatured = articles
            .filter(a => a.sort_order >= 1 && a.sort_order <= 3 && a.id !== firstFeatured.id)
            .sort((a, b) => a.sort_order - b.sort_order)
          
          for (let i = 0; i < otherFeatured.length; i++) {
            await createClient()
              .from("articles")
              .update({ sort_order: i + 1 })
              .eq("id", otherFeatured[i].id)
          }
          
          // Mover la primera de últimas a destacadas
          const firstLatest = articles.find(a => a.sort_order >= 4 && a.sort_order <= 13)
          if (firstLatest) {
            await createClient()
              .from("articles")
              .update({ 
                sort_order: 3,
                home_location: 'destacada',
                is_featured: true
              })
              .eq("id", firstLatest.id)
            
            // Mover las demás últimas hacia arriba
            const otherLatest = articles
              .filter(a => a.sort_order >= 4 && a.sort_order <= 13 && a.id !== firstLatest.id)
              .sort((a, b) => a.sort_order - b.sort_order)
            
            for (let i = 0; i < otherLatest.length; i++) {
              await createClient()
                .from("articles")
                .update({ sort_order: i + 4 })
                .eq("id", otherLatest[i].id)
            }
          }
        }
      } else if (currentSortOrder >= 1 && currentSortOrder <= 3) {
        // Si se eliminó una destacada, mover las demás destacadas hacia arriba
        const featuredArticles = articles
          .filter(a => a.sort_order >= 1 && a.sort_order <= 3 && a.id !== articleId)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        for (let i = 0; i < featuredArticles.length; i++) {
          await createClient()
            .from("articles")
            .update({ sort_order: i + 1 })
            .eq("id", featuredArticles[i].id)
        }
        
        // Mover la primera de últimas a destacadas si hay espacio
        if (featuredArticles.length < 3) {
          const firstLatest = articles.find(a => a.sort_order >= 4 && a.sort_order <= 13)
          if (firstLatest) {
            await createClient()
              .from("articles")
              .update({ 
                sort_order: featuredArticles.length + 1,
                home_location: 'destacada',
                is_featured: true
              })
              .eq("id", firstLatest.id)
            
            // Mover las demás últimas hacia arriba
            const otherLatest = articles
              .filter(a => a.sort_order >= 4 && a.sort_order <= 13 && a.id !== firstLatest.id)
              .sort((a, b) => a.sort_order - b.sort_order)
            
            for (let i = 0; i < otherLatest.length; i++) {
              await createClient()
                .from("articles")
                .update({ sort_order: i + 4 })
                .eq("id", otherLatest[i].id)
            }
          }
        }
      } else if (currentSortOrder >= 4 && currentSortOrder <= 13) {
        // Si se eliminó una de últimas, mover las demás últimas hacia arriba
        const latestArticles = articles
          .filter(a => a.sort_order >= 4 && a.sort_order <= 13 && a.id !== articleId)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        for (let i = 0; i < latestArticles.length; i++) {
          await createClient()
            .from("articles")
            .update({ sort_order: i + 4 })
            .eq("id", latestArticles[i].id)
        }
        
        // Mover la primera del repositorio a últimas si hay espacio
        if (latestArticles.length < 10) {
          const firstRepo = articles.find(a => a.sort_order >= 14)
          if (firstRepo) {
            await createClient()
              .from("articles")
              .update({ 
                sort_order: latestArticles.length + 4,
                home_location: 'ultimas',
                is_featured: false
              })
              .eq("id", firstRepo.id)
          }
        }
      }
      
      console.log("Reordenamiento completado")
      
      // Auto-rellenar secciones para mantener cantidades correctas
      await autoFillSections()
      
      alert("Noticia eliminada y secciones reajustadas correctamente")
      window.location.reload()
    } catch (error) {
      console.error("Error eliminando noticia:", error)
      alert("Error al eliminar la noticia")
    }
  }

  const handleMoveToSection = async (articleId: string, targetSection: string) => {
    const article = articles.find(a => a.id === articleId)
    if (!article) return

    let newSortOrder = 999 // Por defecto repositorio
    let newIsFeatured = false

    switch (targetSection) {
      case "principal":
        newSortOrder = 0
        newIsFeatured = true
        break
      case "destacada":
        // Encontrar el siguiente sort_order disponible (1-3)
        const existingFeatured = articles
          .filter(a => a.is_featured && a.sort_order >= 1 && a.sort_order <= 3 && a.id !== articleId)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        // Si ya hay 3 noticias destacadas, mover la más antigua a últimas noticias
        if (existingFeatured.length >= 3) {
          const oldestFeatured = existingFeatured[0]
          
          // Encontrar el siguiente orden disponible en últimas noticias (4-13)
          const existingLatest = articles
            .filter(a => !a.is_featured && a.sort_order >= 4 && a.sort_order <= 13)
            .sort((a, b) => a.sort_order - b.sort_order)
          
          let nextLatestOrder = 4
          for (let i = 4; i <= 13; i++) {
            if (!existingLatest.find(a => a.sort_order === i)) {
              nextLatestOrder = i
              break
            }
          }
          
          // Mover la noticia destacada más antigua a últimas noticias
          await createClient()
            .from("articles")
            .update({ 
              sort_order: nextLatestOrder,
              home_location: 'ultimas',
              is_featured: false
            })
            .eq("id", oldestFeatured.id)
        }
        
        // Encontrar el siguiente disponible
        for (let i = 1; i <= 3; i++) {
          if (!existingFeatured.find(a => a.sort_order === i)) {
            newSortOrder = i
            break
          }
        }
        newIsFeatured = true
        break
      case "ultimas":
        // Encontrar el siguiente sort_order disponible (4-13)
        const existingLatest = articles
          .filter(a => !a.is_featured && a.sort_order >= 4 && a.sort_order <= 13 && a.id !== articleId)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        if (existingLatest.length >= 10) {
          // Mover el más antiguo al repositorio
          const oldest = existingLatest[0]
          await createClient()
            .from("articles")
            .update({ 
              sort_order: 999,
              home_location: 'repositorio'
            })
            .eq("id", oldest.id)
        }
        
        // Encontrar el siguiente disponible
        for (let i = 4; i <= 13; i++) {
          if (!existingLatest.find(a => a.sort_order === i)) {
            newSortOrder = i
            break
          }
        }
        break
      case "repositorio":
        // Para el repositorio, asignar un sort_order alto (>= 14)
        const existingRepositorio = articles
          .filter(a => a.sort_order >= 14)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        newSortOrder = existingRepositorio.length > 0 
          ? existingRepositorio[existingRepositorio.length - 1].sort_order + 1 
          : 14
        break
    }

    try {
      await createClient()
        .from("articles")
        .update({ 
          sort_order: newSortOrder,
          is_featured: newIsFeatured,
          home_location: targetSection
        })
        .eq("id", articleId)

      // Actualizar estado local
      const newArticles = articles.map(a => 
        a.id === articleId 
          ? { ...a, sort_order: newSortOrder, is_featured: newIsFeatured, home_location: targetSection }
          : a
      )
      newArticles.sort((a, b) => a.sort_order - b.sort_order)
      setArticles(newArticles)
    } catch (error) {
      console.error("Error moviendo artículo a sección:", error)
      alert("Error al mover la noticia a la sección")
    }
  }

  const getHomeLocationFromOrder = (sortOrder: number): string => {
    if (sortOrder === 0) return "principal"
    if (sortOrder >= 1 && sortOrder <= 3) return "destacada"
    if (sortOrder >= 4 && sortOrder <= 13) return "ultimas"
    return "repositorio"
  }

  // Función para diagnosticar y corregir órdenes de noticias destacadas por BLOQUES
  const fixFeaturedArticlesOrder = async () => {
    try {
      // 1. Obtener todas las noticias publicadas ordenadas por sort_order
      const { data: allArticles, error } = await createClient()
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })

      if (error) throw error

      // 2. Analizar estado actual por BLOQUES
      const currentFeatured = allArticles.filter(a => a.sort_order >= 1 && a.sort_order <= 3)
      const currentLatest = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13)
      const currentRepository = allArticles.filter(a => a.sort_order >= 14)

      console.log("=== ANÁLISIS POR BLOQUES ===")
      console.log("Bloque Destacadas (1-3):", currentFeatured.length, "noticias")
      console.log("Bloque Últimas (4-13):", currentLatest.length, "noticias") 
      console.log("Bloque Repositorio (14+):", currentRepository.length, "noticias")
      
      console.log("Noticias en destacadas:", currentFeatured.map(a => `ID:${a.id}, Orden:${a.sort_order}, Título:"${a.title}"`))

      // 3. Si faltan noticias en el bloque destacadas (1, 2, 3)
      if (currentFeatured.length < 3) {
        const needed = 3 - currentFeatured.length
        
        // 4. Tomar noticias del repositorio o últimas (prioridad: últimas primero)
        const availableForPromotion = [...currentLatest, ...currentRepository].slice(0, needed)
        
        if (availableForPromotion.length === 0) {
          alert("No hay noticias disponibles para promover a destacadas")
          return
        }

        console.log(`Necesito ${needed} noticias para el bloque destacadas`)
        console.log("Promocionando:", availableForPromotion.map(a => `${a.title} (orden ${a.sort_order})`))

        // 5. Identificar órdenes disponibles en el bloque 1-3
        const usedOrders = currentFeatured.map(a => a.sort_order)
        const availableOrders = [1, 2, 3].filter(order => !usedOrders.includes(order))
        
        console.log("Órdenes disponibles:", availableOrders)

        // 6. Asignar las noticias a los órdenes disponibles
        for (let i = 0; i < availableForPromotion.length && i < availableOrders.length; i++) {
          const article = availableForPromotion[i]
          const newOrder = availableOrders[i]

          await createClient()
            .from("articles")
            .update({
              sort_order: newOrder,
              home_location: "destacada",
              is_featured: true
            })
            .eq("id", article.id)

          console.log(`Moviendo "${article.title}" al bloque destacadas con orden ${newOrder}`)
        }

        // 7. Refrescar los artículos
        alert("¡Corrección completada! La página se recargará.")
        window.location.reload()
      } else {
        alert("El bloque destacadas ya tiene 3 noticias. No se necesita corrección.")
      }
    } catch (error) {
      console.error("Error corrigiendo órdenes:", error)
      alert("Error al corregir los órdenes de las noticias")
    }
  }

  // Función para agregar las noticias faltantes en últimas noticias (órdenes 6 y 7)
  const addMissingLatestArticles = async () => {
    try {
      // 1. Obtener todas las noticias publicadas ordenadas por sort_order
      const { data: allArticles, error } = await createClient()
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })

      if (error) throw error

      // 2. Analizar estado actual
      const currentLatest = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13)
      const currentRepository = allArticles.filter(a => a.sort_order >= 14)

      console.log("=== ANÁLISIS DE ÚLTIMAS NOTICIAS ===")
      console.log("Noticias en Últimas (4-13):", currentLatest.length)
      console.log("Noticias en Repositorio (14+):", currentRepository.length)
      
      // 3. Identificar qué órdenes faltan en últimas noticias (6 y 7)
      const usedOrders = currentLatest.map(a => a.sort_order)
      const missingOrders = [6, 7].filter(order => !usedOrders.includes(order))
      
      console.log("Órdenes usados en últimas:", usedOrders)
      console.log("Órdenes faltantes:", missingOrders)

      if (missingOrders.length > 0 && currentRepository.length >= missingOrders.length) {
        // 4. Tomar las primeras noticias del repositorio
        const toPromote = currentRepository.slice(0, missingOrders.length)
        
        console.log("Promocionando desde repositorio:", toPromote.map(a => `${a.title} (orden ${a.sort_order})`))

        // 5. Mover las noticias a los órdenes faltantes
        for (let i = 0; i < toPromote.length; i++) {
          const article = toPromote[i]
          const newOrder = missingOrders[i]

          await createClient()
            .from("articles")
            .update({
              sort_order: newOrder,
              home_location: "ultimas",
              is_featured: false
            })
            .eq("id", article.id)

          console.log(`Moviendo "${article.title}" a últimas noticias con orden ${newOrder}`)
        }

        // 6. Refrescar los artículos
        alert("¡Se agregaron las noticias faltantes! La página se recargará.")
        window.location.reload()
      } else {
        if (missingOrders.length === 0) {
          alert("No faltan noticias en últimas noticias (órdenes 6 y 7)")
        } else {
          alert("No hay suficientes noticias en el repositorio para agregar")
        }
      }
    } catch (error) {
      console.error("Error agregando noticias faltantes:", error)
      alert("Error al agregar las noticias faltantes")
    }
  }

  // Función para corregir el orden de todas las noticias del repositorio (desplazar hacia abajo)
  const fixRepositoryFirstOrder = async () => {
    try {
      // 1. Obtener todas las noticias del repositorio (órdenes >= 16)
      const { data: repositoryArticles, error } = await createClient()
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .gte("sort_order", 16)
        .order("sort_order", { ascending: true })

      if (error) throw error

      if (repositoryArticles && repositoryArticles.length > 0) {
        console.log("=== CORRECCIÓN COMPLETA REPOSITORIO ===")
        console.log("Noticias del repositorio a desplazar:", repositoryArticles.length)
        console.log("Primera noticia:", repositoryArticles[0].title, "(orden:", repositoryArticles[0].sort_order, ")")
        
        // 2. Verificar si ya existe una noticia con orden 14
        const { data: existingOrder14 } = await createClient()
          .from("articles")
          .select("*")
          .eq("sort_order", 14)
          .single()

        if (existingOrder14) {
          alert("Ya existe una noticia con orden 14. No se puede realizar la corrección.")
          return
        }

        // 3. Desplazar todas las noticias del repositorio hacia abajo
        for (let i = 0; i < repositoryArticles.length; i++) {
          const article = repositoryArticles[i]
          const currentOrder = article.sort_order
          const newOrder = currentOrder - 2 // 16→14, 17→15, 18→16, etc.

          await createClient()
            .from("articles")
            .update({
              sort_order: newOrder,
              home_location: "repositorio"
            })
            .eq("id", article.id)

          console.log(`Moviendo "${article.title}" de orden ${currentOrder} a orden ${newOrder}`)
        }
        
        alert("¡Corrección completada! Todas las noticias del repositorio fueron desplazadas. La página se recargará.")
        window.location.reload()
      } else {
        alert("No hay noticias en el repositorio para corregir.")
      }
    } catch (error) {
      console.error("Error corrigiendo orden del repositorio:", error)
      alert("Error al corregir el orden del repositorio")
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

  // Eliminar artículo con reordenamiento automático
  const deleteArticle = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta noticia?")) return

    // Encontrar el sort_order actual del artículo
    const article = articles.find(a => a.id === articleId)
    if (!article) return

    // Usar la nueva función con reordenamiento
    await handleDeleteArticle(articleId, article.sort_order)
  }

  // Organizar artículos según la estructura de la Home por BLOQUES
  const mainFeaturedArticle = articles.find(a => a.sort_order === 0)
  const secondaryFeaturedArticles = articles
    .filter(a => a.sort_order >= 1 && a.sort_order <= 3)
    .sort((a, b) => a.sort_order - b.sort_order)
  const latestArticles = articles
    .filter(a => a.sort_order >= 4 && a.sort_order <= 13)
    .sort((a, b) => a.sort_order - b.sort_order)
  const repositoryArticles = articles
    .filter(a => a.sort_order >= 14)
    .sort((a, b) => a.sort_order - b.sort_order)

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
              <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Gestión de Noticias</h2>
            </div>
              <Button asChild>
                <Link href="/admin/noticias/crear">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Noticia
                </Link>
              </Button>
            </div>

            {/* Sistema Drag & Drop para Noticias */}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {/* Bloque 1: Noticia Principal */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-600">
                      Noticia Principal
                      <Badge variant="secondary">{mainFeaturedArticle ? 1 : 0}</Badge>
                      <Badge variant="outline">1/1</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Área de destino para arrastrar */}
                    <div
                      id="principal-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para hacerla principal</p>
                    </div>
                    
                    {mainFeaturedArticle ? (
                      <DraggableArticleRow
                        key={`main-${mainFeaturedArticle.id}-${mainFeaturedArticle.sort_order}`}
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
                      <Badge variant={secondaryFeaturedArticles.length >= 3 ? "destructive" : "outline"}>
                        {secondaryFeaturedArticles.length}/3
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Área de destino para arrastrar */}
                    <div
                      id="destacada-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para hacerla destacada</p>
                    </div>
                    
                    {secondaryFeaturedArticles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay noticias destacadas
                      </p>
                    ) : (
                      secondaryFeaturedArticles.map((article) => (
                      <DraggableArticleRow
                        key={`featured-${article.id}-${article.sort_order}`}
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
                      <Badge variant={latestArticles.length >= 10 ? "destructive" : "outline"}>
                        {latestArticles.length}/10
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Área de destino para arrastrar */}
                    <div
                      id="ultimas-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para agregarla a últimas noticias</p>
                    </div>
                    
                    {latestArticles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay últimas noticias
                      </p>
                    ) : (
                      latestArticles.map((article) => (
                        <DraggableArticleRow
                          key={`latest-${article.id}-${article.sort_order}`}
                          article={article}
                          onTogglePublished={togglePublished}
                          onDelete={deleteArticle}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Bloque 4: Repositorio General */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      Repositorio General
                      <Badge variant="secondary">{articles.filter(a => a.sort_order >= 16).length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Área de destino para arrastrar */}
                    <div
                      id="repositorio-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para moverla al repositorio</p>
                    </div>
                    
                    {repositoryArticles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No hay noticias en el repositorio
                      </p>
                    ) : (
                      repositoryArticles.map((article) => (
                      <DraggableArticleRow
                        key={`repo-${article.id}-${article.sort_order}`}
                        article={article}
                        onTogglePublished={togglePublished}
                        onDelete={deleteArticle}
                      />
                    ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </DndContext>
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
