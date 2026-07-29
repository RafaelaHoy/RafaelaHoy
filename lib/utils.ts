import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeVideoUrl(rawUrl: string): string | null {
  if (!rawUrl) {
    return null
  }

  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname

    const isYouTube = host === 'youtu.be' || host.endsWith('youtube.com')
    const isVimeo = host.endsWith('vimeo.com')

    if (isYouTube) {
      let id = ''

      if (host === 'youtu.be') {
        id = parsed.pathname.slice(1)
      } else if (path.startsWith('/embed/')) {
        id = path.split('/').pop() || ''
      } else {
        id = parsed.searchParams.get('v') || path.split('/').pop() || ''
      }

      if (!id) return null
      return `https://www.youtube-nocookie.com/embed/${id}`
    }

    if (isVimeo) {
      const segments = parsed.pathname.split('/').filter(Boolean)
      const id = segments.pop() || ''
      if (!id) return null
      return `https://player.vimeo.com/video/${id}`
    }

    return parsed.href.replace(/^http:/i, 'https:')
  } catch {
    return null
  }
}
