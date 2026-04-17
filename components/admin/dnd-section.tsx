"use client"

import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, 
         closestCenter, CollisionDetection, pointerWithin, rectIntersection } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useState } from 'react'
import { Article } from './admin-dashboard'
import { DraggableArticleRow } from './draggable-article-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DndSectionProps {
  title: string
  articles: Article[]
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (id: string) => void
  onReorder: (articles: Article[]) => void
  onMoveToSection?: (articleId: string, targetSection: string) => void
  sectionId: string
  maxItems?: number
  color?: string
}

export function DndSection({
  title,
  articles,
  onTogglePublished,
  onDelete,
  onReorder,
  onMoveToSection,
  sectionId,
  maxItems,
  color
}: DndSectionProps) {
  const [draggedArticle, setDraggedArticle] = useState<Article | null>(null)

  // Custom collision detection para permitir mover entre secciones
  const customCollisionDetection: CollisionDetection = (args) => {
    if (draggedArticle) {
      // Primero verificar si está sobre otra sección
      const pointerCollisions = pointerWithin(args)
      if (pointerCollisions.length > 0) {
        return pointerCollisions
      }
      
      // Si no, usar detección por intersección de rectángulos
      const rectCollisions = rectIntersection(args)
      if (rectCollisions.length > 0) {
        return rectCollisions
      }
    }
    
    // Si no, usar closestCenter para ordenamiento dentro de la sección
    return closestCenter(args)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const article = articles.find(a => a.id === active.id)
    if (article) {
      setDraggedArticle(article)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedArticle(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Si es el mismo contenedor, reordenar
    if (over.data.current?.type === 'sortable') {
      const oldIndex = articles.findIndex(article => article.id === activeId)
      const newIndex = articles.findIndex(article => article.id === overId)

      if (oldIndex !== newIndex) {
        const newArticles = arrayMove(articles, oldIndex, newIndex)
        onReorder(newArticles)
      }
    }
    // Si es otra sección, mover entre secciones
    else if (overId.includes('section') && onMoveToSection) {
      // Extraer el ID de la sección del overId
      const targetSectionId = overId.replace('-section', '')
      onMoveToSection(activeId, targetSectionId)
    }
  }

  return (
    <DndContext
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={articles.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <Card className={`${maxItems && articles.length >= maxItems ? 'border-orange-200 bg-orange-50' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${color === 'red' ? 'text-red-600' : ''}`}>
              {title}
              <Badge variant="secondary">{articles.length}</Badge>
              {maxItems && (
                <Badge variant={articles.length >= maxItems ? "destructive" : "outline"}>
                  {articles.length}/{maxItems}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[100px]">
            {/* Área vacía para arrastrar */}
            <div
              id={`${sectionId}-section`}
              className={`border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-muted-foreground/50 transition-colors hover:border-muted-foreground/50 ${articles.length === 0 ? 'min-h-[80px]' : 'min-h-[40px]'}`}
            >
              {articles.length === 0 ? (
                <p className="text-sm">Arrastra una noticia aquí</p>
              ) : (
                <p className="text-xs">O arrastra aquí para mover a esta sección</p>
              )}
            </div>
            
            {articles.map((article) => (
              <DraggableArticleRow
                key={article.id}
                article={article}
                onTogglePublished={onTogglePublished}
                onDelete={onDelete}
              />
            ))}
          </CardContent>
        </Card>
      </SortableContext>
    </DndContext>
  )
}
