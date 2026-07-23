export type RssSource = {
  id: string
  name: string
  url: string
  feedUrl: string
  category: 'Locales' | 'Regionales' | 'Provinciales' | 'Nacionales' | 'Internacionales'
}

export const RSS_FEEDS: RssSource[] = [
  {
    id: 'diario-castellanos',
    name: 'Diario Castellanos',
    url: 'https://diariocastellanos.com.ar',
    feedUrl: 'https://diariocastellanos.com.ar/feed/',
    category: 'Locales',
  },
  {
    id: 'diario-uno',
    name: 'Diario UNO Santa Fe',
    url: 'https://www.unoentrerios.com.ar',
    feedUrl: 'https://www.unoentrerios.com.ar/rss?section=latest',
    category: 'Regionales',
  },
  {
    id: 'el-litoral',
    name: 'El Litoral',
    url: 'https://www.ellitoral.com',
    feedUrl: 'https://www.ellitoral.com/rss/principal.xml',
    category: 'Provinciales',
  },
  {
    id: 'la-nacion',
    name: 'La Nación',
    url: 'https://www.lanacion.com.ar',
    feedUrl: 'https://www.lanacion.com.ar/rss/ultima-hora/',
    category: 'Nacionales',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://www.reuters.com',
    feedUrl: 'https://www.reuters.com/tools/rss',
    category: 'Internacionales',
  },
]
