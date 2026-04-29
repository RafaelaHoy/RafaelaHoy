"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { findFreeSortOrder, shiftArticlesUp } from "@/lib/sort-order-utils"
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
  // Limpiar el texto primero
  let html = markdown.trim()
  
  // Procesar en el orden correcto para evitar conflictos
  
  // 1. Headers (antes que párrafos)
  html = html
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
  
  // 2. Bold e Italic (antes que párrafos para evitar conflictos)
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
  
  // 3. Underline
  html = html.replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
  
  // 4. Links e Images
  html = html
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
  
  // 5. Blockquotes
  html = html.replace(/^> (.+$)/gim, '<blockquote>$1</blockquote>')
  
  // 6. Lists (procesar líneas múltiples juntas)
  html = html
    // Unordered lists - juntar items consecutivos
    .replace(/^- (.+)(?:\n- (.+))*/g, (match) => {
      const items = match.split('\n- ').map(item => item.replace(/^- /, '').trim())
      return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>'
    })
    // Ordered lists - juntar items consecutivos
    .replace(/^1\. (.+)(?:\n1\. (.+))*/g, (match) => {
      const items = match.split('\n1. ').map(item => item.replace(/^1\. /, '').trim())
      return '<ol>' + items.map(item => `<li>${item}</li>`).join('') + '</ol>'
    })
  
  // 7. Procesar párrafos (al final)
  html = html
    // Dividir en líneas
    .split('\n')
    // Procesar cada línea
    .map(line => {
      const trimmed = line.trim()
      // Si la línea ya es HTML o está vacía, dejarla como está
      if (!trimmed || trimmed.startsWith('<') || trimmed.startsWith('</')) {
        return line
      }
      // Envolver en párrafo
      return `<p>${trimmed}</p>`
    })
    // Unir todo
    .join('\n')
  
  // 8. Limpiar párrafos vacíos
  html = html.replace(/<p><\/p>/g, '')
  
  return html
}

// Función para limpiar HTML escapado y convertirlo a HTML válido
const cleanEscapedHTML = (html: string): string => {
  let cleaned = html
  
  // Primero: Detectar y reemplazar etiquetas HTML escapadas comunes
  cleaned = cleaned.replace(/&lt;p&gt;/g, '<p>')
  cleaned = cleaned.replace(/&lt;\/p&gt;/g, '</p>')
  cleaned = cleaned.replace(/&lt;br&gt;/g, '<br>')
  cleaned = cleaned.replace(/&lt;br\s*\/?&gt;/g, '<br>')
  cleaned = cleaned.replace(/&lt;strong&gt;/g, '<strong>')
  cleaned = cleaned.replace(/&lt;\/strong&gt;/g, '</strong>')
  cleaned = cleaned.replace(/&lt;em&gt;/g, '<em>')
  cleaned = cleaned.replace(/&lt;\/em&gt;/g, '</em>')
  cleaned = cleaned.replace(/&lt;u&gt;/g, '<u>')
  cleaned = cleaned.replace(/&lt;\/u&gt;/g, '</u>')
  cleaned = cleaned.replace(/&lt;h3&gt;/g, '<h3>')
  cleaned = cleaned.replace(/&lt;\/h3&gt;/g, '</h3>')
  cleaned = cleaned.replace(/&lt;h4&gt;/g, '<h4>')
  cleaned = cleaned.replace(/&lt;\/h4&gt;/g, '</h4>')
  cleaned = cleaned.replace(/&lt;blockquote&gt;/g, '<blockquote>')
  cleaned = cleaned.replace(/&lt;\/blockquote&gt;/g, '</blockquote>')
  cleaned = cleaned.replace(/&lt;ul&gt;/g, '<ul>')
  cleaned = cleaned.replace(/&lt;\/ul&gt;/g, '</ul>')
  cleaned = cleaned.replace(/&lt;ol&gt;/g, '<ol>')
  cleaned = cleaned.replace(/&lt;\/ol&gt;/g, '</ol>')
  cleaned = cleaned.replace(/&lt;li&gt;/g, '<li>')
  cleaned = cleaned.replace(/&lt;\/li&gt;/g, '</li>')
  cleaned = cleaned.replace(/&lt;a href=/g, '<a href=')
  cleaned = cleaned.replace(/&lt;\/a&gt;/g, '</a>')
  cleaned = cleaned.replace(/&lt;img src=/g, '<img src=')
  cleaned = cleaned.replace(/&gt;/g, '>')
  cleaned = cleaned.replace(/&lt;/g, '<')
  
  // Segundo: Detectar etiquetas HTML escritas literalmente (no escapadas)
  // Esto maneja casos como "<p><p>Texto" donde las etiquetas están escritas como texto
  cleaned = cleaned.replace(/<p><p>/g, '<p>')
  cleaned = cleaned.replace(/<\/p><\/p>/g, '</p>')
  cleaned = cleaned.replace(/<p><\/p>/g, '')
  cleaned = cleaned.replace(/<br><br>/g, '<br>')
  cleaned = cleaned.replace(/<br\s*\/><br\s*\/>/g, '<br>')
  
  // Tercero: Corregir párrafos múltiples concatenados
  cleaned = cleaned.replace(/(<p>)(<p>)+/g, '<p>')
  cleaned = cleaned.replace(/(<\/p>)(<\/p>)+/g, '</p>')
  
  // Cuarto: Asegurar espaciado correcto entre párrafos
  cleaned = cleaned.replace(/<\/p><p>/g, '</p>\n<p>')
  cleaned = cleaned.replace(/<\/p>([^<\s])/g, '</p>\n$1')
  
  return cleaned
}

// Función para convertir HTML a Markdown (para edición)
const htmlToMarkdown = (html: string): string => {
  // Primero limpiar HTML escapado
  let markdown = cleanEscapedHTML(html)
  
  // 1. Headers
  markdown = markdown
    .replace(/<h3>(.*?)<\/h3>/g, '### $1')
    .replace(/<h4>(.*?)<\/h4>/g, '#### $1')
  
  // 2. Bold e Italic
  markdown = markdown
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
  
  // 3. Underline
  markdown = markdown.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
  
  // 4. Links
  markdown = markdown.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')
  
  // 5. Images
  markdown = markdown.replace(/<img src="(.*?)" alt="(.*?)".*?>/g, '![$2]($1)')
  
  // 6. Blockquotes
  markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')
  
  // 7. Lists
  markdown = markdown
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (match, content) => {
      return content.replace(/<li>([\s\S]*?)<\/li>/g, '- $1')
    })
    .replace(/<ol>([\s\S]*?)<\/ol>/g, (match, content) => {
      return content.replace(/<li>([\s\S]*?)<\/li>/g, '1. $1')
    })
  
  // 8. Párrafos - convertir a líneas separadas con espaciado visible
  markdown = markdown
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')  // Doble salto de línea para párrafos
    .replace(/\n\n\n+/g, '\n\n')        // Limpiar múltiples saltos
    .replace(/\n\s*\n/g, '\n\n')        // Asegurar saltos consistentes
    .trim()
  
  return markdown
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
        className="min-h-[400px] w-full p-4 focus:outline-none bg-white resize-none border-0 ltr text-left touch-manipulation-auto text-base md:text-sm prose prose-sm max-w-none [&>p]:mb-4 [&>p]:mt-4 [&>h3]:mt-6 [&>h3]:mb-4 [&>h4]:mt-4 [&>h4]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:my-4"
        style={{ 
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal',
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          touchAction: 'manipulation',
          lineHeight: '1.6',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
  const [originalHomeLocation, setOriginalHomeLocation] = useState("")
  const [sortOrder, setSortOrder] = useState<number | null>(null) // Orden manual
  const [originalSortOrder, setOriginalSortOrder] = useState<number | null>(null) // Orden original
  const [occupiedOrders, setOccupiedOrders] = useState<{ destacadas: number[], ultimas: number[] }>({ destacadas: [], ultimas: [] })
  const [isPublished, setIsPublished] = useState(false)
  const [originalSlug, setOriginalSlug] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [imageCaption, setImageCaption] = useState("")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [slug, setSlug] = useState("")
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Función para generar slug a partir del título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim() // Primero limpiamos espacios reales a los costados
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitamos acentos
      .replace(/[^a-z0-9\s-]/g, "") // Quitamos caracteres especiales
      .replace(/\s+/g, "-") // Reemplazamos espacios por guiones
      .replace(/-+/g, "-") // Evitamos guiones duplicados
      .replace(/^-+|-+$/g, ""); // Limpiamos guiones en los extremos
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
      // Convertir HTML a Markdown para la edición
      console.log('=== DEBUG HTML LIMPIEZA ===')
      console.log('HTML original:', data.content || "")
      const cleanedHTML = cleanEscapedHTML(data.content || "")
      console.log('HTML limpiado:', cleanedHTML)
      const markdownContent = htmlToMarkdown(data.content || "")
      console.log('Markdown resultante:', markdownContent)
      console.log('==========================')
      setContent(markdownContent)
      setCategoryId(data.category_id || "")
      setHomeLocation(data.home_location || "repositorio")
      setOriginalHomeLocation(data.home_location || "repositorio")
      setSortOrder(data.sort_order || null)
      setOriginalSortOrder(data.sort_order || null)
      setIsPublished(data.is_published || false)
      setFeaturedImage(data.image_url || "")
      setImageCaption(data.image_caption || "")
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

  // Cargar órdenes ocupados
  const loadOccupiedOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('articles')
        .select('sort_order')
        .in('sort_order', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
        .neq('id', articleId) // Excluir artículo actual
      
      if (error) throw error
      
      const destacadas = data?.filter(a => a.sort_order >= 1 && a.sort_order <= 3).map(a => a.sort_order) || []
      const ultimas = data?.filter(a => a.sort_order >= 4 && a.sort_order <= 13).map(a => a.sort_order) || []
      
      setOccupiedOrders({ destacadas, ultimas })
    } catch (error) {
      console.error('Error cargando órdenes ocupados:', error)
    }
  }

  // Cargar órdenes ocupados al montar y cuando cambia la ubicación
  useEffect(() => {
    if (articleId) {
      loadOccupiedOrders()
    }
  }, [articleId])

  // Resetear sort_order cuando cambia la ubicación
  useEffect(() => {
    setSortOrder(null)
  }, [homeLocation])

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
          // La noticia principal existente se queda publicada, solo se actualiza la nueva
          // No hacemos nada con la existente, simplemente dejamos que la nueva tome su lugar
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

    // Validar sort_order si es requerido
    if ((homeLocation === "destacada" || homeLocation === "ultimas") && sortOrder === null) {
      alert("Por favor selecciona un número de orden para esta ubicación")
      return
    }

    setSaving(true)
    
    try {
      const supabase = createClient()
      
      // Procesar Markdown a HTML
      const processedContent = processMarkdownToHTML(content.trim())
      
      console.log('=== EDICIÓN CON GESTIÓN MANUAL DE ORDEN ===')
      console.log('Título:', title.trim())
      console.log('Ubicación actual:', originalHomeLocation)
      console.log('Nueva ubicación:', homeLocation)
      console.log('Orden actual:', originalSortOrder)
      console.log('Nuevo orden:', sortOrder)
      
      // Validar que el orden no esté ocupado (excepto si es el mismo)
      if (sortOrder !== null && sortOrder !== originalSortOrder) {
        const isOccupied = homeLocation === "destacada" 
          ? occupiedOrders.destacadas.includes(sortOrder)
          : occupiedOrders.ultimas.includes(sortOrder)
        
        if (isOccupied) {
          alert(`El orden ${sortOrder} ya está ocupado por otra noticia. Por favor selecciona otro.`)
          setSaving(false)
          return
        }
      }
      
      // Determinar sort_order final
      let finalSortOrder: number
      if (homeLocation === "principal") {
        finalSortOrder = 0
      } else if (homeLocation === "destacada" || homeLocation === "ultimas") {
        finalSortOrder = sortOrder!
      } else {
        // Repositorio: buscar el siguiente orden disponible
        const { data: repoArticles } = await supabase
          .from('articles')
          .select('sort_order')
          .gte('sort_order', 14)
          .order('sort_order', { ascending: false })
          .limit(1)
        
        finalSortOrder = repoArticles && repoArticles.length > 0 ? repoArticles[0].sort_order + 1 : 14
      }
      
      console.log(`Orden final asignado: ${finalSortOrder}`)
      
      // Actualizar artículo con nuevo sort_order manual
      const { data, error } = await supabase
        .from('articles')
        .update({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: processedContent,
          category_id: categoryId,
          is_published: isPublished,
          image_url: featuredImage,
          image_caption: imageCaption.trim() || null,
          slug: slug.trim() || generateSlug(title.trim()),
          sort_order: finalSortOrder,
          is_featured: finalSortOrder <= 3,
          home_location: getHomeLocationByOrder(finalSortOrder),
          author: 'Rafaela hoy'
        })
        .eq('id', articleId)
        .select()
        .single()

      if (error) throw error

      console.log(`Noticia actualizada exitosamente con orden ${finalSortOrder}`)
      console.log('=== EDICIÓN CON ORDEN MANUAL COMPLETADA ===')
      
      // Refrescar caché y redirigir al panel principal
      router.refresh()
      router.push('/admin')
      
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar el artículo: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // Función para determinar home_location dinámicamente según sort_order
  const getHomeLocationByOrder = (order: number): string => {
    if (order === 0) return 'principal'
    if (order >= 1 && order <= 3) return 'destacada'
    if (order >= 4 && order <= 13) return 'ultimas'
    return 'repositorio'
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
                <p className="text-xs text-muted-foreground">
                  {homeLocation === "principal" && "Cupo: 1. Si ya existe una, será movida al repositorio."}
                  {homeLocation === "destacada" && "Cupo: 3. Si hay 3, la más antigua será movida al repositorio."}
                  {homeLocation === "ultimas" && "Cupo: 10. Si hay 10, la más antigua será movida al repositorio."}
                  {homeLocation === "repositorio" && "La noticia solo estará disponible en el repositorio y búsqueda."}
                </p>
              </div>

              {/* Selector de Orden (solo para Destacadas y Últimas) */}
              {(homeLocation === "destacada" || homeLocation === "ultimas") && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="sortOrder">
                    Número de Orden <span className="text-red-500">*</span>
                  </Label>
                  <Select value={sortOrder?.toString() || ""} onValueChange={(value) => setSortOrder(value ? parseInt(value) : null)} disabled={saving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {homeLocation === "destacada" ? (
                        // Órdenes para Destacadas: 1, 2, 3
                        [1, 2, 3].map((order) => (
                          <SelectItem 
                            key={order} 
                            value={order.toString()}
                            disabled={occupiedOrders.destacadas.includes(order) && order !== originalSortOrder}
                          >
                            {order} {occupiedOrders.destacadas.includes(order) && order !== originalSortOrder && "(Ocupado)"}
                            {order === originalSortOrder && " (Actual)"}
                          </SelectItem>
                        ))
                      ) : (
                        // Órdenes para Últimas: 4 al 13
                        Array.from({ length: 10 }, (_, i) => i + 4).map((order) => (
                          <SelectItem 
                            key={order} 
                            value={order.toString()}
                            disabled={occupiedOrders.ultimas.includes(order) && order !== originalSortOrder}
                          >
                            {order} {occupiedOrders.ultimas.includes(order) && order !== originalSortOrder && "(Ocupado)"}
                            {order === originalSortOrder && " (Actual)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {homeLocation === "destacada" 
                      ? "Selecciona la posición (1-3). Las opciones marcadas como 'Ocupado' no están disponibles, excepto tu posición actual."
                      : "Selecciona la posición (4-13). Las opciones marcadas como 'Ocupado' no están disponibles, excepto tu posición actual."
                    }
                  </p>
                </div>
              )}

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
                // @ts-ignore
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
              
              {/* Pie de Imagen */}
              <div className="mt-4">
                <Label htmlFor="imageCaption" className="text-sm font-medium">
                  Pie de Imagen (Opcional)
                </Label>
                <Input
                  id="imageCaption"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Descripción breve que aparecerá debajo de la imagen principal"
                  className="mt-2"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
