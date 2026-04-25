-- Script ultra simplificado para eliminar duplicados de sort_order
-- Sin tablas temporales, actualización directa

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

-- 2. Actualizar sección principal (solo el primer artículo con sort_order 0)
UPDATE articles 
SET 
    sort_order = 0,
    home_location = 'principal',
    is_featured = true,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM articles 
    WHERE is_published = true 
    AND sort_order = 0 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- 3. Actualizar sección destacadas (3 artículos)
UPDATE articles 
SET 
    sort_order = subquery.new_sort_order,
    home_location = 'destacada',
    is_featured = true,
    updated_at = NOW()
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_sort_order
    FROM articles 
    WHERE is_published = true 
    AND sort_order >= 1 
    AND sort_order <= 3
    LIMIT 3
) AS subquery
WHERE articles.id = subquery.id;

-- 4. Actualizar sección últimas (10 artículos)
UPDATE articles 
SET 
    sort_order = subquery.new_sort_order,
    home_location = 'ultimas',
    is_featured = false,
    updated_at = NOW()
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) + 3 as new_sort_order -- Empezar desde 4
    FROM articles 
    WHERE is_published = true 
    AND sort_order >= 4 
    AND sort_order <= 13
    LIMIT 10
) AS subquery
WHERE articles.id = subquery.id;

-- 5. Actualizar sección repositorio (resto de artículos)
UPDATE articles 
SET 
    sort_order = subquery.new_sort_order,
    home_location = 'repositorio',
    is_featured = false,
    updated_at = NOW()
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) + 13 as new_sort_order -- Empezar desde 14
    FROM articles 
    WHERE is_published = true 
    AND sort_order >= 14
) AS subquery
WHERE articles.id = subquery.id;

-- 6. Verificar resultado final
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

-- 7. Verificación final de duplicados
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'DUPLICADOS ENCONTRADOS'
        ELSE 'SIN DUPLICADOS'
    END as status,
    COUNT(*) as duplicate_count
FROM (
    SELECT sort_order
    FROM articles 
    WHERE is_published = true
    GROUP BY sort_order 
    HAVING COUNT(*) > 1
) as duplicates;
