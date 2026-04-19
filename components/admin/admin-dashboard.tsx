"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      throw error
    }
  }

  // Función optimista de Drag & Drop con guardado estricto en base de datos
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
        // Para repositorio, siempre asignar posición 14 con desplazamiento
        targetSortOrder = 14
      }
    }

    console.log(`Destino: orden ${targetSortOrder} (${targetSection})`)

    // Solo mover si la posición es diferente
    if (activeArticle.sort_order !== targetSortOrder || activeArticle.home_location !== targetSection) {
      try {
        // 1. ACTUALIZACIÓN OPTIMISTA: Actualizar estado local inmediatamente
        const originalArticles = [...articles] // Guardar estado original para reversión
        const updatedArticles = [...articles]
        const activeIndex = updatedArticles.findIndex(a => a.id === activeId)
        
        if (activeIndex !== -1) {
          // Crear objeto actualizado idéntico al que se enviará a Supabase
          const updatedArticle = {
            ...updatedArticles[activeIndex],
            sort_order: targetSortOrder,
            home_location: targetSection,
            is_featured: targetSection === 'principal' || targetSection === 'destacada'
          }
          
          // Actualizar estado local con el mismo objeto que se enviará a DB
          updatedArticles[activeIndex] = updatedArticle
          
          // Reordenar el array localmente
          const sortedArticles = updatedArticles.sort((a, b) => a.sort_order - b.sort_order)
          setArticles(sortedArticles)
          
          console.log(`Estado local actualizado optimistamente:`, {
            title: updatedArticle.title,
            new_order: updatedArticle.sort_order,
            new_location: updatedArticle.home_location,
            new_featured: updatedArticle.is_featured
          })
        }

        // 2. GUARDADO ESTRICTO EN BASE DE DATOS
        console.log(`Guardando en Supabase...`)
        const supabase = createClient()
        
        // 2.1. SI EL DESTINO ES REPOSITORIO, APLICAR DESPLAZAMIENTO PRIMERO
        if (targetSection === 'repositorio') {
          console.log('Aplicando desplazamiento en repositorio...')
          
          // EFECTO DESPLAZAMIENTO: Sumar +1 a todos los sort_order >= 14
          const { error: shiftError } = await supabase
            .from('articles')
            .update({ sort_order: supabase.rpc('increment', { x: 1 }) })
            .gte('sort_order', 14)
            .neq('id', activeArticle.id) // No afectar a la noticia que estamos moviendo
          
          if (shiftError) {
            console.log('Error con RPC, usando método alternativo...')
            // Método alternativo si RPC no funciona
            const { data: repoArticles } = await supabase
              .from('articles')
              .select('id, sort_order')
              .gte('sort_order', 14)
              .neq('id', activeArticle.id)
              .order('sort_order', { ascending: false }) // Empezar por el más grande
            
            if (repoArticles) {
              for (const article of repoArticles) {
                await supabase
                  .from('articles')
                  .update({ sort_order: article.sort_order + 1 })
                  .eq('id', article.id)
              }
            }
          }
          
          console.log('✅ Desplazamiento completado - Todas las noticias >=14 movidas +1')
        }
        
        const newIsFeatured = targetSection === 'principal' || targetSection === 'destacada'
        
        // Objeto exacto que se enviará a Supabase
        const dbUpdateData = {
          sort_order: targetSortOrder,
          home_location: targetSection,
          is_featured: newIsFeatured
        }
        
        console.log(`Enviando a Supabase:`, dbUpdateData)
        
        const { error: updateError } = await supabase
          .from("articles")
          .update(dbUpdateData)
          .eq("id", activeArticle.id)
          .select() // Pedir que devuelva el registro actualizado
          .single()

        if (updateError) {
          console.error('Error en update de Supabase:', updateError)
          throw new Error(`Error al guardar en Supabase: ${updateError.message}`)
        }

        console.log(`Guardado exitoso en Supabase`)
        
        // 3. INVALIDACIÓN DE CACHÉ (Next.js App Router)
        console.log(`Invalidando caché de Next.js...`)
        router.refresh()
        
        // 4. VERIFICACIÓN DE CONSISTENCIA (opcional, para debugging)
        setTimeout(async () => {
          try {
            const { data: verifyArticle } = await supabase
              .from("articles")
              .select("*")
              .eq("id", activeArticle.id)
              .single()
            
            if (verifyArticle) {
              console.log(`Verificación post-guardado:`, {
                title: verifyArticle.title,
                db_order: verifyArticle.sort_order,
                db_location: verifyArticle.home_location,
                db_featured: verifyArticle.is_featured
              })
              
              // Verificar que coincida con lo que enviamos
              const isConsistent = 
                verifyArticle.sort_order === targetSortOrder &&
                verifyArticle.home_location === targetSection &&
                verifyArticle.is_featured === newIsFeatured
              
              if (!isConsistent) {
                console.error('INCONSISTENCIA DETECTADA: Los datos en DB no coinciden con los enviados')
                console.error('Esperado:', dbUpdateData)
                console.error('Recibido:', {
                  sort_order: verifyArticle.sort_order,
                  home_location: verifyArticle.home_location,
                  is_featured: verifyArticle.is_featured
                })
              } else {
                console.log('Consistencia verificada: DB coincide con datos enviados')
              }
            }
          } catch (verifyError) {
            console.error('Error en verificación post-guardado:', verifyError)
          }
        }, 1000)
        
        console.log(`=== DRAG & DROP COMPLETADO EXITOSAMENTE (${deviceType}) ===`)
        
      } catch (error) {
        console.error(`Error moviendo artículo (${deviceType}):`, error)
        
        // REVERSIÓN EN CASO DE ERROR: Revertir al estado original
        console.log('Revirtiendo estado local al estado original...')
        setArticles(originalArticles)
        
        // Mostrar error específico
        const errorMessage = error.message || 'Error desconocido al mover la noticia'
        toast.error(`Error al guardar en la base de datos: ${errorMessage}`)
        
        // NO recargar la página, solo mostrar el error y revertir
        console.log('Estado revertido. Usuario puede intentar nuevamente.')
      }
    } else {
      console.log(`El artículo ya está en la posición correcta. No se requiere movimiento.`)
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
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-600">
                      Noticia Principal
                      <Badge variant="secondary">{mainFeaturedArticle ? 1 : 0}</Badge>
                      <Badge variant="outline">1/1</Badge>
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
