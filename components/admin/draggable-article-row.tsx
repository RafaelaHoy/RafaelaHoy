"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Article } from './admin-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Trash2, GripVertical, Edit } from 'lucide-react'
import Link from 'next/link'

interface DraggableArticleRowProps {
  article: Article
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (id: string) => void
  showMoveButtons?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function DraggableArticleRow({
  article,
  onTogglePublished,
  onDelete,
  showMoveButtons = false,
  isFirst = false,
  isLast = false
}: DraggableArticleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id })

  // Remover aria-describedby para evitar hidratación
  const { 'aria-describedby': _, ...cleanAttributes } = attributes

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...cleanAttributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        title="Arrastra para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

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

      {/* Información */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{article.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={article.is_published ? "default" : "secondary"} className="text-xs">
            {article.is_published ? "Publicado" : "Borrador"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {article.home_location || "repositorio"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Orden: {article.sort_order}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 w-8 p-0"
          title="Editar"
        >
          <Link href={`/admin/noticias/editar/${article.id}`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTogglePublished(article.id, !article.is_published)}
          className="h-8 w-8 p-0"
          title={article.is_published ? "Ocultar" : "Publicar"}
        >
          {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(article.id)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
