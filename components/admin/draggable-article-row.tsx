"use client"

import { useState, useEffect } from 'react'
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
}

export function DraggableArticleRow({
  article,
  onTogglePublished,
  onDelete,
}: DraggableArticleRowProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Evitar error de hidratación SSR
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: article.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 200ms ease, opacity 200ms ease',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: isDragging ? 'none' : 'auto',
    touchAction: isDragging ? 'none' : 'auto',
    opacity: isDragging ? 0.5 : 1,
  }

  // Si no está montado, renderizar una versión estática sin dnd-kit
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        {/* Icono de arrastre */}
        <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Miniatura de imagen de portada - OCULTA en móviles */}
        <div className="hidden sm:block w-12 h-10 sm:w-16 sm:h-12 bg-muted rounded flex-shrink-0 overflow-hidden border">
          {article.image_url ? (
            <>
              {/* Debug: Mostrar URL en consola */}
              {console.log(`Imagen para "${article.title}":`, article.image_url)}
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                onLoad={(e) => {
                  console.log(`Imagen cargada exitosamente: "${article.title}"`)
                }}
                onError={(e) => {
                  console.error(`Error cargando imagen para "${article.title}":`, article.image_url)
                  // Si la imagen falla al cargar, mostrar placeholder
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling.style.display = 'flex'
                }}
              />
            </>
          ) : (
            console.log(`Sin imagen para "${article.title}"`)
          )}
          {/* Placeholder cuando no hay imagen o falla la carga */}
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 p-1" style={{ display: article.image_url ? 'none' : 'flex' }}>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] sm:text-xs text-center leading-tight mt-1 hidden sm:block">Sin imagen</span>
          </div>
        </div>

        {/* Información */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2 leading-tight">{article.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={article.is_published ? "default" : "secondary"} className="text-xs">
              {article.is_published ? "Publicado" : "Borrador"}
            </Badge>
            {/* Número de orden - OCULTO en móviles */}
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Orden: {article.sort_order}
            </span>
            {/* Ocultar extracto y fecha larga en móviles */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              {article.excerpt && (
                <span className="line-clamp-1 max-w-[200px]">
                  {article.excerpt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estado de publicación - mostrar editar en móviles */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePublished(article.id, !article.is_published)}
            className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
              article.is_published 
                ? 'text-green-600 hover:text-green-700' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Botones de acción - EDITAR VISIBLE en móviles */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Editar"
          >
            <Link href={`/admin/noticias/editar/${article.id}`}>
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(article.id)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: isDragging ? 'none' : 'auto'
      }}
      className={`flex items-center gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-all ${
        isDragging ? 'shadow-lg border-primary scale-105 bg-primary/5' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Icono de arrastre */}
      <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Miniatura de imagen de portada - OCULTA en móviles */}
      <div className="hidden sm:block w-12 h-10 sm:w-16 sm:h-12 bg-muted rounded flex-shrink-0 overflow-hidden border">
        {article.image_url ? (
          <>
            {/* Debug: Mostrar URL en consola */}
            {console.log(`Imagen para "${article.title}":`, article.image_url)}
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              onLoad={(e) => {
                console.log(`Imagen cargada exitosamente: "${article.title}"`)
              }}
              onError={(e) => {
                console.error(`Error cargando imagen para "${article.title}":`, article.image_url)
                // Si la imagen falla al cargar, mostrar placeholder
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling.style.display = 'flex'
              }}
            />
          </>
        ) : (
          console.log(`Sin imagen para "${article.title}"`)
        )}
        {/* Placeholder cuando no hay imagen o falla la carga */}
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 p-1" style={{ display: article.image_url ? 'none' : 'flex' }}>
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] sm:text-xs text-center leading-tight mt-1 hidden sm:block">Sin imagen</span>
        </div>
      </div>

      {/* Información */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 leading-tight">{article.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={article.is_published ? "default" : "secondary"} className="text-xs">
            {article.is_published ? "Publicado" : "Borrador"}
          </Badge>
          {/* Número de orden - OCULTO en móviles */}
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Orden: {article.sort_order}
          </span>
          {/* Ocultar extracto y fecha larga en móviles */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            {article.excerpt && (
              <span className="line-clamp-1 max-w-[200px]">
                {article.excerpt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Estado de publicación - mostrar editar en móviles */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTogglePublished(article.id, !article.is_published)}
          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${
            article.is_published 
              ? 'text-green-600 hover:text-green-700' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Botones de acción - EDITAR VISIBLE en móviles */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          title="Editar"
        >
          <Link href={`/admin/noticias/editar/${article.id}`}>
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(article.id)}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )
}
