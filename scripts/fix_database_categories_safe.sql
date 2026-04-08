-- Script alternativo para sincronizar categorías de Rafaela Hoy (PRESERVA ARTÍCULOS)
-- Ejecutar en SQL Editor de Supabase

-- 1. Crear tabla temporal de respaldo de artículos con sus categorías
CREATE TEMP TABLE articles_backup AS
SELECT a.*, c.name as old_category_name, c.slug as old_category_slug
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id;

-- 2. Eliminar todas las categorías actuales
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- 3. Insertar las categorías correctas para Rafaela Hoy
INSERT INTO categories (name, slug, display_order, is_main_nav, is_service) VALUES
('Locales', 'locales', 1, true, false),
('Provinciales', 'provinciales', 2, true, false),
('Policiales', 'policiales', 3, true, false),
('Deportes', 'deportes', 4, true, false),
('Política', 'politica', 5, true, false),
('Economía', 'economia', 6, false, false),
('Nacionales', 'nacionales', 7, false, false),
('Internacionales', 'internacionales', 8, false, false),
('Gremiales', 'gremiales', 9, false, false),
('Educación', 'educacion', 10, false, false),
('Cultura y Espectáculos', 'cultura-y-espectaculos', 11, false, false),
('Judiciales', 'judiciales', 12, false, false),
('Tecnología', 'tecnologia', 13, false, false),
('Salud', 'salud', 14, false, false),
('Agroindustria', 'agroindustria', 15, false, false);

-- 4. Agregar columna sort_order a la tabla articles si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='articles' AND column_name='sort_order'
    ) THEN
        ALTER TABLE articles ADD COLUMN sort_order INTEGER DEFAULT 0;
        CREATE INDEX idx_articles_sort_order ON articles(sort_order);
    END IF;
END
$$;

-- 5. Restaurar artículos con las nuevas categorías (mapeo por slug)
INSERT INTO articles (title, slug, excerpt, content, image_url, category_id, is_featured, is_published, published_at, created_at, updated_at, sort_order)
SELECT 
    ab.title,
    ab.slug,
    ab.excerpt,
    ab.content,
    ab.image_url,
    c.id as category_id,
    ab.is_featured,
    ab.is_published,
    ab.published_at,
    ab.created_at,
    ab.updated_at,
    COALESCE(ab.sort_order, 0)
FROM articles_backup ab
LEFT JOIN categories c ON c.slug = ab.old_category_slug
WHERE ab.old_category_slug IS NOT NULL;

-- 6. Verificar que las categorías se insertaron correctamente
SELECT * FROM categories ORDER BY display_order;

-- 7. Verificar artículos restaurados
SELECT COUNT(*) as total_articles_restored FROM articles;

-- 8. Limpiar tabla temporal
DROP TABLE articles_backup;
