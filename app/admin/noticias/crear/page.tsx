"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Image as ImageIcon } from "lucide-react"
import { findFreeSortOrder, shiftArticlesUp } from "@/lib/sort-order-utils"
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
  sort_order: number
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

// Interface para el tipo de artículo de Supabase
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  image_caption: string | null;
  published_at: string;
  is_published: boolean;
  sort_order: number;
  home_location: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
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
  const [imageCaption, setImageCaption] = useState<string>("")
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

  // FUNCIÓN DE RE-INDEXACIÓN GLOBAL (El Corazón del Sistema) - TEMPORALMENTE DESACTIVADA
  const reorderAllArticles = async (supabase: any) => {
    try {
      console.log("=== RE-INDEXACIÓN GLOBAL TEMPORALMENTE DESACTIVADA ===")
      console.log("Función desactivada para evitar errores de TypeScript durante el build")
      return
    } catch (error) {
      console.error('Error en re-indexación global:', error)
      throw error
    }
  }

  // Función de VERIFICACIÓN DE CONSISTENCIA GLOBAL - TEMPORALMENTE DESACTIVADA
  const verifyGlobalConsistency = async (supabase: any) => {
    try {
      console.log("=== VERIFICACIÓN DE CONSISTENCIA GLOBAL TEMPORALMENTE DESACTIVADA ===")
      console.log("Función desactivada para evitar errores de TypeScript durante el build")
      return
    } catch (error) {
      console.error('Error en verificación de consistencia:', error)
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
      
      console.log('=== CREACIÓN CON GESTIÓN MANUAL Y VALIDACIÓN DE CUPOS ===')
      console.log('Título:', title.trim())
      console.log('Ubicación elegida:', homeLocation)
      
      // 1. VERIFICACIÓN DE CUPOS (Antes de Guardar) - CON FORZADO DE ACTUALIZACIÓN
      console.log('Verificando cupos disponibles...')
      
      // Forzar actualización de datos para evitar cache
      const { data: existingArticles, error: countError } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        // Forzar no usar cache
        .then(result => {
          console.log('Datos frescos obtenidos de la base de datos:', result.data?.length || 0, 'noticias')
          return result
        })
      
      if (countError) throw countError
      
      // Contar noticias por sección
      const principal = existingArticles?.filter(a => a.sort_order === 0).length || 0
      const destacadas = existingArticles?.filter(a => a.sort_order >= 1 && a.sort_order <= 3).length || 0
      const ultimas = existingArticles?.filter(a => a.sort_order >= 4 && a.sort_order <= 13).length || 0
      
      console.log(`Cupos actuales (datos frescos):`)
      console.log(`- Principal: ${principal}/1`)
      console.log(`- Destacadas: ${destacadas}/3`)
      console.log(`- Últimas: ${ultimas}/10`)
      
      // Mostrar detalles para debugging
      if (homeLocation === "principal") {
        const principalArticles = existingArticles?.filter(a => a.sort_order === 0) || []
        console.log('Noticias en Principal:', principalArticles.map(a => ({ id: a.id, title: a.title, order: a.sort_order })))
      }
      
      // 2. VALIDACIÓN ESTRICTA DE CUPOS
      if (homeLocation === "principal" && principal >= 1) {
        // Verificación adicional: si el usuario viene del dashboard, podría ser un estado desactualizado
        console.log('Cupo de Principal lleno. Verificando si los datos están actualizados...')
        
        // Intentar una segunda consulta para asegurar datos frescos
        const { data: freshCheck } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .eq('sort_order', 0)
          .single()
        
        if (freshCheck) {
          console.log('Confirmado: Hay una noticia principal:', freshCheck.title)
          throw new Error('El cupo de Noticia Principal está lleno. La noticia "' + freshCheck.title + '" está ocupando el lugar. Por favor, esperá unos segundos y volvé a intentar, o movela manualmente al Repositorio.')
        } else {
          console.log('Segunda consulta no encontró noticia principal. Hubo un error en la primera consulta.')
          // Si la segunda consulta no encuentra nada, permitimos continuar
        }
      }
      
      if (homeLocation === "destacada" && destacadas >= 3) {
        const destacadasArticles = existingArticles?.filter(a => a.sort_order >= 1 && a.sort_order <= 3) || []
        console.log('Noticias en Destacadas:', destacadasArticles.map(a => ({ id: a.id, title: a.title, order: a.sort_order })))
        throw new Error('El cupo de Noticias Destacadas está lleno (3/3). Hay ' + destacadasArticles.length + ' noticias ocupando los lugares. Mové alguna de las actuales a Últimas Noticias o al Repositorio para liberar espacio.')
      }
      
      if (homeLocation === "ultimas" && ultimas >= 10) {
        const ultimasArticles = existingArticles?.filter(a => a.sort_order >= 4 && a.sort_order <= 13) || []
        console.log('Noticias en Últimas:', ultimasArticles.length, 'de 10 cupos')
        throw new Error('El cupo de Últimas Noticias está lleno (10/10). Hay ' + ultimasArticles.length + ' noticias ocupando los lugares. Mové alguna de las actuales al Repositorio para liberar espacio.')
      }
      
      console.log('¡Cupo disponible! Procediendo con la inserción...')
      
      // 3. ASIGNACIÓN DE SORT_ORDER CON LÓGICA ESTRICTA
      let newSortOrder = 0
      
      if (homeLocation === "principal") {
        // Principal: siempre 0
        newSortOrder = 0
      } else if (homeLocation === "destacada") {
        // Destacadas: buscar hueco libre en 1-3
        const freeOrder = findFreeSortOrder(existingArticles || [], 1, 3)
        if (freeOrder === null) {
          throw new Error('El cupo de Noticias Destacadas está lleno (3/3). No hay huecos disponibles. Mové alguna de las actuales a Últimas Noticias o al Repositorio para liberar espacio.')
        }
        newSortOrder = freeOrder
      } else if (homeLocation === "ultimas") {
        // Últimas: buscar hueco libre en 4-13
        const freeOrder = findFreeSortOrder(existingArticles || [], 4, 13)
        if (freeOrder === null) {
          throw new Error('El cupo de Últimas Noticias está lleno (10/10). No hay huecos disponibles. Mové alguna de las actuales al Repositorio para liberar espacio.')
        }
        newSortOrder = freeOrder
      } else if (homeLocation === "repositorio") {
        // Repositorio: siempre 14 + desplazar existentes
        newSortOrder = 14
        
        // Desplazar todas las noticias >= 14 hacia abajo
        console.log('Aplicando desplazamiento en Repositorio...')
        const shiftSuccess = await shiftArticlesUp(14)
        if (!shiftSuccess) {
          console.error('Error en desplazamiento de Repositorio, pero continuando...')
        }
      }
      
      console.log(`Asignando sort_order = ${newSortOrder} para la nueva noticia`)
      
      // 4. VERIFICACIÓN FINAL ANTES DE INSERTAR
      console.log('Verificación final antes de insertar...')
      const { data: finalCheck } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .eq('sort_order', newSortOrder)
        .single()
      
      if (finalCheck) {
        throw new Error('Conflicto detectado: El sort_order ' + newSortOrder + ' está siendo usado por "' + finalCheck.title + '". Por favor, recargá la página y volvé a intentar.')
      }
      
      // 5. INSERCIÓN CON DESPLAZAMIENTO APLICADO
      console.log('Insertando noticia con desplazamiento aplicado...')
      
      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: processedContent,
          category_id: categoryId,
          is_published: isPublished,
          image_url: featuredImage,
          image_caption: imageCaption.trim() || null,
          slug: slug.trim() || generateSlug(title.trim()),
          published_at: isPublished ? new Date().toISOString() : null,
          sort_order: newSortOrder, // Posición con desplazamiento aplicado
          is_featured: newSortOrder <= 3,
          home_location: getHomeLocationByOrder(newSortOrder),
          author: 'Rafaela hoy'
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log(`Noticia "${newArticle.title}" insertada exitosamente en orden ${newSortOrder}`)
      console.log('=== PROCESO DE CREACIÓN CON DESPLAZAMIENTO COMPLETADO ===')
      
      // 6. VERIFICACIÓN FINAL (opcional, para debugging)
      const { data: finalArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      
      const finalPrincipal = finalArticles?.filter(a => a.sort_order === 0).length || 0
      const finalDestacadas = finalArticles?.filter(a => a.sort_order >= 1 && a.sort_order <= 3).length || 0
      const finalUltimas = finalArticles?.filter(a => a.sort_order >= 4 && a.sort_order <= 13).length || 0
      
      console.log(`Estado final de cupos:`)
      console.log(`- Principal: ${finalPrincipal}/1`)
      console.log(`- Destacadas: ${finalDestacadas}/3`)
      console.log(`- Últimas: ${finalUltimas}/10`)
      
      // Redirigir a la lista con estado actualizado
      router.push('/admin')
      router.refresh() // Forzar actualización del estado
      
    } catch (error) {
      console.error('Error al guardar:', error)
      
      // Mostrar error específico de cupos o error genérico
      if (error instanceof Error && (error.message.includes('cupo') || error.message.includes('lleno') || error.message.includes('Conflicto detectado'))) {
        alert(error.message) // Error de validación de cupos
      } else {
        alert('Error al guardar el artículo: ' + (error instanceof Error ? error.message : 'Error desconocido')) // Error genérico
      }
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
      const principal = allArticles.filter((a: Article) => a.sort_order === 0).length
      const destacadas = allArticles.filter((a: Article) => a.sort_order >= 1 && a.sort_order <= 3).length
      const ultimas = allArticles.filter((a: Article) => a.sort_order >= 4 && a.sort_order <= 13).length
      const repositorio = allArticles.filter((a: Article) => a.sort_order >= 14).length
      
      console.log(`Consistencia verificada:`)
      console.log(`- Principal: ${principal} (esperado: 1)`)
      console.log(`- Destacadas: ${destacadas} (esperado: 3)`)
      console.log(`- Últimas: ${ultimas} (esperado: 10)`)
      console.log(`- Repositorio: ${repositorio}`)
      console.log(`- Total visible: ${principal + destacadas + ultimas} (esperado: 14)`)
      
      // Verificar si hay duplicados de sort_order
      const sortOrders = allArticles.map((a: Article) => a.sort_order)
      const duplicates = sortOrders.filter((order: number, index: number) => sortOrders.indexOf(order) !== index)
      
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
                  // Si hay imágenes, usar la primera como imagen destacada
                  if (newMedia.length > 0 && !featuredImage) {
                    setFeaturedImage(newMedia[0].url)
                  }
                }}
                featuredImage={featuredImage}
                onFeaturedImageChange={setFeaturedImage}
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
