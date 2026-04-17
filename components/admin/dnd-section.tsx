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
  color = "default"
}: DndSectionProps) {
  const [draggedArticle, setDraggedArticle] = useState<Article | null>(null)

  // Collision detection personalizada para permitir arrastrar entre secciones
  const collisionDetection: CollisionDetection = (args) => {
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
    else if (over.data.current?.type === 'section' && onMoveToSection) {
      onMoveToSection(activeId, over.data.current.sectionId)
    }
  }

  return (
    <Card className={`mb-6 ${color === "red" ? "border-red-200 bg-red-50/50" : ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {title}
          <Badge variant="secondary">{articles.length}</Badge>
          {maxItems && (
            <Badge variant="outline" className="text-xs">
              Máx: {maxItems}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
            <p className="text-muted-foreground">
              {draggedArticle ? "Suelta aquí para mover" : "No hay noticias en esta sección"}
            </p>
          </div>
        ) : (
          <SortableContext items={articles.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {articles.map((article) => (
              <DraggableArticleRow
                key={article.id}
                article={article}
                onTogglePublished={onTogglePublished}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  )
}
