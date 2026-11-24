export type RssSource = {
  id: string
  name: string
  url: string
  feedUrl: string
  category: 'Locales' | 'Regionales' | 'Provinciales' | 'Nacionales' | 'Internacionales'
}

export const RSS_FEEDS: RssSource[] = [
  { id: 'rafaela-noticias', name: 'Rafaela Noticias', url: 'https://www.rafaelanoticias.com/', feedUrl: 'https://www.rafaelanoticias.com/feed/', category: 'Locales' },
  { id: 'rafaela-informa', name: 'Rafaela Informa', url: 'https://rafaelainforma.com/', feedUrl: 'https://rafaelainforma.com/feed/', category: 'Locales' },
  { id: 'minuto-rafaela', name: 'Minuto Rafaela', url: 'https://minutorafaela.com.ar/', feedUrl: 'https://minutorafaela.com.ar/feed/', category: 'Locales' },
  { id: 'diario-castellanos', name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/', feedUrl: 'https://diariocastellanos.com.ar/feed', category: 'Locales' },
  { id: 'diario-la-opinion', name: 'Diario La Opinión', url: 'https://diariolaopinion.com.ar/', feedUrl: 'https://diariolaopinion.com.ar/feed/', category: 'Locales' },
  { id: 'radio-rafaela', name: 'Radio Rafaela', url: 'https://radiorafaela.com.ar/', feedUrl: 'https://radiorafaelaapiv3.eleco.com.ar/feed-category/noticias', category: 'Locales' },
  { id: 'adn-979', name: 'ADN 97.9', url: 'https://adn979.com/', feedUrl: 'https://adn979.com/feed/', category: 'Locales' },
  { id: 'movil-quique', name: 'Móvil Quique', url: 'https://movilquique.com/', feedUrl: 'https://movilquique.com/feed/', category: 'Regionales' },
  { id: 'sunchales-hoy', name: 'Sunchales Hoy', url: 'https://www.sunchaleshoy.com.ar', feedUrl: 'https://www.sunchaleshoy.com.ar/feed/', category: 'Regionales' },
  { id: 'eco-sunchales', name: 'El Eco de Sunchales', url: 'https://elecodesunchales.com.ar', feedUrl: 'https://elecodesunchales.com.ar/feed/', category: 'Regionales' },
  { id: 'esperanza-dia', name: 'Esperanza Día x día', url: 'https://www.esperanzadiaxdia.com.ar', feedUrl: 'https://www.esperanzadiaxdia.com.ar/feed/', category: 'Regionales' },
  { id: 'reconquista-hoy', name: 'Reconquista Hoy', url: 'https://www.reconquistahoy.com', feedUrl: 'https://www.reconquistahoy.com/feed/', category: 'Regionales' },
  { id: 'el-periodico', name: 'El Periódico', url: 'https://el-periodico.com.ar/', feedUrl: 'https://el-periodico.com.ar/rss.xml', category: 'Regionales' },
  { id: 'radio-morteros', name: 'Radio Morteros', url: 'https://www.radiomorteros.com.ar/', feedUrl: 'https://www.radiomorteros.com.ar/feed/', category: 'Regionales' },
  { id: 'edicion-uno', name: 'Edición Uno Esperanza', url: 'https://edicionuno.com.ar/', feedUrl: 'https://edicionuno.com.ar/?feed=rss2', category: 'Regionales' },
  { id: 'radio-belgrano', name: 'Radio Belgrano Suardi', url: 'https://www.radiobelgranosuardi.com.ar/', feedUrl: 'https://www.radiobelgranosuardi.com.ar/feed/', category: 'Regionales' },
  { id: 'canal-4', name: 'Canal 4 San Cristóbal', url: 'https://canal4sancristobal.com.ar/', feedUrl: 'https://canal4sancristobal.com.ar/feed/', category: 'Regionales' },
  { id: 'avellaneda-hoy', name: 'Avellaneda Hoy', url: 'https://avellanedahoy.com.ar/', feedUrl: 'https://avellanedahoy.com.ar/feed/', category: 'Regionales' },
  { id: 'sin-mordaza', name: 'Sin Mordaza', url: 'https://sinmordaza.com/', feedUrl: 'https://sinmordaza.com/feed', category: 'Provinciales' },
  { id: 'rosario-plus', name: 'Rosario Plus', url: 'https://www.rosarioplus.com/', feedUrl: 'https://www.rosarioplus.com/rss/', category: 'Provinciales' },
  { id: 'radio-eme', name: 'Radio Eme', url: 'https://www.radioeme.com/', feedUrl: 'https://www.radioeme.com/feed/', category: 'Provinciales' },
  { id: 'la-capital', name: 'La Capital', url: 'https://www.lacapital.com.ar/', feedUrl: 'https://www.lacapital.com.ar/rss/general.xml', category: 'Provinciales' },
  { id: 'rosario3', name: 'Rosario3', url: 'https://www.rosario3.com', feedUrl: 'https://www.rosario3.com/rss/general.xml', category: 'Provinciales' },
  { id: 'lt10', name: 'LT10', url: 'https://www.lt10.com.ar/', feedUrl: 'https://www.lt10.com.ar/rss/feed.xml', category: 'Provinciales' },
  { id: 'aire-santa-fe', name: 'Aire de Santa Fe', url: 'https://www.airedesantafe.com.ar', feedUrl: 'https://www.airedesantafe.com.ar/rss/general.xml', category: 'Provinciales' },
  { id: 'el-litoral', name: 'El Litoral', url: 'https://www.ellitoral.com/', feedUrl: 'https://www.ellitoral.com/rss/general.xml', category: 'Provinciales' },
  { id: 'uno-santa-fe', name: 'Uno Santa Fe', url: 'https://www.unosantafe.com.ar', feedUrl: 'https://www.unosantafe.com.ar/rss/general.xml', category: 'Provinciales' },
  { id: 'infobae', name: 'Infobae', url: 'https://www.infobae.com/', feedUrl: 'https://www.infobae.com/arc/outboundfeeds/rss/argentina/', category: 'Nacionales' },
  { id: 'la-nacion', name: 'La Nación', url: 'https://www.lanacion.com.ar/', feedUrl: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/', category: 'Nacionales' },
  { id: 'noticias-argentinas', name: 'Noticias Argentinas', url: 'https://noticiasargentinas.com/', feedUrl: 'https://noticiasargentinas.com/rss.xml', category: 'Nacionales' },
  { id: 'ole', name: 'Olé', url: 'https://www.ole.com.ar/', feedUrl: 'https://www.ole.com.ar/arc/outboundfeeds/rss/', category: 'Nacionales' },
  { id: 'clarin', name: 'Clarín', url: 'https://www.clarin.com', feedUrl: 'https://www.clarin.com/rss/lo-ultimo/', category: 'Nacionales' },
  { id: 'perfil', name: 'Perfil', url: 'https://www.perfil.com', feedUrl: 'https://www.perfil.com/feed', category: 'Nacionales' },
  { id: 'pagina-12', name: 'Página 12', url: 'https://www.pagina12.com.ar', feedUrl: 'https://www.pagina12.com.ar/rss/portada.xml', category: 'Nacionales' },
  { id: 'tn', name: 'TN', url: 'https://tn.com.ar', feedUrl: 'https://tn.com.ar/arc/outboundfeeds/rss/', category: 'Nacionales' },
  { id: 'ambito', name: 'Ámbito', url: 'https://www.ambito.com', feedUrl: 'https://www.ambito.com/rss/home.xml', category: 'Nacionales' },
  { id: 'el-cronista', name: 'El Cronista', url: 'https://www.cronista.com/', feedUrl: 'https://www.cronista.com/arc/outboundfeeds/rss/', category: 'Nacionales' },
  { id: 'c5n', name: 'C5N', url: 'https://www.c5n.com', feedUrl: 'https://www.c5n.com/rss/home.xml', category: 'Nacionales' },
  { id: 'bbc-mundo', name: 'BBC Mundo', url: 'https://www.bbc.com/mundo', feedUrl: 'https://feeds.bbci.co.uk/mundo/rss.xml', category: 'Internacionales' },
  { id: 'dw-espanol', name: 'DW Español', url: 'https://www.dw.com/es/', feedUrl: 'https://rss.dw.com/rdf/rss-spa-all', category: 'Internacionales' },
  { id: 'cnn-espanol', name: 'CNN en Español', url: 'https://cnnespanol.cnn.com/', feedUrl: 'https://cnnespanol.cnn.com/feed/', category: 'Internacionales' },
  { id: 'france-24', name: 'France 24 español', url: 'https://www.france24.com/es/', feedUrl: 'https://www.france24.com/es/rss', category: 'Internacionales' },
]
