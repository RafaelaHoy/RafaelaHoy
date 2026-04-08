-- Script para sincronizar categorías de Rafaela Hoy
-- Ejecutar en SQL Editor de Supabase

-- 1. Limpiar tabla categories (eliminar todas las categorías existentes)
-- Usamos CASCADE para eliminar también las referencias en articles
TRUNCATE TABLE categories, articles RESTART IDENTITY CASCADE;

-- 2. Insertar las categorías correctas para Rafaela Hoy
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

-- 3. Verificar que las categorías se insertaron correctamente
SELECT * FROM categories ORDER BY display_order;

-- 4. Si la tabla news no tiene columna sort_order, agregarla
-- (Descomentar si es necesario)
-- ALTER TABLE news ADD COLUMN sort_order INTEGER DEFAULT 0;
-- CREATE INDEX IF NOT EXISTS idx_news_sort_order ON news(sort_order);

-- 5. Actualizar sort_order de noticias existentes (si hay noticias)
-- UPDATE news SET sort_order = id WHERE sort_order = 0;
