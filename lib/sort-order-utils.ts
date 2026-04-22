import { createClient } from './supabase/client'

interface Article {
  id: string
  title: string
  sort_order: number
  home_location?: string
  is_featured?: boolean
}

/**
 * Función utilitaria para consolidar y corregir los sort_order
 * Elimina duplicados y asegura que cada noticia tenga el sort_order correcto
 * según su categoría actual
 */
export async function fixSortOrders(): Promise<{ success: boolean; message: string; fixed: number }> {
  try {
    const supabase = createClient()
    
    console.log('=== INICIANDO CONSOLIDACIÓN DE SORT_ORDERS ===')
    
    // 1. Obtener todas las noticias publicadas
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('id, title, sort_order, home_location, is_featured')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    if (!allArticles || allArticles.length === 0) {
      return { success: true, message: 'No hay noticias para procesar', fixed: 0 }
    }
    
    console.log(`Procesando ${allArticles.length} noticias...`)
    
    // 2. Agrupar por categoría actual
    const principal = allArticles.filter(a => a.sort_order === 0)
    const destacadas = allArticles.filter(a => a.sort_order >= 1 && a.sort_order <= 3)
    const ultimas = allArticles.filter(a => a.sort_order >= 4 && a.sort_order <= 13)
    const repositorio = allArticles.filter(a => a.sort_order >= 14)
    
    console.log(`Distribución actual:`)
    console.log(`- Principal: ${principal.length} noticias`)
    console.log(`- Destacadas: ${destacadas.length} noticias`)
    console.log(`- Últimas: ${ultimas.length} noticias`)
    console.log(`- Repositorio: ${repositorio.length} noticias`)
    
    // 3. Detectar duplicados
    const sortOrders = allArticles.map(a => a.sort_order)
    const duplicates = sortOrders.filter((order, index) => sortOrders.indexOf(order) !== index)
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Se detectaron duplicados: ${duplicates.join(', ')}`)
    } else {
      console.log('✅ No se detectaron duplicados')
    }
    
    // 4. Reconstruir orden correcto
    const updates: { id: string; sort_order: number; home_location: string; is_featured: boolean }[] = []
    
    // Principal: solo la primera (sort_order = 0)
    if (principal.length > 0) {
      const principalArticle = principal[0]
      updates.push({
        id: principalArticle.id,
        sort_order: 0,
        home_location: 'principal',
        is_featured: true
      })
    }
    
    // Destacadas: hasta 3 noticias (sort_order = 1, 2, 3)
    const sortedDestacadas = destacadas.sort((a, b) => a.sort_order - b.sort_order)
    for (let i = 0; i < Math.min(sortedDestacadas.length, 3); i++) {
      updates.push({
        id: sortedDestacadas[i].id,
        sort_order: i + 1,
        home_location: 'destacada',
        is_featured: true
      })
    }
    
    // Últimas: hasta 10 noticias (sort_order = 4 al 13)
    const sortedUltimas = ultimas.sort((a, b) => a.sort_order - b.sort_order)
    for (let i = 0; i < Math.min(sortedUltimas.length, 10); i++) {
      updates.push({
        id: sortedUltimas[i].id,
        sort_order: i + 4,
        home_location: 'ultimas',
        is_featured: false
      })
    }
    
    // Repositorio: el resto (sort_order = 14 en adelante)
    const sortedRepositorio = repositorio.sort((a, b) => a.sort_order - b.sort_order)
    for (let i = 0; i < sortedRepositorio.length; i++) {
      updates.push({
        id: sortedRepositorio[i].id,
        sort_order: i + 14,
        home_location: 'repositorio',
        is_featured: false
      })
    }
    
    // 5. Aplicar actualizaciones
    let fixedCount = 0
    for (const update of updates) {
      const { data: currentArticle } = await supabase
        .from('articles')
        .select('sort_order, home_location, is_featured')
        .eq('id', update.id)
        .single()
      
      // Solo actualizar si hay cambios
      if (
        currentArticle?.sort_order !== update.sort_order ||
        currentArticle?.home_location !== update.home_location ||
        currentArticle?.is_featured !== update.is_featured
      ) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            sort_order: update.sort_order,
            home_location: update.home_location,
            is_featured: update.is_featured
          })
          .eq('id', update.id)
        
        if (updateError) {
          console.error(`Error actualizando artículo ${update.id}:`, updateError)
        } else {
          console.log(`✅ Artículo ${update.id} actualizado: sort_order ${update.sort_order}`)
          fixedCount++
        }
      }
    }
    
    console.log(`=== CONSOLIDACIÓN COMPLETADA ===`)
    console.log(`Total actualizaciones: ${fixedCount}`)
    
    return {
      success: true,
      message: `Consolidación completada. ${fixedCount} noticias actualizadas.`,
      fixed: fixedCount
    }
    
  } catch (error) {
    console.error('Error en fixSortOrders:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      fixed: 0
    }
  }
}

/**
 * Encuentra el hueco libre más bajo en un rango de sort_order
 */
export function findFreeSortOrder(articles: Article[], minOrder: number, maxOrder: number): number | null {
  const usedOrders = articles
    .filter(a => a.sort_order >= minOrder && a.sort_order <= maxOrder)
    .map(a => a.sort_order)
  
  for (let i = minOrder; i <= maxOrder; i++) {
    if (!usedOrders.includes(i)) {
      return i
    }
  }
  
  return null // No hay huecos libres
}

/**
 * Aplica desplazamiento a todas las noticias con sort_order >= minValue
 */
export async function shiftArticlesUp(minValue: number): Promise<boolean> {
  try {
    const supabase = createClient()
    
    console.log(`Desplazando noticias con sort_order >= ${minValue}...`)
    
    // Método directo sin RPC
    const { data: articles } = await supabase
      .from('articles')
      .select('id, sort_order')
      .gte('sort_order', minValue)
      .eq('is_published', true)
      .order('sort_order', { ascending: false }) // Empezar por el más grande
    
    if (articles) {
      for (const article of articles) {
        await supabase
          .from('articles')
          .update({ sort_order: article.sort_order + 1 })
          .eq('id', article.id)
      }
    }
    
    console.log('Desplazamiento completado')
    return true
    
  } catch (error) {
    console.error('Error en shiftArticlesUp:', error)
    return false
  }
}
