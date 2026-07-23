import { load } from 'cheerio'

const medios = [
  { name: 'Rafaela Noticias', url: 'https://www.rafaelanoticias.com/' },
  { name: 'Rafaela Informa', url: 'https://rafaelainforma.com/' },
  { name: 'Minuto Rafaela', url: 'https://minutorafaela.com.ar/' },
  { name: 'Diario Castellanos', url: 'https://diariocastellanos.com.ar/' },
  { name: 'Diario La Opinión', url: 'https://diariolaopinion.com.ar/' },
  { name: 'Radio Rafaela', url: 'https://radiorafaela.com.ar/' },
  { name: 'ADN 97.9', url: 'https://adn979.com/' },
  { name: 'Móvil Quique', url: 'https://movilquique.com/' },
  { name: 'Sunchales Hoy', url: 'https://www.sunchaleshoy.com.ar' },
  { name: 'El Eco de Sunchales', url: 'https://elecodesunchales.com.ar' },
  { name: 'Esperanza Día x día', url: 'https://www.esperanzadiaxdia.com.ar' },
  { name: 'Reconquista Hoy', url: 'https://www.reconquistahoy.com' },
  { name: 'El Periódico', url: 'https://el-periodico.com.ar/' },
  { name: 'Radio Morteros', url: 'https://www.radiomorteros.com.ar/' },
  { name: 'Edición Uno Esperanza', url: 'https://edicionuno.com.ar/' },
  { name: 'Radio Belgrano Suardi', url: 'https://www.radiobelgranosuardi.com.ar/' },
  { name: 'Canal 4 San Cristóbal', url: 'https://canal4sancristobal.com.ar/' },
  { name: 'Avellaneda Hoy', url: 'https://avellanedahoy.com.ar/' },
  { name: 'Sin Mordaza', url: 'https://sinmordaza.com/' },
  { name: 'Rosario Plus', url: 'https://www.rosarioplus.com/' },
  { name: 'Radio Eme', url: 'https://www.radioeme.com/' },
  { name: 'La Capital', url: 'https://www.lacapital.com.ar/' },
  { name: 'Rosario3', url: 'https://www.rosario3.com' },
  { name: 'LT10', url: 'https://www.lt10.com.ar/' },
  { name: 'Aire de Santa Fe', url: 'https://www.airedesantafe.com.ar' },
  { name: 'El Litoral', url: 'https://www.ellitoral.com/' },
  { name: 'Uno Santa Fe', url: 'https://www.unosantafe.com.ar' },
  { name: 'Infobae', url: 'https://www.infobae.com/' },
  { name: 'La Nación', url: 'https://www.lanacion.com.ar/' },
  { name: 'Noticias Argentinas', url: 'https://noticiasargentinas.com/' },
  { name: 'Olé', url: 'https://www.ole.com.ar/' },
  { name: 'Clarín', url: 'https://www.clarin.com' },
  { name: 'Perfil', url: 'https://www.perfil.com' },
  { name: 'Página 12', url: 'https://www.pagina12.com.ar' },
  { name: 'TN', url: 'https://tn.com.ar' },
  { name: 'Ámbito', url: 'https://www.ambito.com' },
  { name: 'El Cronista', url: 'https://www.cronista.com/' },
  { name: 'C5N', url: 'https://www.c5n.com' },
  { name: 'BBC Mundo', url: 'https://www.bbc.com/mundo' },
  { name: 'DW Español', url: 'https://www.dw.com/es/' },
  { name: 'CNN en Español', url: 'https://cnnespanol.cnn.com/' },
  { name: 'France 24 español', url: 'https://www.france24.com/es/' },
]

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3',
}

async function main() {
  for (const medio of medios) {
    try {
      const response = await fetch(medio.url, { headers })
      const html = await response.text()
      const $ = load(html)

      const feedUrl =
        $('link[rel="alternate"][type="application/rss+xml"]').first().attr('href') ||
        $('link[rel="alternate"][type="application/atom+xml"]').first().attr('href') ||
        $('link[rel="alternate"][type="application/rdf+xml"]').first().attr('href') ||
        null

      if (feedUrl) {
        console.log(`${medio.name} -> ${feedUrl}`)
      } else {
        console.log(`${medio.name} -> FEED NO ENCONTRADO`)
      }
    } catch (error) {
      console.log(`${medio.name} -> ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

main()
