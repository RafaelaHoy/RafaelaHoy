import Groq from 'groq-sdk'

export type AiCompletionOptions = {
  systemPrompt: string
  userMessage: string
  temperature?: number
  responseFormat?: 'text' | 'json'
}

export type AiCompletionResult = {
  text: string
  provider: string
}

const DEFAULT_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
]

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getGroqModelChain(): string[] {
  const custom = process.env.GROQ_MODEL?.trim()
  const raw = custom ? [custom, ...DEFAULT_GROQ_MODELS] : DEFAULT_GROQ_MODELS
  return Array.from(new Set(raw.filter(Boolean)))
}

async function callGroqWithFallback(options: AiCompletionOptions): Promise<AiCompletionResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada')
  }

  const groq = new Groq({ apiKey })
  const models = getGroqModelChain()
  let lastError: unknown = null

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userMessage },
        ],
        model,
        temperature: options.temperature ?? 0.7,
        ...(options.responseFormat === 'json'
          ? { response_format: { type: 'json_object' } }
          : {}),
      })

      const text = completion.choices?.[0]?.message?.content?.trim()
      if (!text) {
        throw new Error(`Groq (${model}) devolvió una respuesta vacía`)
      }

      return { text, provider: `groq:${model}` }
    } catch (err: any) {
      lastError = err
      const status = err?.status ?? err?.statusCode
      const code = err?.error?.code ?? err?.code
      console.warn(
        `[AI Client] Groq modelo "${model}" falló (status=${status ?? 'unknown'}, code=${code ?? 'unknown'}):`,
        err instanceof Error ? err.message : String(err),
      )
      // Continuar con el siguiente modelo en la cadena
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError || 'Todos los modelos de Groq fallaron'))
}

async function callSingleGeminiModel(
  model: string,
  apiKey: string,
  options: AiCompletionOptions,
): Promise<{ ok: true; text: string } | { ok: false; status: number; message: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: options.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: options.userMessage }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        ...(options.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    return {
      ok: false,
      status: response.status,
      message: `Gemini (${model}) HTTP ${response.status}: ${errText}`,
    }
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) {
    return {
      ok: false,
      status: 500,
      message: `Gemini (${model}) devolvió una respuesta vacía`,
    }
  }

  return { ok: true, text }
}

async function callGeminiWithFallback(options: AiCompletionOptions): Promise<AiCompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurada')
  }

  let lastMessage = 'Todos los modelos de Gemini fallaron'

  for (const model of GEMINI_MODELS) {
    let result = await callSingleGeminiModel(model, apiKey, options)

    // Si el modelo principal (o cualquiera) devuelve 503 o 429, hacer 1 reintento tras 1.5s
    if (!result.ok && (result.status === 503 || result.status === 429)) {
      console.warn(
        `[AI Client] Gemini "${model}" devolvió ${result.status}. Reintentando en 1.5s...`,
      )
      await sleep(1500)
      result = await callSingleGeminiModel(model, apiKey, options)
    }

    if (result.ok) {
      return { text: result.text, provider: `gemini:${model}` }
    }

    lastMessage = result.message
    console.warn(`[AI Client] ${result.message}. Pasando al siguiente modelo...`)
  }

  throw new Error(lastMessage)
}

/**
 * Ejecuta una petición de IA intentando primero la cadena de Groq y,
 * si falla por completo, pasando automáticamente a la cadena de Gemini.
 */
export async function generateWithAiFallback(
  options: AiCompletionOptions,
): Promise<AiCompletionResult> {
  try {
    return await callGroqWithFallback(options)
  } catch (groqError) {
    console.warn(
      '[AI Client] Cadena Groq agotada, iniciando fallback con Gemini:',
      groqError instanceof Error ? groqError.message : String(groqError),
    )
    try {
      return await callGeminiWithFallback(options)
    } catch (geminiError) {
      const gMsg = groqError instanceof Error ? groqError.message : String(groqError)
      const gemMsg = geminiError instanceof Error ? geminiError.message : String(geminiError)
      throw new Error(`Error en motor de IA: Groq (${gMsg}) | Gemini (${gemMsg})`)
    }
  }
}
