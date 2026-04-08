# Instrucciones para Aplicar Cambios en la Base de Datos

## 1. Agregar columna sort_order a la tabla articles

Ejecuta el script `scripts/add_sort_order.sql` en tu base de datos Supabase:

```sql
-- Migration: Add sort_order column to articles table
-- This migration adds a sort_order column to allow manual ordering of articles in the home page

-- Add the sort_order column to the articles table
ALTER TABLE articles 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create an index on sort_order for better performance
CREATE INDEX idx_articles_sort_order ON articles(sort_order);

-- Update existing articles to have sequential sort_order values based on creation date
-- This ensures existing articles have proper ordering
UPDATE articles 
SET sort_order = (
  SELECT row_number - 1
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at DESC)
    FROM articles
  ) ranked_articles
  WHERE ranked_articles.id = articles.id
);

-- Add a comment to explain the purpose of the column
COMMENT ON COLUMN articles.sort_order IS 'Manual order for displaying articles in home page. Lower numbers appear first.';
```

## 2. Verificar categorías existentes

Ejecuta el script `scripts/verify_categories.sql` para verificar que todas las categorías del menú existan en la base de datos:

```sql
-- Check all categories in the database
SELECT id, name, slug FROM categories ORDER BY display_order, name;
```

Si faltan categorías, puedes insertarlas con:

```sql
INSERT INTO categories (name, slug, display_order) VALUES 
('Locales', 'locales', 1),
('Policiales', 'policiales', 2),
('Deportes', 'deportes', 3),
('Política', 'politica', 4),
('Economía', 'economia', 5),
('Nacionales', 'nacionales', 6),
('Internacionales', 'internacionales', 7),
('Gremiales', 'gremiales', 8),
('Educación', 'educacion', 9),
('Cultura y Espectáculos', 'espectaculos', 10),
('Judiciales', 'judiciales', 11),
('Tecnología', 'tecnologia', 12),
('Salud', 'salud', 13),
('Agroindustria', 'campo', 14);
```

## Resumen de Cambios Implementados

### ✅ Header Rediseñado
- Eliminados enlaces antiguos: Farmacias, Clima, Cines, Horóscopo, Obituario
- Agregados íconos de Instagram y Facebook con color rojo #E21F1D
- Agregado widget de clima estático (24°C)
- Eliminada "Economía" del menú principal (ahora está en dropdown "Más")
- Mantenida fecha a la derecha e ícono de búsqueda

### ✅ Sección de Noticias Destacadas
- Modificada para mostrar 6 noticias pequeñas en columna con frame
- Agregado scroll vertical para mejor visualización
- Imágenes más pequeñas y títulos debajo

### ✅ Acceso Administrador
- Reemplazado texto "Acceso Administrador" por ícono de candado discreto
- Ubicado en la esquina inferior derecha del footer

### ✅ Panel de Administración
- Agregadas flechas Arriba/Abajo para ordenar noticias
- Implementada funcionalidad sort_order
- Botones deshabilitados en primera y última posición

### ✅ Base de Datos
- Creada columna sort_order para ordenamiento manual
- Scripts de verificación de categorías
- Índices para mejor rendimiento

### ✅ Rutas y Categorías
- Verificadas rutas dinámicas app/categoria/[slug]
- Confirmado filtrado correcto por categoría
- Botones "Ver Más" funcionando correctamente

## Notas Importantes

1. **Ordenamiento**: Las noticias ahora se ordenan primero por `sort_order` y luego por `published_at`
2. **Panel Admin**: Los botones de ordenamiento solo funcionan si hay más de un artículo
3. **Categorías**: Asegúrate de que todas las categorías del menú existan en la base de datos
4. **Responsive**: Todos los cambios son responsive y funcionan en móviles

## Para Probar

1. Aplica los cambios en la base de datos
2. Reinicia el servidor de desarrollo
3. Accede al panel de administración para probar el ordenamiento
4. Verifica que todas las categorías funcionen sin errores 404
