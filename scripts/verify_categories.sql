-- Script to verify categories exist in database
-- This script helps identify which categories from the menu exist in the database

-- Check all categories in the database
SELECT id, name, slug FROM categories ORDER BY display_order, name;

-- Expected categories based on menu and seed data:
-- 1. locales (Locales) - already in main nav
-- 2. policiales (Policiales) - already in main nav
-- 3. deportes (Deportes) - already in main nav
-- 4. politica (Política) - needs to be added
-- 5. economia (Economia) - already exists
-- 6. nacionales (Nacionales) - already exists
-- 7. internacionales (Internacionales) - already exists
-- 8. gremiales (Gremiales) - already exists
-- 9. educacion (Educacion) - already exists
-- 10. cultura-espectaculos (Cultura y Espectaculos) - already exists
-- 11. judiciales (Judiciales) - already exists
-- 12. tecnologia (Tecnologia) - already exists
-- 13. salud (Salud) - already exists
-- 14. agroindustria (Agroindustria) - already exists

-- If any categories are missing, you can insert them with:
INSERT INTO categories (name, slug, display_order) VALUES 
('Política', 'politica', 4)
ON CONFLICT (name) DO NOTHING;
