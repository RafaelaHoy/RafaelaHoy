// Script para verificar las metaetiquetas Open Graph
// Ejecutar en la consola del navegador en una página de noticia

function debugOpenGraph() {
  console.log('=== DEBUG OPEN GRAPH TAGS ===');
  
  // Verificar metaetiquetas básicas
  const title = document.querySelector('meta[property="og:title"]')?.content;
  const description = document.querySelector('meta[property="og:description"]')?.content;
  const image = document.querySelector('meta[property="og:image"]')?.content;
  const url = document.querySelector('meta[property="og:url"]')?.content;
  const type = document.querySelector('meta[property="og:type"]')?.content;
  const siteName = document.querySelector('meta[property="og:site_name"]')?.content;
  
  console.log('Título:', title);
  console.log('Descripción:', description);
  console.log('Imagen:', image);
  console.log('URL:', url);
  console.log('Tipo:', type);
  console.log('Sitio:', siteName);
  
  // Verificar Twitter Card
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content;
  const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.content;
  const twitterImage = document.querySelector('meta[name="twitter:image"]')?.content;
  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.content;
  
  console.log('\n=== TWITTER CARD ===');
  console.log('Título:', twitterTitle);
  console.log('Descripción:', twitterDescription);
  console.log('Imagen:', twitterImage);
  console.log('Card:', twitterCard);
  
  // Verificar si la imagen existe
  if (image) {
    const img = new Image();
    img.onload = () => console.log('✅ Imagen cargada correctamente');
    img.onerror = () => console.log('❌ Error al cargar la imagen');
    img.src = image;
  }
  
  console.log('===========================');
}

// Ejecutar la función
debugOpenGraph();

// También mostrar el HTML completo del head para inspección
console.log('HTML HEAD:', document.head.innerHTML);
