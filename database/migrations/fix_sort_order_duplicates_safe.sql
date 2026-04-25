-- Script simplificado y seguro para eliminar duplicados de sort_order
-- Versión sin ambigüedades de columnas

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

-- 2. Crear tabla temporal con la estructura correcta
CREATE TEMPORARY TABLE temp_article_orders AS
SELECT 
    id,
    title,
    ROW_NUMBER() OVER (
        ORDER BY 
            CASE 
                WHEN sort_order = 0 THEN 0
                WHEN sort_order >= 1 AND sort_order <= 3 THEN 1
                WHEN sort_order >= 4 AND sort_order <= 13 THEN 2
                ELSE 3
            END,
            sort_order,
            created_at
    ) as new_order,
    CASE 
        WHEN sort_order = 0 THEN 'principal'
        WHEN sort_order >= 1 AND sort_order <= 3 THEN 'destacada'
        WHEN sort_order >= 4 AND sort_order <= 13 THEN 'ultimas'
        ELSE 'repositorio'
    END as new_location,
    created_at
FROM articles 
WHERE is_published = true
ORDER BY 
    CASE 
        WHEN sort_order = 0 THEN 0
        WHEN sort_order >= 1 AND sort_order <= 3 THEN 1
        WHEN sort_order >= 4 AND sort_order <= 13 THEN 2
        ELSE 3
    END,
    sort_order,
    created_at;

-- 3. Actualizar cada sección por separado para evitar ambigüedades

-- Actualizar sección principal (solo 1 artículo)
UPDATE articles 
SET 
    sort_order = 0,
    home_location = 'principal',
    is_featured = true,
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM temp_article_orders 
    WHERE new_location = 'principal' 
    LIMIT 1
);

-- Actualizar sección destacadas (hasta 3 artículos)
UPDATE articles 
SET 
    sort_order = new_order,
    home_location = 'destacada',
    is_featured = true,
    updated_at = NOW()
FROM temp_article_orders 
WHERE articles.id = temp_article_orders.id 
AND temp_article_orders.new_location = 'destacada'
AND new_order <= 3;

-- Actualizar sección últimas (hasta 10 artículos)
UPDATE articles 
SET 
    sort_order = new_order + 3, -- Empezar desde 4
    home_location = 'ultimas',
    is_featured = false,
    updated_at = NOW()
FROM temp_article_orders 
WHERE articles.id = temp_article_orders.id 
AND temp_article_orders.new_location = 'ultimas'
AND new_order <= 10;

-- Actualizar sección repositorio (resto de artículos)
UPDATE articles 
SET 
    sort_order = new_order + 13, -- Empezar desde 14
    home_location = 'repositorio',
    is_featured = false,
    updated_at = NOW()
FROM temp_article_orders 
WHERE articles.id = temp_article_orders.id 
AND temp_article_orders.new_location = 'repositorio';

-- 4. Limpiar tabla temporal
DROP TABLE IF EXISTS temp_article_orders;

-- 5. Verificar resultado final
SELECT 
    home_location,
    COUNT(*) as count,
    MIN(sort_order) as min_order,
    MAX(sort_order) as max_order,
    array_agg(sort_order ORDER BY sort_order) as all_orders
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

-- 6. Verificación final de duplicados
SELECT 
    'DUPLICADOS ENCONTRADOS' as status,
    COUNT(*) as duplicate_count
FROM articles 
WHERE is_published = true
GROUP BY sort_order 
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    'SIN DUPLICADOS' as status,
    0 as duplicate_count
WHERE NOT EXISTS (
    SELECT 1 FROM articles 
    WHERE is_published = true
    GROUP BY sort_order 
    HAVING COUNT(*) > 1
);
