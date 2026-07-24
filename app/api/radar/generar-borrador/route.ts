import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import * as cheerio from 'cheerio'

type GenerarBorradorRequest = {
  titulo: string
  url_original: string
  medio: string
}

type GenerarBorradorResponse = {
  titulo: string
  extracto: string
  contenido: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerarBorradorRequest
    const { titulo, url_original, medio } = body

    if (!titulo || !url_original || !medio) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    let textoExtraido = ''

    try {
      const response = await fetch(url_original, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (response.ok) {
        const html = await response.text()
        const $ = cheerio.load(html)
        const paragraphs = $('p')
          .toArray()
          .map((node) => $(node).text().trim())
          .filter(Boolean)
        textoExtraido = paragraphs.join('\n\n').slice(0, 12000)
      } else {
        textoExtraido = ''
      }
    } catch (error) {
      console.error('Error extrayendo texto del medio:', error)
      textoExtraido = ''
    }

    const groq = new Groq()

    const prompt = `
Sos un redactor periodístico profesional para el portal de noticias digital "RafaelaHoy" (Rafaela, Santa Fe y la región).
Tu objetivo es reescribir noticias a partir de textos de otros medios, adaptándolas a un formato ágil y claro, garantizando que el texto sea 100% original para evitar el plagio.

REGLAS ESTRICTAS DE REDACCIÓN:
1. Cero Plagio: Reescribí completamente el texto fuente. Cambiá la estructura gramatical, usá sinónimos y reformulá frases sin perder la precisión de los datos (nombres, fechas, lugares, cifras).
2. Tono y Estilo: Claro, noticioso, dinámico y neutro-local (lenguaje periodístico argentino).
3. Concisión: Párrafos cortos de 2 a 3 oraciones como máximo. Ve directo al punto.
4. TEXTO LIMPIO (SIN HTML NI MARKDOWN): Entregá texto puro. NO uses etiquetas HTML. Para separar párrafos, usá estrictamente los caracteres literales '\\n\\n' (barra invertida y letra n). Si necesitás poner un subtítulo, escribilo en MAYÚSCULAS.

TEXTO FUENTE:
Título original: \${news.title}
Información: \${news.contentSnippet || news.link}

INSTRUCCIONES DE SALIDA:
Devolvé ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin texto adicional, ni bloques de código markdown alrededor):
{
  "titulo": "Título informativo, directo y ganchero (sin punto final)",
  "extracto": "Breve síntesis (2 a 3 oraciones) que amplíe la información clave del título.",
  "contenido": "Acá va el desarrollo completo de la noticia, con párrafos cortos separados por saltos de línea (\\n\\n). Texto 100% limpio, sin HTML."
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' }, // <-- Agregar para forzar JSON
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

    if (!parsed.titulo || !parsed.contenido || !parsed.extracto) {
      return NextResponse.json(
        { error: 'La respuesta del modelo no contiene las claves esperadas (titulo, extracto, contenido)', raw: parsed },
        { status: 500 },
      )
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error global en generar borrador:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado al generar el borrador' },
      { status: 500 },
    )
  }
}
