import { generateWithAiFallback } from '@/lib/services/ai-client'

export type InstagramCaptionInput = {
  title: string
  excerpt?: string | null
  content?: string | null
  category?: string | null
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSafeFallback(input: InstagramCaptionInput): string {
  const baseText = (input.excerpt || input.title || '').trim()
  const shortText =
    baseText.length > 220 ? `${baseText.slice(0, 217).trim()}...` : baseText

  return `${shortText}\n\n➡️ Toda la info en el link de nuestra bio.\n\n#Noticias #Actualidad #Locales #Rafaela #RafaelaHoy`
}

export async function generateInstagramCaption(
  input: InstagramCaptionInput,
): Promise<string> {
  const title = (input.title || '').trim()
  const excerpt = (input.excerpt || '').trim()
  const category = (input.category || 'Locales').trim()
  const cleanContent = input.content ? stripHtml(input.content).slice(0, 2500) : ''

  if (!title && !excerpt) {
    return buildSafeFallback(input)
  }

  const systemPrompt = `Eres el community manager editorial del diario digital @rafaela.hoy. Tu única tarea es redactar el caption para Instagram de una noticia siguiendo UNA ESTRUCTURA ESTRICTA.

Devuelve ÚNICAMENTE el texto final del caption (sin explicaciones, sin comillas envolventes, sin markdown), respetando exactamente estas 3 partes separadas por una línea en blanco:

1. Párrafo 1: Un único párrafo breve y periodístico (máximo 25 a 35 palabras, 1 o 2 oraciones) que resuma el dato clave (cuándo, dónde y qué pasó) sin repetir textualmente el titular.
2. Línea exacta:
➡️ Toda la info en el link de nuestra bio.
3. Exactamente 5 hashtags en una sola línea (CamelCase, ortografía limpia): los primeros 3 temáticos relacionados a la noticia y su categoría (por ejemplo #Policiales #Inseguridad #Robo), y los últimos 2 SIEMPRE fijos al final: #Rafaela #RafaelaHoy`

  const userMessage = `Redacta el caption de Instagram para esta noticia:
Categoría: ${category}
Titular: ${title}
Copete/Extracto: ${excerpt || 'Sin extracto'}
Contenido: ${cleanContent || 'Sin contenido adicional'}`

  try {
    const { text } = await generateWithAiFallback({
      systemPrompt,
      userMessage,
      temperature: 0.6,
      responseFormat: 'text',
    })
    return text
  } catch (err) {
    console.warn('[Instagram Caption] Fallaron todos los motores de IA, usando fallback seguro:', err)
    return buildSafeFallback(input)
  }
}
