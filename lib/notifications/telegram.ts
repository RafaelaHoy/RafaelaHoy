export type NoticiaNotificacion = {
  id?: string
  titulo: string
  url_original: string
  medio: string
  categoria?: string
  copete?: string | null
  fecha_publicacion?: string | null
}

export type InlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string }

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][]
}

export const getBaseUrl = () => {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://rafaelahoy.com'
}

export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Envío de mensaje individual a Telegram usando fetch nativo
 */
export async function sendTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  replyMarkup?: InlineKeyboardMarkup,
  chatIdOverride?: string | number,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = chatIdOverride ?? process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    }

    if (replyMarkup) {
      payload.reply_markup = replyMarkup
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.warn(`[Telegram API] Error ${response.status}: ${errBody}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram API] Error enviando mensaje:', error)
    return false
  }
}

export async function sendTelegramPhoto(
  photoUrl: string,
  caption?: string,
  chatIdOverride?: string | number,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = chatIdOverride ?? process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption || '',
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.warn(`[Telegram API] Error sendPhoto ${response.status}: ${errBody}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram API] Error enviando foto:', error)
    return false
  }
}

export async function sendTelegramDocument(
  imageUrl: string,
  caption?: string,
  chatIdOverride?: string | number,
  fileName = 'placa-instagram.png',
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = chatIdOverride ?? process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return false
  }

  try {
    const imageRes = await fetch(imageUrl, { cache: 'no-store' })
    if (!imageRes.ok) {
      throw new Error(`No se pudo descargar la imagen (${imageRes.status})`)
    }

    const arrayBuffer = await imageRes.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: 'image/png' })

    const formData = new FormData()
    formData.append('chat_id', String(chatId))
    formData.append('document', blob, fileName)
    if (caption) {
      formData.append('caption', caption)
      formData.append('parse_mode', 'HTML')
    }

    const url = `https://api.telegram.org/bot${token}/sendDocument`
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      console.warn(`[Telegram API] Error sendDocument ${response.status}: ${errBody}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram API] Error enviando documento:', error)
    return false
  }
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    })
  } catch (error) {
    console.error('[Telegram API] Error en answerCallbackQuery:', error)
  }
}

export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup
    }

    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('[Telegram API] Error en editMessageText:', error)
  }
}

export async function editTelegramMessageReplyMarkup(
  chatId: string | number,
  messageId: number,
  replyMarkup?: InlineKeyboardMarkup,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup ?? { inline_keyboard: [] },
      }),
    })
  } catch (error) {
    console.error('[Telegram API] Error en editMessageReplyMarkup:', error)
  }
}

/**
 * Notifica noticias estrictamente nuevas detectadas por el radar
 * - Si son entre 1 y 5, envía una notificación por cada una con botones interactivos
 * - Si son más de 5, envía un resumen agrupado para evitar spam
 */
export async function notifyTelegramNewNews(noticias: NoticiaNotificacion[]): Promise<void> {
  if (!noticias || noticias.length === 0) return

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return
  }

  const baseUrl = getBaseUrl()

  // Caso: Hasta 5 noticias nuevas (notificaciones individuales detalladas con botones interactivos)
  if (noticias.length <= 5) {
    for (const item of noticias) {
      const medioEsc = escapeHtml(item.medio || 'Medio local')
      const tituloEsc = escapeHtml(item.titulo || 'Sin título')

      let copeteLimpio = ''
      if (item.copete && item.copete !== 'Noticia extraída de la portada.') {
        copeteLimpio = escapeHtml(item.copete.slice(0, 220)) + (item.copete.length > 220 ? '...' : '')
      }

      const adminUrl = `${baseUrl}/admin?tab=radar`

      const message = [
        `📰 <b>${medioEsc}</b>`,
        `📌 <b>${tituloEsc}</b>`,
        copeteLimpio ? `📝 <i>${copeteLimpio}</i>` : '',
        '',
        `🔗 <a href="${item.url_original}">Leer nota original</a>`,
        `⚡ <a href="${adminUrl}">Abrir Radar en Panel Admin</a>`,
      ]
        .filter(Boolean)
        .join('\n')

      const replyMarkup: InlineKeyboardMarkup | undefined = item.id
        ? {
            inline_keyboard: [
              [
                { text: '✍️ Crear borrador', callback_data: `draft:${item.id}` },
                { text: '❌ Descartar', callback_data: `discard:${item.id}` },
              ],
            ],
          }
        : undefined

      await sendTelegramMessage(message, 'HTML', replyMarkup)
    }
    return
  }

  // Caso: Más de 5 noticias nuevas (mensaje agrupado / digest anti-spam)
  const maxList = 10
  const itemsAMostrar = noticias.slice(0, maxList)
  const restantes = noticias.length - maxList

  const lines = [
    `🚨 <b>Radar Rafaela Hoy: ${noticias.length} nuevas noticias detectadas</b>`,
    '',
    ...itemsAMostrar.map((n, i) => {
      const medio = escapeHtml(n.medio)
      const tit = escapeHtml(n.titulo)
      return `<b>${i + 1}. [${medio}]</b> <a href="${n.url_original}">${tit}</a>`
    }),
  ]

  if (restantes > 0) {
    lines.push('', `<i>... y ${restantes} noticias más ingresadas.</i>`)
  }

  lines.push('', `⚡ <a href="${baseUrl}/admin?tab=radar">Ir al Radar en el Panel Admin</a>`)

  await sendTelegramMessage(lines.join('\n'), 'HTML')
}
