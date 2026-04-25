"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fixSortOrders } from '@/lib/sort-order-utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { LogOut, Plus, Edit, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Cross, MapPin, FileText, Search } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'
import { DraggableArticleRow } from './draggable-article-row'
import { ObituariesManager } from "./obituaries-manager"
import { PharmaciesManager } from "./pharmacies-manager"
import { toast } from 'sonner'

// Componente DroppableArea para reutilizar
function DroppableArea({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'border-primary bg-primary/5' : ''}`}
    >
      {children}
    </div>
  )
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const router = useRouter()

  // Consolidar sort_orders al montar el dashboard
  useEffect(() => {
    const consolidateSortOrders = async () => {
      try {
        console.log('=== CONSOLIDANDO SORT_ORDERS AL INICIAR DASHBOARD ===')
        // Temporalmente desactivado para evitar error de memoria
        console.log('Auto-consolidación temporalmente desactivada')
      } catch (error) {
        console.error('Error en consolidación inicial:', error)
      }
    }

    consolidateSortOrders()
  }, []) // Solo se ejecuta al montar

  // Debounce de 300ms para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Función para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
  }

  // Filtrado de noticias para el Repositorio General
  const filteredRepositoryArticles = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      // Si no hay búsqueda, mostrar todas las noticias del repositorio
      return articles.filter(article => article.sort_order >= 14)
    }

    const normalizedQuery = normalizeText(debouncedSearchQuery)
    
    return articles.filter(article => {
      // Solo filtrar noticias del repositorio (orden >= 14)
      if (article.sort_order < 14) return false
      
      // Buscar en título
      const titleMatch = normalizeText(article.title).includes(normalizedQuery)
      
      // Buscar en excerpt
      const excerptMatch = article.excerpt && normalizeText(article.excerpt).includes(normalizedQuery)
      
      // Buscar en categoría
      const categoryMatch = article.categories && normalizeText(article.categories.name).includes(normalizedQuery)
      
      return titleMatch || excerptMatch || categoryMatch
    })
  }, [articles, debouncedSearchQuery])

  // Configuración de sensores OPTIMIZADA para PC y Mobile
  const sensors = useSensors(
    // Sensor para dispositivos táctiles (móviles/tablets)
    useSensor(TouchSensor, {
      // Configuración específica para touch
      activationConstraint: {
        delay: 250,        // 250ms de presión antes de activar
        tolerance: 5,       // 5px de tolerancia de movimiento
      },
    }),
    // Sensor para dispositivos con puntero (PC)
    useSensor(PointerSensor, {
      // Configuración específica para mouse/puntero
      activationConstraint: {
        distance: 5,         // 5px de movimiento mínimo
      },
    })
  )

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  // FUNCIÓN DE RE-INDEXACIÓN GLOBAL (El Corazón del Sistema)
  const reorderAllArticlesDashboard = async (supabase: any) => {
    // Detectar tipo de dispositivo para logging
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const deviceType = isTouch ? 'MOBILE' : 'PC'
    
    try {
      console.log(`=== RE-INDEXACIÓN GLOBAL INICIADA (${deviceType}) ===`)
      
      // 1. Traer TODAS las noticias publicadas ordenadas por sort_order actual
      const { data: allArticles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      if (!allArticles || allArticles.length === 0) {
        console.log(`No hay noticias para re-indexar (${deviceType})`)
        return
      }
      
      console.log(`Re-indexando ${allArticles.length} noticias (${deviceType})`)
      
      // 2. Recorrer y asignar nuevo sort_order secuencial estricto
      const reorderPromises = allArticles.map(async (article: any, index: number) => {
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
        
        console.log(`[${deviceType}] Re-indexando: "${article.title}" ${article.sort_order} -> ${newSortOrder} (${newHomeLocation})`)
        
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
      
      console.log(`=== RE-INDEXACIÓN GLOBAL COMPLETADA (${deviceType}) ===`)
      
    } catch (error) {
      console.error(`Error en re-indexación global (${deviceType}):`, error)
    }
  }

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
          
          console.log("Movido a principal:", firstFeatured.title)
        }
      }
      
      console.log("Reordenamiento completado")
      
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

    try {
      console.log(`Moviendo "${article.title}" a sección "${targetSection}"`)
      
      const supabase = createClient()
      let newSortOrder = 0
      
      // Determinar el nuevo sort_order según la sección
      if (targetSection === 'principal') {
        newSortOrder = 0
      } else if (targetSection === 'destacada') {
        // Encontrar el primer lugar disponible en destacadas
        const featuredArticles = articles.filter(a => a.sort_order >= 1 && a.sort_order <= 3).sort((a, b) => a.sort_order - b.sort_order)
        newSortOrder = featuredArticles.length < 3 ? featuredArticles.length + 1 : 3
      } else if (targetSection === 'ultimas') {
        // Encontrar el primer lugar disponible en últimas
        const latestArticles = articles.filter(a => a.sort_order >= 4 && a.sort_order <= 13).sort((a, b) => a.sort_order - b.sort_order)
        newSortOrder = latestArticles.length < 10 ? latestArticles.length + 4 : 13
      }
      
      const { error } = await supabase
        .from('articles')
        .update({
          sort_order: newSortOrder,
          home_location: targetSection,
          is_featured: targetSection === 'principal' || targetSection === 'destacada'
        })
        .eq('id', articleId)
      
      if (error) throw error
      
      router.refresh()
    } catch (error) {
      console.error('Error moviendo artículo:', error)
      alert('Error al mover artículo')
    }
  }

  const getHomeLocationFromOrder = (sortOrder: number): string => {
    if (sortOrder === 0) return "principal"
    if (sortOrder >= 1 && sortOrder <= 3) return "destacada"
    if (sortOrder >= 4 && sortOrder <= 13) return "ultimas"
    return "repositorio"
  }

  // Funciones para mover artículos arriba y abajo
  const handleMoveArticleUp = async (articleId: string) => {
    try {
      console.log('=== MOVIENDO ARTÍCULO HACIA ARRIBA ===')
      
      const currentArticle = articles.find(a => a.id === articleId)
      if (!currentArticle) return
      
      // Determinar la sección actual
      const currentSection = getHomeLocationFromOrder(currentArticle.sort_order)
      
      // Encontrar todos los artículos de la misma sección ordenados
      const sectionArticles = articles
        .filter(a => getHomeLocationFromOrder(a.sort_order) === currentSection)
        .sort((a, b) => a.sort_order - b.sort_order)
      
      // Encontrar el artículo actual y el anterior
      const currentIndex = sectionArticles.findIndex(a => a.id === articleId)
      const previousArticle = sectionArticles[currentIndex - 1]
      
      if (!previousArticle) {
        console.log('El artículo ya está en la primera posición de su sección')
        return
      }
      
      console.log(`Intercambiando "${currentArticle.title}" (orden ${currentArticle.sort_order}) con "${previousArticle.title}" (orden ${previousArticle.sort_order})`)
      
      // 1. ACTUALIZACIÓN OPTIMISTA: Actualizar estado local inmediatamente
      const updatedArticles = articles.map(article => {
        if (article.id === currentArticle.id) {
          return { ...article, sort_order: previousArticle.sort_order }
        }
        if (article.id === previousArticle.id) {
          return { ...article, sort_order: currentArticle.sort_order }
        }
        return article
      }).sort((a, b) => a.sort_order - b.sort_order)
      
      setArticles(updatedArticles)
      
      // 2. GUARDADO EN BASE DE DATOS
      const supabase = createClient()
      
      // Intercambiar los sort_orders
      const updates = [
        supabase
          .from('articles')
          .update({ sort_order: previousArticle.sort_order })
          .eq('id', currentArticle.id),
        supabase
          .from('articles')
          .update({ sort_order: currentArticle.sort_order })
          .eq('id', previousArticle.id)
      ]
      
      await Promise.all(updates)
      
      console.log('Intercambio completado')
      
      // 3. INVALIDACIÓN DE CACHÉ (opcional, para sincronizar con otros clientes)
      router.refresh()
      
    } catch (error) {
      console.error('Error moviendo artículo hacia arriba:', error)
      alert('Error al mover artículo hacia arriba')
      // En caso de error, recargar para obtener el estado correcto
      router.refresh()
    }
  }

  const handleMoveArticleDown = async (articleId: string) => {
    try {
      console.log('=== MOVIENDO ARTÍCULO HACIA ABAJO ===')
      
      const currentArticle = articles.find(a => a.id === articleId)
      if (!currentArticle) return
      
      // Determinar la sección actual
      const currentSection = getHomeLocationFromOrder(currentArticle.sort_order)
      
      // Encontrar todos los artículos de la misma sección ordenados
      const sectionArticles = articles
        .filter(a => getHomeLocationFromOrder(a.sort_order) === currentSection)
        .sort((a, b) => a.sort_order - b.sort_order)
      
      // Encontrar el artículo actual y el siguiente
      const currentIndex = sectionArticles.findIndex(a => a.id === articleId)
      const nextArticle = sectionArticles[currentIndex + 1]
      
      if (!nextArticle) {
        console.log('El artículo ya está en la última posición de su sección')
        return
      }
      
      console.log(`Intercambiando "${currentArticle.title}" (orden ${currentArticle.sort_order}) con "${nextArticle.title}" (orden ${nextArticle.sort_order})`)
      
      // 1. ACTUALIZACIÓN OPTIMISTA: Actualizar estado local inmediatamente
      const updatedArticles = articles.map(article => {
        if (article.id === currentArticle.id) {
          return { ...article, sort_order: nextArticle.sort_order }
        }
        if (article.id === nextArticle.id) {
          return { ...article, sort_order: currentArticle.sort_order }
        }
        return article
      }).sort((a, b) => a.sort_order - b.sort_order)
      
      setArticles(updatedArticles)
      
      // 2. GUARDADO EN BASE DE DATOS
      const supabase = createClient()
      
      // Intercambiar los sort_orders
      const updates = [
        supabase
          .from('articles')
          .update({ sort_order: nextArticle.sort_order })
          .eq('id', currentArticle.id),
        supabase
          .from('articles')
          .update({ sort_order: currentArticle.sort_order })
          .eq('id', nextArticle.id)
      ]
      
      await Promise.all(updates)
      
      console.log('Intercambio completado')
      
      // 3. INVALIDACIÓN DE CACHÉ (opcional, para sincronizar con otros clientes)
      router.refresh()
      
    } catch (error) {
      console.error('Error moviendo artículo hacia abajo:', error)
      alert('Error al mover artículo hacia abajo')
      // En caso de error, recargar para obtener el estado correcto
      router.refresh()
    }
  }

  // Función auxiliar para determinar si un artículo se puede mover
  const canMoveArticle = (articleId: string, direction: 'up' | 'down') => {
    const currentArticle = articles.find(a => a.id === articleId)
    if (!currentArticle) return false
    
    const currentSection = getHomeLocationFromOrder(currentArticle.sort_order)
    const sectionArticles = articles
      .filter(a => getHomeLocationFromOrder(a.sort_order) === currentSection)
      .sort((a, b) => a.sort_order - b.sort_order)
    
    const currentIndex = sectionArticles.findIndex(a => a.id === articleId)
    
    if (direction === 'up') {
      return currentIndex > 0
    } else {
      return currentIndex < sectionArticles.length - 1
    }
  }

  // Función definitiva de Drag & Drop con recálculo total y bulk updates
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeArticle = articles.find(a => a.id === activeId)
    if (!activeArticle) return

    // Detectar tipo de dispositivo para logging
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const deviceType = isTouch ? 'MOBILE' : 'PC'
    
    console.log(`=== DRAG & DROP DETECTADO (${deviceType}) ===`)
    console.log(`Artículo activo: "${activeArticle.title}"`)
    console.log(`Orden actual: ${activeArticle.sort_order}`)
    console.log(`Ubicación actual: ${activeArticle.home_location}`)

    // Determinar la sección de destino basado en el overId
    let targetSection = ''
    let targetPosition = 0 // Posición dentro de la sección (0, 1, 2, 3...)

    // Si overId es un artículo, obtener su sección y posición
    const overArticle = articles.find(a => a.id === overId)
    if (overArticle) {
      targetSection = getHomeLocationFromOrder(overArticle.sort_order)
      // Calcular posición relativa dentro de la sección
      const sectionArticles = articles
        .filter(a => getHomeLocationFromOrder(a.sort_order) === targetSection)
        .sort((a, b) => a.sort_order - b.sort_order)
      targetPosition = sectionArticles.findIndex(a => a.id === overId)
    } else {
      // Si overId es una sección, determinar la sección y la primera posición
      if (overId.includes('principal')) {
        targetSection = 'principal'
        targetPosition = 0
      } else if (overId.includes('destacada')) {
        targetSection = 'destacada'
        targetPosition = 0
      } else if (overId.includes('ultimas')) {
        targetSection = 'ultimas'
        targetPosition = 0
      } else if (overId.includes('repositorio')) {
        targetSection = 'repositorio'
        targetPosition = 0
      }
    }

    // Solo mover si la sección es diferente
    if (activeArticle.home_location !== targetSection) {
      // 1. ACTUALIZACIÓN OPTIMISTA: Actualizar estado local inmediatamente
      const originalArticles = [...articles]
      
      try {
        console.log(`Moviendo "${activeArticle.title}" de "${activeArticle.home_location}" a "${targetSection}" (posición ${targetPosition})`)
        
        // Crear nuevo array con el artículo movido a la nueva sección
        let updatedArticles = articles.filter(a => a.id !== activeId)
        
        // Insertar el artículo en la nueva posición de la nueva sección
        const sectionArticles = updatedArticles
          .filter(a => getHomeLocationFromOrder(a.sort_order) === targetSection)
          .sort((a, b) => a.sort_order - b.sort_order)
        
        // Insertar en la posición correcta
        sectionArticles.splice(targetPosition, 0, {
          ...activeArticle,
          home_location: targetSection,
          is_featured: targetSection === 'principal' || targetSection === 'destacada'
        })
        
        // Reconstruir el array completo con todos los artículos
        const otherArticles = updatedArticles.filter(a => getHomeLocationFromOrder(a.sort_order) !== targetSection)
        updatedArticles = [...otherArticles, ...sectionArticles]

        // 2. RECÁLCULO TOTAL DE SORT_ORDERS
        console.log('Iniciando recálculo total de sort_orders...')
        
        // Definir rangos por sección
        const sectionRanges = {
          'principal': { start: 0, end: 0 },
          'destacada': { start: 1, end: 3 },
          'ultimas': { start: 4, end: 13 },
          'repositorio': { start: 14, end: 999 }
        }

        // Agrupar artículos por sección y asignar nuevos sort_orders secuenciales
        const bulkUpdates: any[] = []
        
        Object.entries(sectionRanges).forEach(([section, range]) => {
          const sectionArticles = updatedArticles
            .filter(a => a.home_location === section)
            .sort((a, b) => {
              // Mantener orden relativo si ya existen en la sección
              const aIndex = articles.findIndex(art => art.id === a.id)
              const bIndex = articles.findIndex(art => art.id === b.id)
              return aIndex - bIndex
            })

          sectionArticles.forEach((article, index) => {
            const newSortOrder = range.start + index
            bulkUpdates.push({
              id: article.id,
              sort_order: newSortOrder,
              home_location: section,
              is_featured: section === 'principal' || section === 'destacada'
            })
            
            console.log(`[${section}] "${article.title}": ${article.sort_order} -> ${newSortOrder}`)
          })
        })

        // Actualizar estado local con los nuevos sort_orders
        const finalArticles = updatedArticles.map(article => {
          const update = bulkUpdates.find(u => u.id === article.id)
          return update ? { ...article, ...update } : article
        }).sort((a, b) => a.sort_order - b.sort_order)
        
        setArticles(finalArticles)

        // 3. GUARDADO EN LOTE (BULK UPDATE)
        console.log(`Ejecutando bulk update de ${bulkUpdates.length} artículos...`)
        const supabase = createClient()
        
        // Ejecutar todas las actualizaciones en paralelo
        const updatePromises = bulkUpdates.map(update =>
          supabase
            .from('articles')
            .update({
              sort_order: update.sort_order,
              home_location: update.home_location,
              is_featured: update.is_featured,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id)
        )

        const results = await Promise.all(updatePromises)
        
        // Verificar si hubo errores
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Errores en bulk update:', errors)
          throw new Error(`Error en ${errors.length} actualizaciones`)
        }

        console.log(`✅ Bulk update completado exitosamente (${deviceType})`)
        
        // 4. INVALIDACIÓN DE CACHÉ
        router.refresh()
        
        console.log(`=== DRAG & DROP CON RECÁLCULO TOTAL COMPLETADO (${deviceType}) ===`)
        
      } catch (error) {
        console.error(`Error en drag & drop con recálculo (${deviceType}):`, error)
        
        // Revertir al estado original en caso de error
        console.log('Revirtiendo estado local...')
        setArticles(originalArticles)
        
        const errorMessage = (error as any).message || 'Error desconocido al reordenar'
        toast.error(`Error al reordenar: ${errorMessage}`)
      }
    } else {
      console.log(`El artículo ya está en la sección correcta. No se requiere movimiento.`)
    }
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

  // Noticias de los bloques superiores (no afectados por la búsqueda)
  const mainFeaturedArticle = articles.find(a => a.sort_order === 0)
  const secondaryFeaturedArticles = articles.filter(a => a.sort_order >= 1 && a.sort_order <= 3)
  const latestArticles = articles.filter(a => a.sort_order >= 4 && a.sort_order <= 13)

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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {/* Bloque 1: Noticia Principal */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      Noticia Principal
                      <Badge variant="destructive">1/1</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 transition-all duration-200 ease-in-out">
                    {/* Área de destino para arrastrar */}
                    <DroppableArea
                      id="principal-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para hacerla principal</p>
                    </DroppableArea>
                    
                    {mainFeaturedArticle ? (
                      <DraggableArticleRow
                        key={`main-${mainFeaturedArticle.id}-${mainFeaturedArticle.sort_order}`}
                        article={mainFeaturedArticle}
                        onTogglePublished={togglePublished}
                        onDelete={deleteArticle}
                        onMoveUp={handleMoveArticleUp}
                        onMoveDown={handleMoveArticleDown}
                        canMoveUp={canMoveArticle(mainFeaturedArticle.id, 'up')}
                        canMoveDown={canMoveArticle(mainFeaturedArticle.id, 'down')}
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
                  <CardContent className="space-y-3 transition-all duration-200 ease-in-out">
                    {/* Área de destino para arrastrar */}
                    <DroppableArea
                      id="destacada-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para hacerla destacada</p>
                    </DroppableArea>
                    
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
                        onMoveUp={handleMoveArticleUp}
                        onMoveDown={handleMoveArticleDown}
                        canMoveUp={canMoveArticle(article.id, 'up')}
                        canMoveDown={canMoveArticle(article.id, 'down')}
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
                  <CardContent className="space-y-3 transition-all duration-200 ease-in-out">
                    {/* Área de destino para arrastrar */}
                    <DroppableArea
                      id="ultimas-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para agregarla a últimas noticias</p>
                    </DroppableArea>
                    
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
                        onMoveUp={handleMoveArticleUp}
                        onMoveDown={handleMoveArticleDown}
                        canMoveUp={canMoveArticle(article.id, 'up')}
                        canMoveDown={canMoveArticle(article.id, 'down')}
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
                      <Badge variant="secondary">{filteredRepositoryArticles.length}</Badge>
                    </CardTitle>
                    
                    {/* Barra de Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Buscar por título, contenido o categoría..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 transition-all duration-200 ease-in-out">
                    {/* Área de destino para arrastrar */}
                    <DroppableArea
                      id="repositorio-section"
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 min-h-[60px]"
                    >
                      <p className="text-xs">Arrastra una noticia aquí para moverla al repositorio</p>
                    </DroppableArea>
                    
                    {filteredRepositoryArticles.length === 0 ? (
                      <div className="text-center py-4">
                        {debouncedSearchQuery.trim() ? (
                          <div>
                            <p className="text-muted-foreground">
                              No se encontraron noticias que coincidan con tu búsqueda
                            </p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                              "{debouncedSearchQuery}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            No hay noticias en el repositorio
                          </p>
                        )}
                      </div>
                    ) : (
                      filteredRepositoryArticles.map((article) => (
                      <DraggableArticleRow
                        key={`repo-${article.id}-${article.sort_order}`}
                        article={article}
                        onTogglePublished={togglePublished}
                        onDelete={deleteArticle}
                        onMoveUp={handleMoveArticleUp}
                        onMoveDown={handleMoveArticleDown}
                        canMoveUp={canMoveArticle(article.id, 'up')}
                        canMoveDown={canMoveArticle(article.id, 'down')}
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
