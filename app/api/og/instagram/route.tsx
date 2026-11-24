import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Constantes de rutas para los logos en public/
const LOGO_LIGHT_PATH = path.join(process.cwd(), 'public', 'images', 'logo2.png')
const LOGO_DARK_PATH = path.join(process.cwd(), 'public', 'images', 'logo-dark.png')
const FALLBACK_COVER_PATH = path.join(process.cwd(), 'public', 'og-default-image.jpg')

// Rutas de fuentes Montserrat locales
const FONT_BOLD_PATH = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-Bold.ttf')
const FONT_EXTRABOLD_PATH = path.join(process.cwd(), 'public', 'fonts', 'Montserrat-ExtraBold.ttf')
const FONT_EXTRABOLD_ITALIC_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'Montserrat-ExtraBoldItalic.ttf',
)

type CachedFont = {
  name: string
  data: Buffer
  weight: 700 | 800
  style: 'normal' | 'italic'
}

let cachedFonts: CachedFont[] | null = null

function loadMontserratFonts(): CachedFont[] {
  if (cachedFonts) return cachedFonts

  const fonts: CachedFont[] = []
  try {
    if (fs.existsSync(FONT_BOLD_PATH)) {
      fonts.push({
        name: 'Montserrat',
        data: fs.readFileSync(FONT_BOLD_PATH),
        weight: 700,
        style: 'normal',
      })
    }
    if (fs.existsSync(FONT_EXTRABOLD_PATH)) {
      fonts.push({
        name: 'Montserrat',
        data: fs.readFileSync(FONT_EXTRABOLD_PATH),
        weight: 800,
        style: 'normal',
      })
    }
    if (fs.existsSync(FONT_EXTRABOLD_ITALIC_PATH)) {
      fonts.push({
        name: 'Montserrat',
        data: fs.readFileSync(FONT_EXTRABOLD_ITALIC_PATH),
        weight: 800,
        style: 'italic',
      })
    }
  } catch (err) {
    console.warn('[OG Instagram] Error cargando fuentes Montserrat:', err)
  }

  cachedFonts = fonts
  return fonts
}

export type InstagramTheme = 'azul' | 'rojo' | 'blanco-azul' | 'blanco-rojo'

const THEMES: InstagramTheme[] = ['azul', 'rojo', 'blanco-azul', 'blanco-rojo']

type ThemeConfig = {
  bgGradient: string
  ribbonBg: string
  titleColor: string
  footerTextColor: string
  dotColor: string
  isLightBg: boolean
}

const THEME_CONFIGS: Record<InstagramTheme, ThemeConfig> = {
  azul: {
    bgGradient: 'linear-gradient(180deg, #1B245A 0%, #0D1333 100%)',
    ribbonBg: '#D9232E',
    titleColor: '#FFFFFF',
    footerTextColor: '#FFFFFF',
    dotColor: 'rgba(255, 255, 255, 0.14)',
    isLightBg: false,
  },
  rojo: {
    bgGradient: 'linear-gradient(180deg, #D9232E 0%, #9E141D 100%)',
    ribbonBg: '#1B245A',
    titleColor: '#FFFFFF',
    footerTextColor: '#FFFFFF',
    dotColor: 'rgba(255, 255, 255, 0.16)',
    isLightBg: false,
  },
  'blanco-azul': {
    bgGradient: 'linear-gradient(180deg, #F4F5F7 0%, #E2E4E9 100%)',
    ribbonBg: '#D9232E',
    titleColor: '#1B245A',
    footerTextColor: '#374151',
    dotColor: 'rgba(27, 36, 90, 0.12)',
    isLightBg: true,
  },
  'blanco-rojo': {
    bgGradient: 'linear-gradient(180deg, #F4F5F7 0%, #E2E4E9 100%)',
    ribbonBg: '#1B245A',
    titleColor: '#D9232E',
    footerTextColor: '#374151',
    dotColor: 'rgba(217, 35, 46, 0.12)',
    isLightBg: true,
  },
}

function readImageAsDataUrl(filePath: string, mime = 'image/png'): string | null {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      return `data:${mime};base64,${buffer.toString('base64')}`
    }
  } catch {
    // ignore
  }
  return null
}

async function fetchBufferWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Descarga la imagen de portada de forma segura y garantiza que sea PNG/JPEG/GIF
 * compatible con Satori (ImageResponse). Si viene en .webp, la convierte a JPEG.
 * Si falla, usa la imagen fallback local.
 */
async function loadSafeCoverImageDataUrl(imageUrl?: string | null): Promise<string> {
  const fallback = readImageAsDataUrl(FALLBACK_COVER_PATH, 'image/jpeg') || ''
  if (!imageUrl || !imageUrl.trim()) {
    return fallback
  }

  const trimmedUrl = imageUrl.trim()

  try {
    const isWebpUrl = /\.webp(\?|$)/i.test(trimmedUrl)
    const targetUrl = isWebpUrl
      ? `https://wsrv.nl/?url=${encodeURIComponent(trimmedUrl)}&output=png`
      : trimmedUrl

    let response = await fetchBufferWithTimeout(targetUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar imagen`)
    }

    let contentType = (response.headers.get('content-type') || '').toLowerCase()

    if (contentType.includes('webp')) {
      const convertedUrl = `https://wsrv.nl/?url=${encodeURIComponent(trimmedUrl)}&output=png`
      response = await fetchBufferWithTimeout(convertedUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al convertir webp`)
      }
      contentType = (response.headers.get('content-type') || 'image/png').toLowerCase()
    }

    const isSupportedMime =
      contentType.includes('jpeg') ||
      contentType.includes('jpg') ||
      contentType.includes('png') ||
      contentType.includes('gif')

    if (!isSupportedMime) {
      console.warn(`[OG Instagram] MIME no soportado (${contentType}), usando fallback`)
      return fallback
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const safeMime = contentType.includes('png')
      ? 'image/png'
      : contentType.includes('gif')
        ? 'image/gif'
        : 'image/jpeg'

    return `data:${safeMime};base64,${base64}`
  } catch (err) {
    console.warn('[OG Instagram] Error cargando portada, usando fallback:', err)
    return fallback
  }
}

function pickAutoTheme(id: string, sortOrder?: number | null): InstagramTheme {
  if (typeof sortOrder === 'number' && !Number.isNaN(sortOrder)) {
    return THEMES[Math.abs(sortOrder) % THEMES.length]
  }
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return THEMES[hash % THEMES.length]
}

function getHeadlineStyle(title: string): { fontSize: number; lineHeight: number } {
  const len = title.length
  if (len <= 55) return { fontSize: 60, lineHeight: 1.15 }
  if (len <= 85) return { fontSize: 54, lineHeight: 1.18 }
  if (len <= 115) return { fontSize: 48, lineHeight: 1.18 }
  return { fontSize: 44, lineHeight: 1.18 }
}

function renderHalftoneDots(dotColor: string) {
  const dots: Array<{ cx: number; cy: number; r: number }> = []
  const cols = 10
  const rows = 10
  const spacing = 26

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const distanceFactor = (rows - 1 - row + col) / (rows + cols - 2)
      if (distanceFactor > 0.72) continue
      const r = Math.max(1.5, 5.2 * (1 - distanceFactor / 0.75))
      dots.push({
        cx: 16 + col * spacing,
        cy: 16 + row * spacing,
        r,
      })
    }
  }

  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        display: 'flex',
      }}
    >
      {dots.map((dot, idx) => (
        <circle key={idx} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dotColor} />
      ))}
    </svg>
  )
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const themeParam = req.nextUrl.searchParams.get('theme') as InstagramTheme | null

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, image_url, sort_order, categories(name)')
      .eq('id', id)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 })
    }

    const selectedTheme: InstagramTheme =
      themeParam && THEMES.includes(themeParam)
        ? themeParam
        : pickAutoTheme(article.id, article.sort_order)

    const theme = THEME_CONFIGS[selectedTheme]

    const categoryRaw = Array.isArray(article.categories)
      ? article.categories[0]?.name
      : (article.categories as { name?: string } | null)?.name
    const categoryText = (categoryRaw || 'LOCALES').toUpperCase()

    const titleText = (article.title || 'Rafaela Hoy').trim()
    const { fontSize, lineHeight } = getHeadlineStyle(titleText)

    const coverSrc = await loadSafeCoverImageDataUrl(article.image_url)
    const fonts = loadMontserratFonts()

    const lightLogoDataUrl = readImageAsDataUrl(LOGO_LIGHT_PATH, 'image/png')
    const darkLogoDataUrl = readImageAsDataUrl(LOGO_DARK_PATH, 'image/png')
    const activeLogoSrc = theme.isLightBg ? darkLogoDataUrl : lightLogoDataUrl

    const UPPER_HEIGHT = 562 // ~52% de 1080px
    const LOWER_HEIGHT = 518 // ~48% de 1080px

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1080px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backgroundColor: '#0D1333',
            fontFamily: fonts.length > 0 ? 'Montserrat' : 'sans-serif',
          }}
        >
          {/* Mitad superior (~52%): Foto de portada */}
          <div
            style={{
              width: '1080px',
              height: `${UPPER_HEIGHT}px`,
              display: 'flex',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#111827',
            }}
          >
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={titleText}
                style={{
                  width: '1080px',
                  height: `${UPPER_HEIGHT}px`,
                  objectFit: 'cover',
                }}
              />
            ) : null}
          </div>

          {/* Mitad inferior (~48%): Degradado, halftone, titular y pie */}
          <div
            style={{
              width: '1080px',
              height: `${LOWER_HEIGHT}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              backgroundImage: theme.bgGradient,
              padding: '54px 56px 34px 56px',
            }}
          >
            {/* Patrón halftone en esquina inferior izquierda */}
            {renderHalftoneDots(theme.dotColor)}

            {/* Titular alineado a la izquierda con Montserrat ExtraBold */}
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  color: theme.titleColor,
                  fontSize: `${fontSize}px`,
                  fontWeight: 800,
                  lineHeight,
                  letterSpacing: '-0.02em',
                  textAlign: 'left',
                }}
              >
                {titleText}
              </div>
            </div>

            {/* Pie centrado con logo Rh + rafaelahoy.com */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '18px',
                paddingTop: '14px',
                zIndex: 1,
              }}
            >
              {activeLogoSrc ? (
                <img
                  src={activeLogoSrc}
                  alt="Rafaela Hoy"
                  style={{
                    height: '46px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '40px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                  }}
                >
                  <span style={{ color: theme.isLightBg ? '#1B245A' : '#FFFFFF' }}>R</span>
                  <span style={{ color: '#D9232E' }}>h</span>
                </div>
              )}

              <div
                style={{
                  width: '2px',
                  height: '30px',
                  backgroundColor: theme.isLightBg
                    ? 'rgba(55, 65, 81, 0.35)'
                    : 'rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                }}
              />

              <span
                style={{
                  color: theme.footerTextColor,
                  fontSize: '28px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                }}
              >
                rafaelahoy.com
              </span>
            </div>
          </div>

          {/* Cinta de categoría superpuesta sobre la línea divisoria */}
          <div
            style={{
              position: 'absolute',
              top: `${UPPER_HEIGHT - 32}px`,
              left: 0,
              height: '64px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: '64px',
                backgroundColor: theme.ribbonBg,
                paddingLeft: '56px',
                paddingRight: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#FFFFFF',
                  fontSize: '28px',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  letterSpacing: '0.05em',
                }}
              >
                {categoryText}
              </span>
            </div>

            {/* Corte diagonal a la derecha */}
            <svg width="34" height="64" viewBox="0 0 34 64" style={{ display: 'flex' }}>
              <polygon points="0,0 34,0 0,64" fill={theme.ribbonBg} />
            </svg>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
        fonts: fonts.length > 0 ? fonts : undefined,
      },
    )

    // Materializar el PNG dentro del try/catch para capturar cualquier error de Satori
    const pngBuffer = await imageResponse.arrayBuffer()
    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[OG Instagram] Error generando placa:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error generando imagen de Instagram',
      },
      { status: 500 },
    )
  }
}
