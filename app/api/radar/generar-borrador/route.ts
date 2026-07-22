import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as cheerio from 'cheerio'

type GenerarBorradorRequest = {
  titulo: string
  url_original: string
  medio: string
}

type GenerarBorradorResponse = {
  tituloNuevo: string
  contenido: string
}

export async function POST(req: Request) {
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
    }
  } catch (error) {
    console.error('Error extrayendo texto del medio:', error)
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Sos un periodista de RafaelaHoy. Reescribí esta noticia del medio ${medio}. Título: ${titulo}. Texto extraído: ${textoExtraido || 'No disponible. Usá tu conocimiento sobre este tema.'}. Escribí un nuevo título atractivo y un borrador de 3 a 4 párrafos con tono objetivo, periodístico y local. Respondé ÚNICAMENTE en formato JSON válido con las claves "tituloNuevo" y "contenido".`

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  })

  const rawText = result.response?.candidates?.[0]?.content?.parts
    ?.map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim()

  if (!rawText) {
    return NextResponse.json({ error: 'No se recibió respuesta de Gemini' }, { status: 500 })
  }

  let parsed: GenerarBorradorResponse

  try {
    parsed = JSON.parse(rawText) as GenerarBorradorResponse
  } catch (error) {
    console.error('Error parseando respuesta de Gemini:', error)
    return NextResponse.json(
      { error: 'Respuesta de Gemini no es JSON válido', raw: rawText },
      { status: 500 },
    )
  }

  if (!parsed.tituloNuevo || !parsed.contenido) {
    return NextResponse.json(
      { error: 'La respuesta de Gemini no contiene el título o el contenido esperado', raw: parsed },
      { status: 500 },
    )
  }

  return NextResponse.json(parsed)
}
