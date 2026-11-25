import * as cheerio from 'cheerio'
import { generateWithAiFallback } from '@/lib/services/ai-client'

export type GenerarBorradorInput = {
  titulo: string
  link?: string | null
  copete?: string | null
}

export type GenerarBorradorResult = {
  titulo: string
  extracto: string
  desarrollo: string
  contenido: string
  motor: string
  scraper_exitoso: boolean
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
    return joined.slice(0, 15000)
  }

  const bodyText = normalizeText(source.text()).replace(/\n{3,}/g, '\n\n')
  return bodyText.slice(0, 15000)
}

export async function generarBorradorConIA(input: GenerarBorradorInput): Promise<GenerarBorradorResult> {
  const noticiaTitulo = input.titulo.trim()
  const noticiaLink = input.link?.trim() || ''
  const noticiaSnippet = input.copete?.trim() || ''

  if (!noticiaTitulo) {
    throw new Error('No se recibió el título de la noticia')
  }

  let fullContent = noticiaSnippet
  let scraperExitoso = false

  if (noticiaLink) {
    try {
      const linkResponse = await fetch(noticiaLink, {
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

        if (extractedText && extractedText.length > 150) {
          fullContent = extractedText
          scraperExitoso = true
        }
      }
    } catch (error) {
      console.warn('Scraping con Cheerio falló o fue bloqueado:', error)
    }
  }

  let sourceDetails = ''
  if (scraperExitoso) {
    sourceDetails = `TEXTO COMPLETO DEL ARTÍCULO:\n${fullContent}`
  } else {
    const resumenLimpio =
      noticiaSnippet && noticiaSnippet !== 'Noticia extraída de la portada.'
        ? noticiaSnippet
        : 'Sin resumen adicional disponible.'

    sourceDetails = `NOTA RESILIENTE: El scraping del sitio original fue bloqueado o no estuvo disponible.
Debes basarte EXCLUSIVAMENTE en el título y en el resumen provistos.
REGLA INQUEBRANTABLE: NO inventes datos, cifras, nombres de involucrados ni declaraciones que no figuren textualmente en este texto fuente.
Título: ${noticiaTitulo}
Resumen: ${resumenLimpio}`
  }

  const systemPrompt = `Eres el redactor estrella del diario RafaelaHoy. Tu tarea es redactar una noticia periodística 100% original y profesional a partir del texto fuente provisto.

REGLAS DE REDACCIÓN:
1. REESCRITURA TOTAL: Tienes prohibido copiar oraciones textuales del original. Aplica un parafraseo periodístico profesional, cambiando verbos, estructura y vocabulario.
2. INTEGRIDAD DE DATOS: Mantén intactos nombres de personas, lugares, fechas, cifras y declaraciones textuales entre comillas. Si el contenido fuente es breve, NO inventes información extra.
3. ESTILO: Claro, directo, estilo diario digital local de Rafaela.
4. FORMATO: Devuelve obligatoriamente un JSON válido con la siguiente estructura exacta:
{
  "titulo": "Título nuevo, atractivo y directo",
  "extracto": "Resumen o copete de 2 oraciones",
  "desarrollo": "Cuerpo completo de la noticia. Usá dobles saltos de línea (\\n\\n) entre párrafos. No uses etiquetas HTML."
}`

  const userMessage = `Genera la noticia en JSON con las claves exactas: "titulo", "extracto" y "desarrollo".

${sourceDetails}`

  const { text: generatedText, provider: modelUsed } = await generateWithAiFallback({
    systemPrompt,
    userMessage,
    temperature: 0.7,
    responseFormat: 'json',
  })

  let cleanText = generatedText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanText = jsonMatch[0]
  }

  const parsed = JSON.parse(cleanText) as {
    titulo?: string
    extracto?: string
    desarrollo?: string
    contenido?: string
  }

  const desarrollo = parsed.desarrollo ?? parsed.contenido

  if (!parsed.titulo || !desarrollo || !parsed.extracto) {
    throw new Error('La respuesta del modelo no contiene las claves esperadas (titulo, extracto, desarrollo)')
  }

  return {
    titulo: parsed.titulo,
    extracto: parsed.extracto,
    desarrollo,
    contenido: desarrollo,
    motor: modelUsed,
    scraper_exitoso: scraperExitoso,
  }
}
