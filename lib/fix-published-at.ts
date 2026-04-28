import { createClient } from './supabase/client'

/**
 * Función para corregir noticias publicadas que tienen published_at: null
 * Asigna created_at como published_at para esas noticias
 */
export async function fixPublishedAt(): Promise<{ success: boolean; message: string; fixed: number }> {
  try {
    const supabase = createClient()
    
    console.log('=== CORRIGIENDO PUBLISHED_AT NULOS ===')
    
    // 1. Encontrar noticias publicadas con published_at null
    const { data: articlesWithNullDate, error } = await supabase
      .from('articles')
      .select('id, title, created_at, published_at, is_published')
      .eq('is_published', true)
      .is('published_at', null)
    
    if (error) throw error
    
    if (!articlesWithNullDate || articlesWithNullDate.length === 0) {
      return { success: true, message: 'No hay noticias publicadas con published_at null', fixed: 0 }
    }
    
    console.log(`Encontradas ${articlesWithNullDate.length} noticias publicadas con published_at null`)
    
    // 2. Actualizar cada noticia con su created_at
    let fixedCount = 0
    for (const article of articlesWithNullDate) {
      const publishedAt = (article as any).created_at || new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ published_at: publishedAt })
        .eq('id', article.id)
      
      if (updateError) {
        console.error(`Error actualizando artículo ${article.id}:`, updateError)
      } else {
        console.log(`✅ Artículo "${article.title}" corregido: published_at = ${publishedAt}`)
        fixedCount++
      }
    }
    
    console.log(`=== CORRECCIÓN COMPLETADA ===`)
    console.log(`Total corregidas: ${fixedCount}`)
    
    return {
      success: true,
      message: `Corrección completada. ${fixedCount} noticias actualizadas.`,
      fixed: fixedCount
    }
    
  } catch (error) {
    console.error('Error en fixPublishedAt:', error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      fixed: 0
    }
  }
}
