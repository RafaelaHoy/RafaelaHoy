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
import { ArrowLeft, Save, X, Bold, Italic, Underline, List, ListOrdered, Quote, LinkIcon, Image, Video, Type, Heading3, Heading4 } from "lucide-react"
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

// Función para procesar Markdown a HTML
const processMarkdownToHTML = (markdown: string): string => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Underline
    .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
    // Blockquotes
    .replace(/^> (.+$)/gim, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+$)/gim, '<ul><li>$1</li></ul>')
    // Ordered lists
    .replace(/^1\. (.+$)/gim, '<ol><li>$1</li></ol>')
    // Paragraphs (multiple lines)
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraphs
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h|<ul|<ol|<blockquote)/g, '$1')
    .replace(/(<\/h3>|<\/h4>|<\/ul>|<\/ol>|<\/blockquote>)<\/p>/g, '$1')
}

// Componente de editor de texto enriquecido con textarea y Markdown
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
    const newValue = e.target.value
    setContent(newValue)
    onChange(newValue)
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
      case 'formatBlock':
        if (commandValue === 'p') {
          newValue = `\n${selectedText || 'Nuevo párrafo'}\n`
        } else if (commandValue === 'h3') {
          newValue = `\n### ${selectedText || 'Título 3'}\n`
        } else if (commandValue === 'h4') {
          newValue = `\n#### ${selectedText || 'Título 4'}\n`
        } else {
          newValue = `\n> ${selectedText}\n`
        }
        break
      case 'insertUnorderedList':
        newValue = `\n- ${selectedText || 'Nuevo item'}`
        break
      case 'insertOrderedList':
        newValue = `\n1. ${selectedText || 'Nuevo item'}`
        break
      case 'createLink':
        const url = prompt('Ingrese la URL del enlace:')
        if (url) {
          newValue = `[${selectedText || url}](${url})`
        }
        break
      case 'insertImage':
        const imgUrl = prompt('Ingrese la URL de la imagen:')
        if (imgUrl) {
          newValue = `![${selectedText || 'Imagen'}](${imgUrl})`
        }
        break
      case 'insertVideo':
        const videoUrl = prompt('Ingrese la URL del video (YouTube/Vimeo):')
        if (videoUrl) {
          newValue = `[${selectedText || 'Video'}](${videoUrl})`
        }
        break
      default:
        return
    }

    // Insertar el nuevo texto
    const newContent = textarea.value.substring(0, start) + newValue + textarea.value.substring(end)
    setContent(newContent)
    onChange(newContent)
    
    // Restaurar la posición del cursor
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + newValue.length
      textarea.setSelectionRange(newPosition, newPosition)
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
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
          title="Subrayado"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'p')}
          className="h-8 w-8 p-0"
          title="Párrafo"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h3')}
          className="h-8 w-8 p-0"
          title="Título 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'h4')}
          className="h-8 w-8 p-0"
          title="Título 4"
        >
          <Heading4 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Lista sin numerar"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="h-8 w-8 p-0"
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('createLink')}
          className="h-8 w-8 p-0"
          title="Enlace"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertImage')}
          className="h-8 w-8 p-0"
          title="Imagen"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertVideo')}
          className="h-8 w-8 p-0"
          title="Video"
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor - Textarea simple */}
      <textarea
        id="rich-editor-edit"
        value={content}
        onChange={handleChange}
        placeholder={placeholder || "Escribe el contenido aquí..."}
        className="min-h-[400px] w-full p-4 focus:outline-none bg-white resize-none border-0 ltr text-left touch-manipulation-auto font-mono text-sm"
        style={{ 
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          touchAction: 'manipulation',
          lineHeight: '1.5'
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
  const [homeLocation, setHomeLocation] = useState("repositorio")
  const [isPublished, setIsPublished] = useState(false)
  const [originalSlug, setOriginalSlug] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [slug, setSlug] = useState("")
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Función para generar slug a partir del título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  // Generar slug automáticamente cuando cambia el título (solo si no hay slug personalizado)
  useEffect(() => {
    if (title && slug === originalSlug) {
      setSlug(generateSlug(title))
    }
  }, [title])

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
      setHomeLocation(data.home_location || "repositorio")
      setIsPublished(data.is_published || false)
      setFeaturedImage(data.image_url || "")
      setOriginalSlug(data.slug || "")
      setSlug(data.slug || "")
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

  // Función para manejar el desplazamiento automático
  const handleAutoReposition = async (supabase: any, newLocation: string, currentArticleId: string) => {
    const movedArticles: string[] = []
    
    try {
      if (newLocation === "principal") {
        // Buscar si ya existe una noticia principal (que no sea la actual)
        const { data: existingMain } = await supabase
          .from('articles')
          .select('*')
          .eq('is_featured', true)
          .eq('sort_order', 0)
          .neq('id', currentArticleId)
          .single()
        
        if (existingMain) {
          // Ocultar la existente (despublicar) pero mantenerla como principal
          await supabase
            .from('articles')
            .update({ 
              is_published: false // Solo ocultar, no mover de ubicación
            })
            .eq('id', existingMain.id)
          movedArticles.push(existingMain.title)
        }
      } else if (newLocation === "destacada") {
        // Buscar las 3 destacadas actuales (que no sean la actual)
        const { data: existingFeatured } = await supabase
          .from('articles')
          .select('*')
          .eq('is_featured', true)
          .in('sort_order', [1, 2, 3])
          .neq('id', currentArticleId)
          .order('sort_order', { ascending: true })
        
        if (existingFeatured && existingFeatured.length >= 3) {
          // Mover la más antigua (sort_order 1) al repositorio
          const oldest = existingFeatured[0]
          await supabase
            .from('articles')
            .update({ 
              is_featured: false, 
              sort_order: 999,
              home_location: 'repositorio'
            })
            .eq('id', oldest.id)
          movedArticles.push(oldest.title)
        }
      } else if (newLocation === "ultimas") {
        // Buscar las 10 últimas noticias actuales (que no sean la actual)
        const { data: existingLatest } = await supabase
          .from('articles')
          .select('*')
          .eq('is_featured', false)
          .lt('sort_order', 100) // Últimas noticias tienen sort_order < 100
          .neq('id', currentArticleId)
          .order('sort_order', { ascending: true })
        
        if (existingLatest && existingLatest.length >= 10) {
          // Mover la más antigua al repositorio
          const oldest = existingLatest[0]
          await supabase
            .from('articles')
            .update({ 
              sort_order: 999,
              home_location: 'repositorio'
            })
            .eq('id', oldest.id)
          movedArticles.push(oldest.title)
        }
      }
      
      return movedArticles
    } catch (error) {
      console.error('Error en reubicación automática:', error)
      return []
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim() || !categoryId) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Procesar Markdown a HTML
      const processedContent = processMarkdownToHTML(content.trim())
      
      // Debug: Verificar qué se está guardando
      console.log('=== DEBUG GUARDAR EDICIÓN ===')
      console.log('Markdown original:', content.trim())
      console.log('HTML procesado:', processedContent)
      console.log('Ubicación en home:', homeLocation)
      console.log('============================')
      
      // Manejar reubicación automática
      const movedArticles = await handleAutoReposition(supabase, homeLocation, articleId)
      
      // Determinar sort_order y is_featured según la ubicación
      let sortOrder = 999 // Por defecto en repositorio
      let isFeatured = false
      
      if (homeLocation === "principal") {
        sortOrder = 0
        isFeatured = true
      } else if (homeLocation === "destacada") {
        // Encontrar el siguiente sort_order disponible (1, 2, 3)
        const { data: existingFeatured } = await supabase
          .from('articles')
          .select('sort_order')
          .eq('is_featured', true)
          .in('sort_order', [1, 2, 3])
          .neq('id', articleId)
          .order('sort_order', { ascending: true })
        
        if (existingFeatured && existingFeatured.length > 0) {
          // Tomar el siguiente disponible
          const usedOrders = existingFeatured.map(a => a.sort_order)
          for (let i = 1; i <= 3; i++) {
            if (!usedOrders.includes(i)) {
              sortOrder = i
              break
            }
          }
          if (sortOrder === 999) sortOrder = 1 // Si todos están ocupados, usar 1
        } else {
          sortOrder = 1
        }
        isFeatured = true
      } else if (homeLocation === "ultimas") {
        // Encontrar el siguiente sort_order disponible para últimas noticias
        const { data: existingLatest } = await supabase
          .from('articles')
          .select('sort_order')
          .eq('is_featured', false)
          .lt('sort_order', 100)
          .neq('id', articleId)
          .order('sort_order', { ascending: true })
        
        if (existingLatest && existingLatest.length > 0) {
          const usedOrders = existingLatest.map(a => a.sort_order)
          for (let i = 6; i <= 15; i++) {
            if (!usedOrders.includes(i)) {
              sortOrder = i
              break
            }
          }
          if (sortOrder === 999) sortOrder = 6 // Si todos están ocupados, usar 6
        } else {
          sortOrder = 6
        }
      }
      
      // Generar slug si cambió el título
      // El slug ya se maneja con el estado, no necesita lógica adicional
      
      // Actualizar artículo
      const { error } = await supabase
        .from('articles')
        .update({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: processedContent, // Guardar como HTML procesado
          category_id: categoryId,
          is_published: isPublished,
          image_url: featuredImage,
          slug: slug.trim() || generateSlug(title.trim()), // Usar slug del estado
          published_at: isPublished ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
          sort_order: sortOrder,
          is_featured: isFeatured,
          home_location: homeLocation,
          author: 'Rafaela hoy'  // Siempre autor Rafaela hoy
        })
        .eq('id', articleId)

      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(`Error al actualizar: ${error.message}`)
      }

      // Mostrar notificaciones de artículos movidos
      if (movedArticles.length > 0) {
        const message = movedArticles.map(title => 
          `La noticia "${title}" ha sido ocultada para ceder el lugar en la sección principal.`
        ).join('\n')
        alert(message)
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

            {/* URL/Slug */}
            <div>
              <Label htmlFor="slug" className="text-base font-medium">
                URL (Slug) <span className="text-muted-foreground text-sm">- Se genera automáticamente</span>
              </Label>
              <div className="flex items-center mt-2">
                <span className="text-muted-foreground text-sm mr-2">/noticia/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-de-la-noticia"
                  className="touch-manipulation-auto"
                  disabled={saving}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
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

              {/* Ubicación en Home */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="homeLocation">
                  Ubicación en Home
                </Label>
                <Select value={homeLocation} onValueChange={setHomeLocation} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Noticia Principal</SelectItem>
                    <SelectItem value="destacada">Noticia Destacada</SelectItem>
                    <SelectItem value="ultimas">Últimas Noticias</SelectItem>
                    <SelectItem value="repositorio">Repositorio (Solo Archivo)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {homeLocation === "principal" && "Cupo: 1. Si ya existe una, será movida al repositorio."}
                  {homeLocation === "destacada" && "Cupo: 3. Si hay 3, la más antigua será movida al repositorio."}
                  {homeLocation === "ultimas" && "Cupo: 10. Si hay 10, la más antigua será movida al repositorio."}
                  {homeLocation === "repositorio" && "La noticia solo estará disponible en el repositorio y búsqueda."}
                </p>
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
