"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, X, Bold, Italic, Underline, List, ListOrdered, Quote, LinkIcon, Image, Video, Upload } from "lucide-react"
import Link from "next/link"
import { MediaManager } from "@/components/admin/media-manager-enhanced"

interface Category {
  id: string
  name: string
  slug: string
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  alt_text?: string
  caption?: string
}

// Componente de editor de texto enriquecido personalizado
const RichTextEditor = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const url = prompt('Ingrese la URL del enlace:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Ingrese la URL de la imagen:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const insertVideo = () => {
    const url = prompt('Ingrese la URL del video (YouTube/Vimeo):')
    if (url) {
      const iframe = `<iframe src="${url}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`
      document.execCommand('insertHTML', false, iframe)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-muted border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="h-8 w-8 p-0"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertImage}
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertVideo}
          className="h-8 w-8 p-0"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none bg-white"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}

export default function CreateNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [featuredImage, setFeaturedImage] = useState<string>("")
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (data) {
        setCategories(data)
      }
    }
    
    loadCategories()
  }, [])

  // Cargar medios existentes
  useEffect(() => {
    const loadMedia = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) {
        setMediaItems(data)
      }
    }
    
    loadMedia()
  }, [])

  // Actualizar imagen destacada cuando cambia la galería
  useEffect(() => {
    if (mediaItems.length > 0) {
      const firstImage = mediaItems.find(item => item.type === 'image')
      if (firstImage) {
        setFeaturedImage(firstImage.url)
      }
    }
  }, [mediaItems])

  const handleSave = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim() || !categoryId) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Crear artículo
      const { data: article, error } = await supabase
        .from('articles')
        .insert({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          category_id: categoryId,
          author: 'Rafaela hoy',
          is_published: isPublished,
          image_url: featuredImage,
          slug: title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-'),
          published_at: isPublished ? new Date().toISOString() : null,
          sort_order: 0
        })
        .select()
        .single()

      if (error) throw error

      // Redirigir a la lista
      router.push('/admin')
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar el artículo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior persistente */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Nueva Noticia</h1>
                {title && (
                  <p className="text-sm text-muted-foreground truncate max-w-md">
                    {title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Columna principal - Campos principales */}
          <div className="lg:col-span-3 space-y-6">
            {/* Título */}
            <div>
              <Label htmlFor="title" className="text-base font-medium">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ingresa el título de la noticia"
                className="text-lg mt-2"
                disabled={saving}
              />
            </div>

            {/* Extracto */}
            <div>
              <Label htmlFor="excerpt" className="text-base font-medium">
                Extracto <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumen de la noticia (aparecerá en listados y redes sociales)"
                className="w-full mt-2 p-3 border rounded-md resize-none h-24"
                disabled={saving}
              />
            </div>

            {/* Editor de Texto Enriquecido */}
            <div>
              <Label className="text-base font-medium">
                Desarrollo <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Escribe el contenido completo de la noticia aquí..."
                />
              </div>
            </div>
          </div>

          {/* Columna lateral - Metadatos y configuración */}
          <div className="space-y-6">
            {/* Metadatos */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Configuración</h3>
              
              {/* Categoría */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="category">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
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

              {/* Autor (fijo) */}
              <div className="space-y-2 mb-4">
                <Label>Autor</Label>
                <Input value="Rafaela hoy" disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  El autor es fijo y no se puede modificar
                </p>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publicado</Label>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Galería de medios */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Galería de Medios</h3>
              
              {/* Imagen destacada actual */}
              {featuredImage && (
                <div className="mb-4">
                  <Label className="text-sm font-medium">Portada actual</Label>
                  <div className="mt-2">
                    <img
                      src={featuredImage}
                      alt="Portada"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      La primera imagen de la galería se usa como portada
                    </p>
                  </div>
                </div>
              )}

              {/* Media Manager */}
              <MediaManager
                articleId={undefined} // Sin articleId para creación
                mediaItems={mediaItems}
                onMediaChange={(newMedia) => {
                  setMediaItems(newMedia)
                  // Actualizar la imagen destacada (primera imagen)
                  const firstImage = newMedia.find(item => item.type === 'image')
                  if (firstImage) {
                    setFeaturedImage(firstImage.url)
                  } else {
                    setFeaturedImage("")
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
