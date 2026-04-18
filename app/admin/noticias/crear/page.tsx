"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Image as ImageIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, X, Bold, Italic, Underline, List, ListOrdered, Quote, LinkIcon, Image, Video, Upload, Type, Heading3, Heading4 } from "lucide-react"
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
    const textarea = document.querySelector('#rich-editor') as HTMLTextAreaElement
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
        const url = prompt('Ingrese la URL:', 'https://')
        if (url) {
          newValue = `[${selectedText || url}](${url})`
        }
        break
      case 'insertImage':
        const imageUrl = prompt('Ingrese la URL de la imagen:', 'https://')
        if (imageUrl) {
          newValue = `![${selectedText || 'Imagen'}](${imageUrl})`
        }
        break
      case 'insertVideo':
        const videoUrl = prompt('Ingrese la URL del video:', 'https://')
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
        id="rich-editor"
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

export default function CreateNewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [homeLocation, setHomeLocation] = useState("repositorio") // Por defecto en repositorio
  const [isPublished, setIsPublished] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [featuredImage, setFeaturedImage] = useState<string>("")
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

  // Generar slug automáticamente cuando cambia el título
  useEffect(() => {
    if (title) {
      setSlug(generateSlug(title))
    }
  }, [title])

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

  // FUNCIÓN DE RE-INDEXACIÓN GLOBAL (El Corazón del Sistema)
  const reorderAllArticles = async (supabase: any) => {
    try {
      console.log("=== RE-INDEXACIÓN GLOBAL INICIADA ===")
      
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
      
      console.log("=== RE-INDEXACIÓN GLOBAL COMPLETADA ===")
      
      // 4. Verificar consistencia final
      await verifyGlobalConsistency(supabase)
      
    } catch (error) {
      console.error('Error en re-indexación global:', error)
      throw error
    }
  }

  // Función de VERIFICACIÓN DE CONSISTENCIA GLOBAL
  const verifyGlobalConsistency = async (supabase: any) => {
    try {
      console.log("=== VERIFICACIÓN DE CONSISTENCIA GLOBAL ===")
      
      const { data: allArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      if (!allArticles) return
      
      // Contar por sección según nueva lógica
      const principal = allArticles.filter(a => a.sort_order === 0).length
      const destacadas = allArticles.filter(a => a.sort_order >= 1 && a.sort_order <= 3).length
      const ultimas = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13).length
      const repositorio = allArticles.filter(a => a.sort_order >= 14).length
      
      console.log(`=== ESTADO FINAL ===`)
      console.log(`- Principal: ${principal} (esperado: 1)`)
      console.log(`- Destacadas: ${destacadas} (esperado: 3)`)
      console.log(`- Últimas: ${ultimas} (esperado: 10)`)
      console.log(`- Repositorio: ${repositorio}`)
      console.log(`- Total: ${allArticles.length}`)
      
      // Verificar duplicados de sort_order (fila india perfecta)
      const sortOrders = allArticles.map(a => a.sort_order)
      const duplicates = sortOrders.filter((order, index) => sortOrders.indexOf(order) !== index)
      
      if (duplicates.length > 0) {
        console.error(`ERROR: Hay ${duplicates.length} sort_order duplicados:`, duplicates)
        throw new Error(`Base de datos inconsistente: ${duplicates.length} sort_order duplicados`)
      } else {
        console.log("✅ No hay duplicados de sort_order - Fila india perfecta")
      }
      
      // Verificar secuencialidad
      const expectedOrders = Array.from({ length: allArticles.length }, (_, i) => i)
      const actualOrders = sortOrders
      const isSequential = JSON.stringify(expectedOrders) === JSON.stringify(actualOrders)
      
      if (!isSequential) {
        console.error("ERROR: Los sort_order no son secuenciales")
        console.error("Esperado:", expectedOrders)
        console.error("Actual:", actualOrders)
        throw new Error("Base de datos inconsistente: sort_order no secuenciales")
      } else {
        console.log("✅ Sort_order son secuenciales - Sistema consistente")
      }
      
    } catch (error) {
      console.error('Error en verificación global:', error)
      throw error
    }
  }

  // Función para determinar home_location dinámicamente según sort_order
  const getHomeLocationByOrder = (order: number): string => {
    if (order === 0) return 'principal'
    if (order >= 1 && order <= 3) return 'destacada'
    if (order >= 4 && order <= 13) return 'ultimas'
    return 'repositorio'
  }

  // Función para determinar is_featured dinámicamente según sort_order
  const getIsFeaturedByOrder = (order: number): boolean => {
    return order <= 3 // Principal (0) y Destacadas (1-3) son featured
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
      
      console.log('=== CREACIÓN CON RE-INDEXACIÓN GLOBAL ===')
      console.log('Título:', title.trim())
      console.log('Ubicación elegida:', homeLocation)
      
      // 1. Determinar sort_order temporal según la ubicación elegida
      let tempSortOrder = 999 // Posición temporal alta
      
      if (homeLocation === "principal") {
        tempSortOrder = 0
      } else if (homeLocation === "destacada") {
        tempSortOrder = 1 // Primera destacada
      } else if (homeLocation === "ultimas") {
        tempSortOrder = 4 // Primera última
      } else {
        tempSortOrder = 14 // Primera del repositorio
      }
      
      console.log(`Insertando noticia temporalmente en orden: ${tempSortOrder}`)
      
      // 2. Crear noticia con sort_order temporal
      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: processedContent,
          category_id: categoryId,
          is_published: isPublished,
          image_url: featuredImage,
          slug: slug.trim() || generateSlug(title.trim()),
          published_at: isPublished ? new Date().toISOString() : null,
          sort_order: tempSortOrder,
          is_featured: tempSortOrder <= 3,
          home_location: getHomeLocationByOrder(tempSortOrder),
          author: 'Rafaela hoy'
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log(`Noticia "${newArticle.title}" insertada temporalmente en orden ${tempSortOrder}`)
      
      // 3. DISPARAR RE-INDEXACIÓN GLOBAL para empujar a todas las demás
      console.log("Disparando re-indexación global...")
      await reorderAllArticles(supabase)
      
      console.log("=== PROCESO DE CREACIÓN COMPLETADO ===")
      
      // Redirigir a la lista
      router.push('/admin')
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar el artículo: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Función de VERIFICACIÓN DE CONSISTENCIA
  const verifyConsistency = async (supabase: any) => {
    try {
      console.log("=== VERIFICACIÓN DE CONSISTENCIA ===")
      
      // Obtener todas las noticias publicadas
      const { data: allArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      if (!allArticles) return
      
      // Contar por sección
      const principal = allArticles.filter(a => a.sort_order === 0).length
      const destacadas = allArticles.filter(a => a.sort_order >= 1 && a.sort_order <= 3).length
      const ultimas = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13).length
      const repositorio = allArticles.filter(a => a.sort_order >= 14).length
      
      console.log(`Consistencia verificada:`)
      console.log(`- Principal: ${principal} (esperado: 1)`)
      console.log(`- Destacadas: ${destacadas} (esperado: 3)`)
      console.log(`- Últimas: ${ultimas} (esperado: 10)`)
      console.log(`- Repositorio: ${repositorio}`)
      console.log(`- Total visible: ${principal + destacadas + ultimas} (esperado: 14)`)
      
      // Verificar si hay duplicados de sort_order
      const sortOrders = allArticles.map(a => a.sort_order)
      const duplicates = sortOrders.filter((order, index) => sortOrders.indexOf(order) !== index)
      
      if (duplicates.length > 0) {
        console.warn(`ADVERTENCIA: Hay ${duplicates.length} sort_order duplicados:`, duplicates)
      } else {
        console.log("No hay duplicados de sort_order")
      }
      
    } catch (error) {
      console.error('Error en verificación de consistencia:', error)
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

          {/* Columna derecha - Configuración y Galería */}
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

              {/* Ubicación en Incio */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="homeLocation">
                  Ubicación en Incio
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
                articleId={undefined} // Sin articleId para creación
                mediaItems={mediaItems}
                onMediaChange={(newMedia) => {
                  setMediaItems(newMedia)
                  // Actualizar la imagen destacada (primera imagen)
                  const firstImage = newMedia.find(item => item.type === 'image')
                  if (firstImage) {
                    setFeaturedImage(firstImage.url)
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
