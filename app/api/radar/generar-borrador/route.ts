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

const normalizeText = (value: string) =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim()

const isNoiseText = (value: string) => {
  const clean = value.trim().toLowerCase()
  return (
    clean.length < 3 ||
    /^(publicidad|advertencia|suscribite|seguinos|compartí|compartir|comentarios|leer más|sigue leyendo|más noticias|cargando|ver más)$/i.test(
      clean,
    )
  )
}

const extractRobustArticleText = (html: string) => {
  const $ = cheerio.load(html)

  $('script, style, noscript, iframe, svg, form, button, nav, footer, header, aside, .ad, .advertisement, [class*="share"], [class*="comment"], [class*="related"]').remove()

  const root = $('article, main, .article-body, .entry-content, .news-content, .post-content, .content, .body').first()
  const source = root.length ? root : $('body')

  source.find('br').replaceWith('\n')

  const extractedBlocks = source
    .find('p, li, h2, h3, div, span')
    .toArray()
    .map((el) => normalizeText($(el).text()))
    .filter((text) => !isNoiseText(text) && text.length > 2)

  const dedupedBlocks = extractedBlocks.filter((text, index, arr) => arr.indexOf(text) === index)

  const joined = dedupedBlocks.join('\n\n')
  if (joined.length > 120) {
    return joined.slice(0, 3500)
  }

  const bodyText = normalizeText(source.text()).replace(/\n{3,}/g, '\n\n')
  return bodyText.slice(0, 3500)
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
        const linkResponse = await fetch(news.link, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.7,en;q=0.5',
          },
          redirect: 'follow',
        })

        if (linkResponse.ok) {
          const html = await linkResponse.text()
          const extractedText = extractRobustArticleText(html)

          if (extractedText.length > 200) {
            fullContent = extractedText
            scraperExitoso = true
          }
        }
      } catch (error) {
        console.error('Error al scrapear el link nativamente con cheerio:', error)
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
          textoExtraido = extractRobustArticleText(html).slice(0, 12000)
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

    // Prompt orientado a un tono periodístico natural y fluido, con flexibilidad para subtítulos.
    const systemPrompt = `Eres el periodista principal de RafaelaHoy y tu trabajo es reescribir una noticia ajena con un estilo ágil, claro, directo y con voz periodística propia de nuestro medio.

Objetivo:
- Tomar el texto fuente y convertirlo en una nota natural para nuestro portal, manteniendo la información esencial y la densidad factual.
- Priorizar una lectura fluida, con ritmo de diario, sin sonar mecánico ni robótico.
- Si el texto original incluye listas de personas (por ejemplo, jugadores convocados), fechas, montos, valores, datos duros o nombres de referencia, es OBLIGATORIO integrarlos completos en el desarrollo sin omitir ningún nombre ni dato clave.

Reglas de estilo:
1. Mantén el 100% de la información relevante. No cortes listas ni nombres. Si aparece una nómina, la versión final debe reflejarla completa.
2. Usá subtítulos solo cuando realmente ordenen la lectura o ayuden a guiar al lector. No los fuerces a cada tramo ni conviertas la nota en un esquema artificial.
3. Reescribí con una voz periodística natural, con buena cadencia, una entrada sólida, y un desarrollo que suene a RafaelaHoy: claro, vivo, sin enunciados rígidos.
4. Si hay citas textuales, fechas, datos concretos o nombres propios, mantenelos íntegros y evitá deformarlos.
5. No menciones periodistas, medios o fuentes competidores.
6. Devuelve JSON con esta estructura exacta:
  {
    "titulo": "Título aquí",
    "extracto": "Resumen de 2 oraciones (copete)",
    "desarrollo": "Cuerpo completo de la noticia. Usá dobles saltos de línea (\n\n) entre párrafos, listas y subtítulos cuando corresponda. No uses etiquetas HTML ni <br> ni <p>."
  }

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
