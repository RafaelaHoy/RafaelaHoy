import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import * as cheerio from 'cheerio'

type GenerarBorradorRequest = {
  news?: {
    title?: string
    contentSnippet?: string
    link?: string
  }
  titulo?: string
  url_original?: string
  medio?: string
}

type GenerarBorradorResponse = {
  titulo: string
  extracto: string
  // 'desarrollo' is the new field returned by the model. Keep 'contenido' for compatibility.
  desarrollo?: string
  contenido?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerarBorradorRequest
    const news = body.news || {
      title: body.titulo,
      contentSnippet: (body as any).contentSnippet,
      link: body.url_original,
    }

    console.log('📝 Datos recibidos en el backend:', news?.title)

    if (!news || !news.title) {
      return NextResponse.json({ error: 'No se recibió el título de la noticia' }, { status: 400 })
    }

    const detalles =
      news.contentSnippet && news.contentSnippet !== 'Noticia extraída de la portada.'
        ? news.contentSnippet
        : 'No hay detalles extra. Basate ÚNICAMENTE en el título provisto para armar la nota.'

    let fullContent = detalles
    let scraperExitoso = false

    if (news.link) {
      try {
        // Armamos la URL para pasar a través de ScraperAPI
        const apiKey = process.env.SCRAPER_API_KEY
        const targetUrl = encodeURIComponent(news.link)
        const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${targetUrl}`

        // ScraperAPI se encarga de los headers, proxies y de sortear los bloqueos
        const linkResponse = await fetch(scraperUrl)

        if (linkResponse.ok) {
          const html = await linkResponse.text()
          const $ = cheerio.load(html)

          // Extraemos párrafos, listas y subtítulos para no perder datos duros
          const paragraphs = $('p, li, h2, h3')
            .map((i, el) => $(el).text().trim())
            .get()
            .filter((p) => p && p.length > 20)
          const extractedText = paragraphs.join('\n')

          if (extractedText.length > 200) {
            fullContent = extractedText.substring(0, 3500)
            scraperExitoso = true
          }
        }
      } catch (error) {
        console.error('Error al scrapear el link con ScraperAPI:', error)
      }
    }

    console.log('📊 Estado del Scraper:', scraperExitoso ? 'Éxito' : 'Falló o no se usó')
    console.log('📝 Longitud del texto enviado a la IA:', fullContent.length, 'caracteres')
    console.log('🔍 Muestra del texto:', fullContent.substring(0, 150) + '...')

    // Si el scraper falló y el contenido incluye nuestra frase por defecto, abortamos
    if (!scraperExitoso && fullContent.includes('No hay detalles extra')) {
       return NextResponse.json({ 
         error: 'Scraper bloqueado. No se pudo leer el texto original de la noticia para generar un borrador seguro.' 
       }, { status: 400 });
    }

    const { url_original, medio } = body
    let textoExtraido = ''

    try {
      if (body.url_original) {
        const response = await fetch(body.url_original, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })

        if (response.ok) {
          const html = await response.text()
          const $ = cheerio.load(html)
          const paragraphs = $('p, li, h2, h3')
            .toArray()
            .map((node) => $(node).text().trim())
            .filter(Boolean)
          // Mantener párrafos separados por doble salto de línea para compatibilidad con el frontend
          textoExtraido = paragraphs.join('\n\n').slice(0, 12000)
        } else {
          textoExtraido = ''
        }
      } else {
        textoExtraido = ''
      }
    } catch (error) {
      console.error('Error extrayendo texto del medio:', error)
      textoExtraido = ''
    }

    const groq = new Groq()

    // System prompt estricto: periodista experto y reglas de estilo.
    const systemPrompt = `Eres un periodista experto y redactor principal del diario digital RafaelaHoy. Tu tarea es recibir el texto en bruto de una noticia de otro medio y REESCRIBIRLA por completo para nuestro portal.

REGLAS ESTRICTAS:
- CERO PLAGIO: Cambia la estructura narrativa. No uses las mismas frases que el texto original. Dale un enfoque dinámico y moderno.
- DATOS DUROS: NO OMITAS NINGÚN DATO. Si el texto original menciona cifras, precios, nombres, fechas o listas, DEBES incluirlos todos con precisión.
- TÍTULO: Debe ser ganchero, directo y usar puntuación periodística correcta (incluyendo dos puntos ':' o comillas si es necesario).
- FORMATO: Devuelve la respuesta en formato JSON con la siguiente estructura exacta:
  { "titulo": "TÍTULO AQUÍ", "extracto": "Resumen de 2 oraciones (copete)", "desarrollo": "Cuerpo completo de la noticia, separado en párrafos claros. Usa etiquetas HTML como <br> o <h3> si la nota es larga." }

INSTRUCCIONES IMPORTANTES:
- Devuelve SOLO el JSON válido, sin texto adicional ni bloques de código.
- Mantén todos los caracteres y signos de puntuación tal como corresponda (no elimines ':' u otros signos importantes en títulos o listas).

TEXTO FUENTE:
TEMA OBLIGATORIO: ${news.title}
DETALLES EXTRA: ${fullContent}
`

    const userMessage = `Toma el TEXTO FUENTE provisto en el system prompt y genera el JSON con las claves: titulo, extracto y desarrollo. Usa los datos del TEXTO FUENTE exclusivamente.`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const generatedText = chatCompletion.choices?.[0]?.message?.content?.trim()

    if (!generatedText) {
      return NextResponse.json({ error: 'No se recibió respuesta del modelo' }, { status: 500 })
    }

    // Limpieza robusta antes de parsear
    let cleanText = generatedText
    // Remover posibles bloques de markdown ```json y ```
    cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim()

    // Extraer solo la parte que parece un JSON (entre llaves) por si la IA agregó texto antes o después
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanText = jsonMatch[0]
    }

    let parsed: GenerarBorradorResponse

    try {
      parsed = JSON.parse(cleanText) as GenerarBorradorResponse
    } catch (error) {
      console.error('Error parseando respuesta del modelo:', error)
      return NextResponse.json(
        { error: 'Respuesta del modelo no es JSON válido', raw: cleanText },
        { status: 500 },
      )
    }

    // Aceptar tanto 'desarrollo' (nuevo) como 'contenido' (compatibilidad)
    const desarrollo = parsed.desarrollo ?? parsed.contenido

    if (!parsed.titulo || !desarrollo || !parsed.extracto) {
      return NextResponse.json(
        { error: 'La respuesta del modelo no contiene las claves esperadas (titulo, extracto, desarrollo/contenido)', raw: parsed },
        { status: 500 },
      )
    }

    const output = {
      titulo: parsed.titulo,
      extracto: parsed.extracto,
      desarrollo,
      // Mantener 'contenido' para compatibilidad con frontend existente
      contenido: desarrollo,
    }

    return NextResponse.json(output)
  } catch (error) {
    console.error('Error global en generar borrador:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado al generar el borrador' },
      { status: 500 },
    )
  }
}
