"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { ArrowLeft, Save, X, Bold, Italic, Underline, List, ListOrdered, Quote, LinkIcon, Image, Video } from "lucide-react"
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

// Componente de editor de texto enriquecido personalizado (alternativa con textarea)
const RichTextEditor = ({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) => {
  const [content, setContent] = useState(value || '')

  useEffect(() => {
    setContent(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    const newValue = textarea.value
    const cursorPosition = textarea.selectionStart
    
    setContent(newValue)
    onChange(newValue)
    
    // Restaurar la posición del cursor después del update
    setTimeout(() => {
      textarea.selectionStart = cursorPosition
      textarea.selectionEnd = cursorPosition
    }, 0)
  }

  const execCommand = (command: string, commandValue?: string) => {
    const textarea = document.querySelector('#rich-editor-edit') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    let newValue = ''

    switch (command) {
      case 'bold':
        newValue = `**${selectedText}**`
        break
      case 'italic':
        newValue = `*${selectedText}*`
        break
      case 'underline':
        newValue = `<u>${selectedText}</u>`
        break
      case 'insertUnorderedList':
        newValue = `\n• ${selectedText}`
        break
      case 'insertOrderedList':
        newValue = `\n1. ${selectedText}`
        break
      case 'createLink':
        const url = prompt('Ingrese la URL del enlace:')
        if (url) newValue = `[${selectedText}](${url})`
        break
      case 'insertImage':
        const imgUrl = prompt('Ingrese la URL de la imagen:')
        if (imgUrl) newValue = `![${selectedText}](${imgUrl})`
        break
      case 'insertVideo':
        const videoUrl = prompt('Ingrese la URL del video (YouTube/Vimeo):')
        if (videoUrl) newValue = `<iframe src="${videoUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`
        break
      default:
        newValue = selectedText
    }

    const newContent = textarea.value.substring(0, start) + newValue + textarea.value.substring(end)
    setContent(newContent)
    onChange(newContent)
    
    // Restaurar cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newValue.length, start + newValue.length)
    }, 0)
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
          onClick={() => execCommand('createLink')}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertImage')}
          className="h-8 w-8 p-0"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertVideo')}
          className="h-8 w-8 p-0"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <textarea
        id="rich-editor-edit"
        value={content}
        onChange={handleChange}
        placeholder={placeholder || "Escribe el contenido aquí..."}
        className="min-h-[400px] w-full p-4 focus:outline-none bg-white resize-none border-0 ltr text-left"
        style={{ 
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal'
        }}
      />
    </div>
  )
}

interface Article {
  id: string
  title: string
  excerpt: string
  content: string
  category_id: string
  published: boolean
  image_url: string
  slug: string
  sort_order: number
  created_at: string
  updated_at: string
  published_at: string
}

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [originalSlug, setOriginalSlug] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Cargar medios del artículo
  const loadArticleMedia = async (articleId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('article_media')
      .select('*')
      .eq('article_id', articleId)
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setMediaItems(data)
      
      // Establecer la primera imagen como destacada
      const firstImage = data.find(item => item.type === 'image')
      if (firstImage) {
        setFeaturedImage(firstImage.url)
      }
    }
  }

  // Cargar artículo
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) return
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTitle(data.title || "")
      setExcerpt(data.excerpt || "")
      setContent(data.content || "")
      setCategoryId(data.category_id || "")
      setIsPublished(data.is_published || false)
      setFeaturedImage(data.image_url || "")
      setOriginalSlug(data.slug || "")
      setLoading(false)
      
      // Cargar medios del artículo
      await loadArticleMedia(articleId)
    }
    
    loadArticle()
  }, [articleId])

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

  const handleSave = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim() || !categoryId) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Generar slug si cambió el título
      let newSlug = originalSlug
      if (title.trim() !== title) {
        newSlug = title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
      }
      
      // Actualizar artículo
      const { error } = await supabase
        .from('articles')
        .update({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          category_id: categoryId,
          is_published: isPublished,
          image_url: featuredImage,
          slug: newSlug,
          published_at: isPublished ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
          author: 'Rafaela hoy'  // Siempre autor Rafaela hoy
        })
        .eq('id', articleId)

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error al actualizar: ${error.message}`)
      }

      // Redirigir a la lista
      router.push('/admin')
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert(`Error al guardar el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <Link href="/admin">
            <Button>Volver al Admin</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="h-16 bg-muted border-b"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
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
                <h1 className="text-lg font-semibold">Editar Noticia</h1>
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
                disabled={saving}
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Columna principal - Campos principales */}
          <div className="xl:col-span-3 space-y-6">
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
                className="text-lg mt-2 touch-manipulation-auto"
                disabled={saving}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                  touchAction: 'manipulation'
                }}
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
                className="w-full mt-2 p-3 border rounded-md resize-none h-24 touch-manipulation-auto"
                disabled={saving}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                  touchAction: 'manipulation'
                }}
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

          {/* Columna izquierda - Galería y configuración */}
          <div className="xl:col-span-1 space-y-6">
            {/* Configuración - Categoría y Autor */}
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

              {/* Autor */}
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value="Rafaela hoy"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Galería de medios */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Galería de Imágenes</h3>
              <MediaManager
                articleId={articleId}
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
