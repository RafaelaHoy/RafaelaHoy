import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generarBorradorConIA } from '@/lib/services/borrador-generator'
import { generateInstagramCaption } from '@/lib/services/instagram-caption'
import { uploadBufferToR2 } from '@/lib/services/media-upload'
import {
  answerTelegramCallbackQuery,
  editTelegramMessageReplyMarkup,
  editTelegramMessageText,
  escapeHtml,
  getBaseUrl,
  sendTelegramDocument,
  sendTelegramMessage,
  type InlineKeyboardButton,
  type InlineKeyboardMarkup,
} from '@/lib/notifications/telegram'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type DraftArticleCardData = {
  id: string
  title: string
  home_location?: string | null
  image_url?: string | null
  categories?: { name?: string } | Array<{ name?: string }> | null
}

const LOCATION_LABELS: Record<string, string> = {
  principal: '⭐ Noticia Principal',
  destacada: '🔥 Noticia Destacada',
  ultimas: '🕒 Últimas Noticias',
  repositorio: '📁 Repositorio (Archivo)',
}

const LOCATION_CODES: Record<
  string,
  { home_location: string; is_featured: boolean; label: string }
> = {
  p: { home_location: 'principal', is_featured: true, label: 'Noticia Principal' },
  d: { home_location: 'destacada', is_featured: true, label: 'Noticia Destacada' },
  u: { home_location: 'ultimas', is_featured: false, label: 'Últimas Noticias' },
  r: { home_location: 'repositorio', is_featured: false, label: 'Repositorio' },
}

function extractCategoryName(
  categories: DraftArticleCardData['categories'],
  fallback = 'Sin categoría',
): string {
  if (Array.isArray(categories)) {
    return categories[0]?.name || fallback
  }
  return categories?.name || fallback
}

function formatLocationLabel(homeLocation?: string | null): string {
  if (!homeLocation) return LOCATION_LABELS.repositorio
  return LOCATION_LABELS[homeLocation] || homeLocation
}

function buildDraftMessage(
  article: DraftArticleCardData,
  categoryName: string,
  _siteUrl: string,
  headerLine = '📝 <b>Borrador listo</b>',
): string {
  const hasPhoto = Boolean(article.image_url && article.image_url.trim())
  const photoStatus = hasPhoto ? '✅ Con foto' : '⚠️ Sin foto'
  const locationLabel = formatLocationLabel(article.home_location)

  return [
    headerLine,
    '',
    `📰 <b>${escapeHtml(article.title)}</b>`,
    `ID: <code>${article.id}</code>`,
    `🏷️ Categoría: <b>${escapeHtml(categoryName)}</b>`,
    `📍 Ubicación: <b>${escapeHtml(locationLabel)}</b>`,
    `🖼️ Portada: <b>${photoStatus}</b>`,
    '',
    'Respondeme este mensaje con una foto para asignarle portada, ajustá los datos o publicala directo:',
  ].join('\n')
}

function buildDraftKeyboard(noticiaId: string, baseUrl: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🏷️ Categoría', callback_data: `cat:${noticiaId}` },
        { text: '📍 Ubicación', callback_data: `loc:${noticiaId}` },
      ],
      [
        { text: '✏️ Editar en panel', url: `${baseUrl}/admin/noticias/editar/${noticiaId}` },
        { text: '🚀 Publicar ahora', callback_data: `publish:${noticiaId}` },
      ],
    ],
  }
}

function buildLocationMenuKeyboard(noticiaId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '⭐ Principal', callback_data: `sl:${noticiaId}:p` },
        { text: '🔥 Destacada', callback_data: `sl:${noticiaId}:d` },
      ],
      [
        { text: '🕒 Últimas', callback_data: `sl:${noticiaId}:u` },
        { text: '📁 Repositorio', callback_data: `sl:${noticiaId}:r` },
      ],
      [{ text: '⬅️ Volver', callback_data: `back:${noticiaId}` }],
    ],
  }
}

function buildIgColorButtons(noticiaId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🔵 Azul', callback_data: `ig:${noticiaId}:azul` },
        { text: '🔴 Rojo', callback_data: `ig:${noticiaId}:rojo` },
      ],
      [
        { text: '⚪🔵 Blanco/Azul', callback_data: `ig:${noticiaId}:blanco-azul` },
        { text: '⚪🔴 Blanco/Rojo', callback_data: `ig:${noticiaId}:blanco-rojo` },
      ],
    ],
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function textToHtmlParagraphs(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('<p>')) return trimmed
  return trimmed
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

export async function POST(req: Request) {
  try {
    // 1. Validar secret token del webhook (si está configurado)
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret) {
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token')
      if (headerSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const update = await req.json().catch(() => null)
    if (!update) {
      return NextResponse.json({ ok: true })
    }

    const authorizedChatId = process.env.TELEGRAM_CHAT_ID
    const baseUrl = getBaseUrl()
    const supabase = createAdminClient()

    // -------------------------------------------------------------------------
    // CASO A: Callback Query (botones inline)
    // -------------------------------------------------------------------------
    if (update.callback_query) {
      const cb = update.callback_query
      const callbackId: string = cb.id
      const data: string = cb.data || ''
      const chatId = cb.message?.chat?.id
      const messageId: number | undefined = cb.message?.message_id
      const originalText: string = cb.message?.text || ''

      // Verificar que el chat coincida con el administrador autorizado
      if (authorizedChatId && String(chatId) !== String(authorizedChatId)) {
        await answerTelegramCallbackQuery(callbackId, 'Chat no autorizado.', true)
        return NextResponse.json({ ok: true, ignored: true })
      }

      const [action, targetId, extraParam] = data.split(':')

      // --- 1. DESCARTAR NOTICIA DEL RADAR ---
      if (action === 'discard' && targetId) {
        await answerTelegramCallbackQuery(callbackId, 'Descartando noticia...')

        await supabase
          .from('radar_noticias')
          .update({ descartado: true })
          .eq('id', targetId)

        if (chatId && messageId) {
          const updatedText = originalText
            ? `${escapeHtml(originalText)}\n\n❌ <b>Descartada</b>`
            : '❌ <b>Descartada</b>'
          await editTelegramMessageText(chatId, messageId, updatedText)
        }

        return NextResponse.json({ ok: true })
      }

      // --- 2. CREAR BORRADOR CON IA ---
      if (action === 'draft' && targetId) {
        await answerTelegramCallbackQuery(callbackId, 'Generando borrador con IA...')

        try {
          const { data: radarItem, error: radarError } = await supabase
            .from('radar_noticias')
            .select('id, titulo, url_original, medio, categoria, copete')
            .eq('id', targetId)
            .single()

          if (radarError || !radarItem) {
            await sendTelegramMessage(
              '❌ No se encontró la noticia en el radar (puede haber sido purgada).',
              'HTML',
              undefined,
              chatId,
            )
            return NextResponse.json({ ok: true })
          }

          const borrador = await generarBorradorConIA({
            titulo: radarItem.titulo,
            link: radarItem.url_original,
            copete: radarItem.copete,
          })

          // Categoría por defecto
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name, slug')
            .order('name', { ascending: true })

          const defaultCategory =
            categories?.find(
              (c: any) =>
                c.slug?.toLowerCase() === 'locales' || c.name?.toLowerCase() === 'locales',
            ) || categories?.[0]

          if (!defaultCategory) {
            throw new Error('No se encontró ninguna categoría en Supabase')
          }

          // Siguiente sort_order en repositorio (>= 14)
          const { data: repoArticles } = await supabase
            .from('articles')
            .select('sort_order')
            .gte('sort_order', 14)
            .order('sort_order', { ascending: false })
            .limit(1)

          const nextSortOrder =
            repoArticles && repoArticles.length > 0 ? repoArticles[0].sort_order + 1 : 14

          // Slug único
          let finalSlug = generateSlug(borrador.titulo) || `noticia-${Date.now()}`
          const { data: existingSlug } = await supabase
            .from('articles')
            .select('id')
            .eq('slug', finalSlug)
            .maybeSingle()

          if (existingSlug) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`
          }

          const htmlContent = textToHtmlParagraphs(borrador.desarrollo)
          const nowIso = new Date().toISOString()

          const { data: createdArticle, error: insertError } = await supabase
            .from('articles')
            .insert({
              title: borrador.titulo.trim(),
              excerpt: borrador.extracto.trim(),
              content: htmlContent,
              category_id: defaultCategory.id,
              is_published: false,
              image_url: null,
              image_caption: null,
              slug: finalSlug,
              published_at: nowIso,
              created_at: nowIso,
              sort_order: nextSortOrder,
              is_featured: false,
              home_location: 'repositorio',
              author: 'Rafaela hoy',
            })
            .select('id, title, home_location, image_url')
            .single()

          if (insertError || !createdArticle) {
            throw new Error(insertError?.message || 'Error insertando borrador en Supabase')
          }

          if (chatId && messageId) {
            await editTelegramMessageReplyMarkup(chatId, messageId)
          }

          const draftMessage = buildDraftMessage(
            createdArticle,
            defaultCategory.name,
            baseUrl,
            `📝 <b>Borrador generado (${escapeHtml(borrador.motor)})</b>`,
          )

          await sendTelegramMessage(
            draftMessage,
            'HTML',
            buildDraftKeyboard(createdArticle.id, baseUrl),
            chatId,
          )
        } catch (draftError) {
          console.error('[Telegram Webhook] Error en draft:', draftError)
          await sendTelegramMessage(
            `❌ Error generando borrador: ${escapeHtml(draftError instanceof Error ? draftError.message : String(draftError))}`,
            'HTML',
            undefined,
            chatId,
          )
        }

        return NextResponse.json({ ok: true })
      }

      // --- 3. SUBMENÚ DE CATEGORÍAS (cat:<noticia_id>) ---
      if (action === 'cat' && targetId && chatId && messageId) {
        await answerTelegramCallbackQuery(callbackId)

        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (!categories || categories.length === 0) {
          return NextResponse.json({ ok: true })
        }

        const rows: InlineKeyboardButton[][] = []
        for (let i = 0; i < categories.length; i += 2) {
          const row: InlineKeyboardButton[] = [
            { text: categories[i].name, callback_data: `sc:${targetId}:${i}` },
          ]
          if (categories[i + 1]) {
            row.push({
              text: categories[i + 1].name,
              callback_data: `sc:${targetId}:${i + 1}`,
            })
          }
          rows.push(row)
        }
        rows.push([{ text: '⬅️ Volver', callback_data: `back:${targetId}` }])

        await editTelegramMessageReplyMarkup(chatId, messageId, { inline_keyboard: rows })
        return NextResponse.json({ ok: true })
      }

      // --- 4. SELECCIONAR CATEGORÍA (sc:<noticia_id>:<index>) ---
      if (action === 'sc' && targetId && extraParam !== undefined && chatId && messageId) {
        const idx = Number(extraParam)
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        const chosen = !Number.isNaN(idx) && categories ? categories[idx] : null
        if (!chosen) {
          await answerTelegramCallbackQuery(callbackId, 'Categoría inválida', true)
          return NextResponse.json({ ok: true })
        }

        const { data: updatedArticle, error: upError } = await supabase
          .from('articles')
          .update({ category_id: chosen.id })
          .eq('id', targetId)
          .select('id, title, home_location, image_url')
          .single()

        if (upError || !updatedArticle) {
          await answerTelegramCallbackQuery(callbackId, 'Error al actualizar categoría', true)
          return NextResponse.json({ ok: true })
        }

        await answerTelegramCallbackQuery(callbackId, 'Categoría actualizada')

        const updatedMsg = buildDraftMessage(
          updatedArticle,
          chosen.name,
          baseUrl,
          '📝 <b>Borrador actualizado</b>',
        )
        await editTelegramMessageText(
          chatId,
          messageId,
          updatedMsg,
          buildDraftKeyboard(targetId, baseUrl),
        )
        return NextResponse.json({ ok: true })
      }

      // --- 5. SUBMENÚ DE UBICACIÓN (loc:<noticia_id>) ---
      if (action === 'loc' && targetId && chatId && messageId) {
        await answerTelegramCallbackQuery(callbackId)
        await editTelegramMessageReplyMarkup(
          chatId,
          messageId,
          buildLocationMenuKeyboard(targetId),
        )
        return NextResponse.json({ ok: true })
      }

      // --- 6. SELECCIONAR UBICACIÓN (sl:<noticia_id>:<codigo_corto>) ---
      if (action === 'sl' && targetId && extraParam && chatId && messageId) {
        const locSpec = LOCATION_CODES[extraParam]
        if (!locSpec) {
          await answerTelegramCallbackQuery(callbackId, 'Ubicación inválida', true)
          return NextResponse.json({ ok: true })
        }

        // Determinar sort_order acorde a la lógica de app/admin/noticias/crear/page.tsx
        let newSortOrder = 14
        if (locSpec.home_location === 'principal') {
          newSortOrder = 0
        } else if (locSpec.home_location === 'destacada') {
          const { data: occupied } = await supabase
            .from('articles')
            .select('sort_order')
            .in('sort_order', [1, 2, 3])
          const used = new Set((occupied || []).map((a) => a.sort_order))
          newSortOrder = [1, 2, 3].find((n) => !used.has(n)) ?? 1
        } else if (locSpec.home_location === 'ultimas') {
          const slots = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
          const { data: occupied } = await supabase
            .from('articles')
            .select('sort_order')
            .in('sort_order', slots)
          const used = new Set((occupied || []).map((a) => a.sort_order))
          newSortOrder = slots.find((n) => !used.has(n)) ?? 4
        } else {
          const { data: repoArticles } = await supabase
            .from('articles')
            .select('sort_order')
            .gte('sort_order', 14)
            .order('sort_order', { ascending: false })
            .limit(1)
          newSortOrder =
            repoArticles && repoArticles.length > 0 ? repoArticles[0].sort_order + 1 : 14
        }

        const { data: updatedArticle, error: upError } = await supabase
          .from('articles')
          .update({
            home_location: locSpec.home_location,
            is_featured: locSpec.is_featured,
            sort_order: newSortOrder,
          })
          .eq('id', targetId)
          .select('id, title, home_location, image_url, categories(name)')
          .single()

        if (upError || !updatedArticle) {
          await answerTelegramCallbackQuery(callbackId, 'Error al actualizar ubicación', true)
          return NextResponse.json({ ok: true })
        }

        await answerTelegramCallbackQuery(callbackId, 'Ubicación actualizada')

        const categoryName = extractCategoryName(updatedArticle.categories)
        const updatedMsg = buildDraftMessage(
          updatedArticle,
          categoryName,
          baseUrl,
          '📝 <b>Borrador actualizado</b>',
        )
        await editTelegramMessageText(
          chatId,
          messageId,
          updatedMsg,
          buildDraftKeyboard(targetId, baseUrl),
        )
        return NextResponse.json({ ok: true })
      }

      // --- 7. VOLVER AL TECLADO PRINCIPAL (back:<noticia_id>) ---
      if (action === 'back' && targetId && chatId && messageId) {
        await answerTelegramCallbackQuery(callbackId)
        await editTelegramMessageReplyMarkup(
          chatId,
          messageId,
          buildDraftKeyboard(targetId, baseUrl),
        )
        return NextResponse.json({ ok: true })
      }

      // --- 8. PUBLICAR NOTICIA DIRECTAMENTE ---
      if (action === 'publish' && targetId) {
        await answerTelegramCallbackQuery(callbackId, 'Publicando noticia...')

        const { data: published, error: pubError } = await supabase
          .from('articles')
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .eq('id', targetId)
          .select('id, title, slug')
          .single()

        if (pubError || !published) {
          await sendTelegramMessage(
            `❌ No se pudo publicar la noticia (${escapeHtml(pubError?.message || 'No encontrada')}).`,
            'HTML',
            undefined,
            chatId,
          )
          return NextResponse.json({ ok: true })
        }

        if (chatId && messageId) {
          await editTelegramMessageReplyMarkup(chatId, messageId)
        }

        const publicUrl = `${baseUrl}/noticia/${published.slug}`
        await sendTelegramMessage(
          `✅ <b>¡Noticia publicada!</b>\n\n📰 ${escapeHtml(published.title)}\n🔗 ${publicUrl}\n\n🎨 Elegí el color de la placa para Instagram:`,
          'HTML',
          buildIgColorButtons(published.id),
          chatId,
        )

        return NextResponse.json({ ok: true })
      }

      // --- 9. GENERAR Y ENVIAR PLACA DE INSTAGRAM SIN COMPRESIÓN ---
      if (action === 'ig' && targetId) {
        const selectedTheme = extraParam || 'azul'
        await answerTelegramCallbackQuery(callbackId, 'Generando placa en alta calidad...')

        try {
          const { data: article, error: artError } = await supabase
            .from('articles')
            .select('id, title, excerpt, content, categories(name)')
            .eq('id', targetId)
            .single()

          if (artError || !article) {
            await sendTelegramMessage(
              '❌ No se encontró la noticia para generar la placa.',
              'HTML',
              undefined,
              chatId,
            )
            return NextResponse.json({ ok: true })
          }

          const categoryName = extractCategoryName(article.categories, 'Locales')
          const igCaption = await generateInstagramCaption({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: categoryName,
          })

          const igPlateUrl = `${baseUrl}/api/og/instagram?id=${article.id}&theme=${encodeURIComponent(selectedTheme)}`
          const sent = await sendTelegramDocument(
            igPlateUrl,
            escapeHtml(igCaption),
            chatId,
            `placa-instagram-${selectedTheme}.png`,
          )

          if (!sent) {
            await sendTelegramMessage(
              '⚠️ No se pudo enviar la placa en alta calidad. Verificá los logs del servidor.',
              'HTML',
              undefined,
              chatId,
            )
          }
        } catch (igError) {
          console.error('[Telegram Webhook] Error generando placa IG:', igError)
          await sendTelegramMessage(
            `❌ Error generando la placa: ${escapeHtml(igError instanceof Error ? igError.message : String(igError))}`,
            'HTML',
            undefined,
            chatId,
          )
        }

        return NextResponse.json({ ok: true })
      }

      await answerTelegramCallbackQuery(callbackId)
      return NextResponse.json({ ok: true })
    }

    // -------------------------------------------------------------------------
    // CASO B: Mensaje con foto respondiendo a un borrador del bot
    // -------------------------------------------------------------------------
    if (update.message?.photo && update.message?.reply_to_message) {
      const msg = update.message
      const chatId = msg.chat?.id

      if (authorizedChatId && String(chatId) !== String(authorizedChatId)) {
        return NextResponse.json({ ok: true, ignored: true })
      }

      const repliedText: string = msg.reply_to_message.text || msg.reply_to_message.caption || ''
      const idMatch = repliedText.match(/ID:\s*([a-f0-9-]{36}|[a-zA-Z0-9_-]+)/i)

      if (!idMatch || !idMatch[1]) {
        await sendTelegramMessage(
          '⚠️ No encontré el <code>ID: ...</code> de la noticia en el mensaje al que respondiste.',
          'HTML',
          undefined,
          chatId,
        )
        return NextResponse.json({ ok: true })
      }

      const noticiaId = idMatch[1].trim()
      const token = process.env.TELEGRAM_BOT_TOKEN
      if (!token) {
        return NextResponse.json({ ok: true })
      }

      try {
        // Tomar la foto de mayor resolución
        const photos = msg.photo as Array<{ file_id: string }>
        const highestResPhoto = photos[photos.length - 1]

        // Obtener file_path vía getFile
        const getFileRes = await fetch(
          `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(highestResPhoto.file_id)}`,
        )
        const getFileJson = await getFileRes.json()

        if (!getFileRes.ok || !getFileJson?.ok || !getFileJson?.result?.file_path) {
          throw new Error('No se pudo obtener la ruta de la imagen desde Telegram')
        }

        const filePath: string = getFileJson.result.file_path
        const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg'
        const contentType =
          ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

        // Descargar imagen desde Telegram
        const fileDownloadRes = await fetch(
          `https://api.telegram.org/file/bot${token}/${filePath}`,
        )
        if (!fileDownloadRes.ok) {
          throw new Error(`Error descargando imagen de Telegram (${fileDownloadRes.status})`)
        }

        const arrayBuffer = await fileDownloadRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Subir al storage del panel (Cloudflare R2)
        const { url: publicImageUrl } = await uploadBufferToR2(
          buffer,
          `portada-${noticiaId}.${ext}`,
          contentType,
        )

        // Registrar en tabla media (opcional para galería, no bloqueante)
        await supabase
          .from('media')
          .insert({
            type: 'image',
            url: publicImageUrl,
            alt_text: `Portada noticia ${noticiaId}`,
            caption: null,
          })
          .then(({ error }) => {
            if (error) console.warn('[Telegram Webhook] No se pudo registrar en tabla media:', error.message)
          })

        // Asignar portada en la noticia y traer estado actualizado para la tarjeta
        const { data: updatedArticle, error: updateError } = await supabase
          .from('articles')
          .update({ image_url: publicImageUrl })
          .eq('id', noticiaId)
          .select('id, title, home_location, image_url, categories(name)')
          .single()

        if (updateError || !updatedArticle) {
          throw new Error(updateError?.message || 'No se encontró la noticia para asignar portada')
        }

        const categoryName = extractCategoryName(updatedArticle.categories)
        const replyMsg = buildDraftMessage(
          updatedArticle,
          categoryName,
          baseUrl,
          '📸 <b>¡Portada asignada correctamente!</b>',
        )

        await sendTelegramMessage(
          replyMsg,
          'HTML',
          buildDraftKeyboard(updatedArticle.id, baseUrl),
          chatId,
        )
      } catch (photoError) {
        console.error('[Telegram Webhook] Error procesando foto:', photoError)
        await sendTelegramMessage(
          `❌ Error al subir la portada: ${escapeHtml(photoError instanceof Error ? photoError.message : String(photoError))}`,
          'HTML',
          undefined,
          chatId,
        )
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error general:', error)
    return NextResponse.json({ ok: true })
  }
}
