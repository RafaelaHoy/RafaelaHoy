import Groq from 'groq-sdk'

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

async function callGroqText(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada')
  }

  const groq = new Groq({ apiKey })
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
  })

  const text = completion.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new Error('Groq devolvió una respuesta vacía')
  }
  return text
}

async function callGeminiText(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) {
    throw new Error('Gemini devolvió una respuesta vacía')
  }
  return text
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
    return await callGroqText(systemPrompt, userMessage)
  } catch (groqError) {
    console.warn('[Instagram Caption] Groq falló, intentando con Gemini 2.5 Flash:', groqError)
    try {
      return await callGeminiText(systemPrompt, userMessage)
    } catch (geminiError) {
      console.warn('[Instagram Caption] Gemini también falló, usando fallback seguro:', geminiError)
      return buildSafeFallback(input)
    }
  }
}
