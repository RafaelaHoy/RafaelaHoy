-- Script para eliminar duplicados de sort_order y reorganizar secuencialmente
-- Ejecutar este script para limpiar datos existentes antes de usar el nuevo sistema

-- 1. Verificar duplicados actuales
SELECT 
    sort_order,
    COUNT(*) as duplicate_count,
    STRING_AGG(title, ', ' ORDER BY title) as articles_with_same_order
FROM articles 
WHERE is_published = true
GROUP BY sort_order 
HAVING COUNT(*) > 1
ORDER BY sort_order;

-- 2. Crear tabla temporal con números secuenciales
CREATE TEMPORARY TABLE temp_articles AS
SELECT 
    id,
    title,
    home_location,
    is_featured,
    ROW_NUMBER() OVER (
        PARTITION BY 
            CASE 
                WHEN sort_order = 0 THEN 'principal'
                WHEN sort_order >= 1 AND sort_order <= 3 THEN 'destacada'
                WHEN sort_order >= 4 AND sort_order <= 13 THEN 'ultimas'
                ELSE 'repositorio'
            END
        ORDER BY 
            CASE 
                WHEN sort_order = 0 THEN 0
                WHEN sort_order >= 1 AND sort_order <= 3 THEN sort_order
                WHEN sort_order >= 4 AND sort_order <= 13 THEN sort_order
                ELSE sort_order
            END
    ) as row_num,
    created_at,
    updated_at
FROM articles 
WHERE is_published = true
ORDER BY sort_order, created_at;

-- 3. Actualizar sort_orders basados en la posición secuencial
UPDATE articles 
SET sort_order = CASE 
    WHEN articles.home_location = 'principal' THEN 0
    WHEN articles.home_location = 'destacada' THEN (SELECT row_num - 1 FROM temp_articles WHERE temp_articles.id = articles.id) + 1
    WHEN articles.home_location = 'ultimas' THEN (SELECT row_num - 1 FROM temp_articles WHERE temp_articles.id = articles.id) + 4
    ELSE (SELECT row_num - 1 FROM temp_articles WHERE temp_articles.id = articles.id) + 14
END,
home_location = CASE 
    WHEN articles.sort_order = 0 THEN 'principal'
    WHEN articles.sort_order >= 1 AND articles.sort_order <= 3 THEN 'destacada'
    WHEN articles.sort_order >= 4 AND articles.sort_order <= 13 THEN 'ultimas'
    ELSE 'repositorio'
END,
is_featured = CASE 
    WHEN articles.sort_order = 0 THEN true
    WHEN articles.sort_order >= 1 AND articles.sort_order <= 3 THEN true
    ELSE false
END,
updated_at = NOW()
FROM temp_articles 
WHERE articles.id = temp_articles.id;

-- 4. Limpiar tabla temporal
DROP TABLE IF EXISTS temp_articles;

-- 5. Verificar resultado final
SELECT 
    home_location,
    COUNT(*) as count,
    MIN(sort_order) as min_order,
    MAX(sort_order) as max_order
FROM articles 
WHERE is_published = true
GROUP BY home_location 
ORDER BY 
    CASE 
        WHEN home_location = 'principal' THEN 1
        WHEN home_location = 'destacada' THEN 2
        WHEN home_location = 'ultimas' THEN 3
        WHEN home_location = 'repositorio' THEN 4
    END;

-- 6. Verificar que no haya duplicados
SELECT 
    sort_order,
    COUNT(*) as count
FROM articles 
WHERE is_published = true
GROUP BY sort_order 
HAVING COUNT(*) > 1;
