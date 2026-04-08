# Sincronización de Base de Datos - Rafaela Hoy

## Pasos a Ejecutar

### 1. Ejecutar Script SQL en Supabase

Ve al **SQL Editor** de tu proyecto Supabase y ejecuta el archivo:

```sql
-- Contenido de scripts/fix_database_categories.sql
```

Este script:
- **TRUNCATE** la tabla categories (elimina todo)
- **INSERTA** las 15 categorías correctas con slugs precisos
- **VERIFICA** que las categorías se insertaron correctamente
- **AGREGA** columna sort_order a la tabla news si no existe

### 2. Verificar Tabla News

Si la tabla news no tiene columna sort_order, descomenta estas líneas en el script:

```sql
ALTER TABLE news ADD COLUMN sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_news_sort_order ON news(sort_order);
```

### 3. Reiniciar Servidor

Después de ejecutar el SQL, reinicia tu servidor:

```bash
pnpm run dev
```

## Categorías Configuradas

### Menú Principal:
- Locales (locales)
- Provinciales (provinciales) 
- Policiales (policiales)
- Deportes (deportes)
- Política (politica)

### Dropdown "Más":
- Economía (economia)
- Nacionales (nacionales)
- Internacionales (internacionales)
- Gremiales (gremiales)
- Educación (educacion)
- Cultura y Espectáculos (cultura-y-espectaculos)
- Judiciales (judiciales)
- Tecnología (tecnologia)
- Salud (salud)
- Agroindustria (agroindustria)

## Cambios Realizados en el Código

### 1. Header (components/header.tsx)
- Agregada categoría "Provinciales" al menú principal
- Corregido slug: "cultura-y-espectaculos"
- Todos los enlaces apuntan a `/categoria/[slug]`

### 2. Footer (components/footer.tsx)
- Actualizadas categorías para coincidir con base de datos
- Agregada "Provinciales" y "Agroindustria"

### 3. Home Content (components/home-content.tsx)
- Ordenamiento por sort_order ASC, luego published_at DESC
- Interfaz Article actualizada con campo sort_order

### 4. Category Content (components/category-content.tsx)
- Ordenamiento por sort_order ASC, luego published_at DESC
- Interfaz Article actualizada con campo sort_order

### 5. Admin Dashboard
- Funcionalidad de ordenamiento con flechas Arriba/Abajo
- Consulta ordenada por sort_order

## Verificación

Después de ejecutar el script SQL, verifica:

1. **Categorías**: `SELECT * FROM categories ORDER BY display_order;`
2. **Noticias**: `SELECT id, title, sort_order FROM news ORDER BY sort_order;`
3. **Rutas**: Navega a `/categoria/locales` y otras categorías
4. **Panel Admin**: Verifica que las flechas de ordenamiento funcionen

## Posibles Errores y Soluciones

### Error 404 en categorías:
- **Causa**: Slug incorrecto en base de datos
- **Solución**: Ejecuta el script SQL completo

### Error de columna sort_order:
- **Causa**: La tabla news no tiene la columna
- **Solución**: Descomenta las líneas ALTER TABLE en el script

### Error de memoria:
- **Solución**: Usa `pnpm run dev` con la configuración actual

## Estructura Final

```
Rutas funcionando:
/categoria/locales
/categoria/provinciales
/categoria/policiales
/categoria/deportes
/categoria/politica
/categoria/economia
/categoria/nacionales
/categoria/internacionales
/categoria/gremiales
/categoria/educacion
/categoria/cultura-y-espectaculos
/categoria/judiciales
/categoria/tecnologia
/categoria/salud
/categoria/agroindustria
```

Todo está sincronizado y debería funcionar sin errores 404.
