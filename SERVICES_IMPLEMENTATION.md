# Implementación de Servicios - Rafaela Hoy

## Pasos para Ejecutar

### 1. Crear Tabla en Supabase

Ve al **SQL Editor** de tu proyecto Supabase y ejecuta:

```sql
-- Contenido de scripts/create_services_table.sql
```

Esto creará la tabla `site_services` con:
- `id` (UUID, primary key)
- `type` (slug: farmacias, necrologicas, municipales)
- `content` (TEXT para HTML o texto plano)
- `is_active` (BOOLEAN para activar/desactivar)
- `created_at` y `updated_at` (timestamps)

### 2. Reiniciar Servidor

```bash
pnpm run dev
```

## Funcionalidades Implementadas

### ✅ 1. Widget de Clima en Header
**Archivo:** `components/weather-widget.tsx`

Características:
- Diseño minimalista con iconos dinámicos
- Estados: sunny, cloudy, rainy, snowy, windy
- Colores adaptativos según condición climática
- Loading state con animación
- Mock data para desarrollo (preparado para API real)

**Uso en header:** Reemplaza el widget estático por componente dinámico

### ✅ 2. Rutas Dinámicas de Servicios
**Archivo:** `app/servicios/[slug]/page.tsx`

Rutas funcionando:
- `/servicios/farmacias` - Farmacias de Turno
- `/servicios/necrologicas` - Necrológicas  
- `/servicios/municipales` - Servicios Municipales

Características:
- Metadata dinámica por servicio
- Manejo de estado "Próximamente" si no hay contenido
- Soporte para HTML o texto plano
- Fecha de última actualización

### ✅ 3. Panel de Administración de Servicios
**Archivo:** `components/admin/services-management-section.tsx`

Funcionalidades:
- Selector de servicios (dropdown)
- Editor de contenido con soporte HTML
- Botones Editar/Guardar
- Activar/Desactivar servicios
- Estado visual de activo/inactivo
- Instrucciones integradas en la interfaz

### ✅ 4. Actualización de Header
**Archivo:** `components/header.tsx`

Cambios:
- Importación de WeatherWidget
- Corrección de enlaces a `/servicios/{slug}`
- Dropdown de Servicios actualizado

## Uso del Sistema

### Para Usuarios:
1. **Acceder a servicios** desde el menú "Servicios" del header
2. **Ver información** de farmacias, necrológicas o servicios municipales
3. **Contenido dinámico** según lo que el administrador configure

### Para Administradores:
1. **Ir a `/admin`**
2. **Sección "Gestionar Servicios"** al final del panel
3. **Seleccionar servicio** a editar del dropdown
4. **Editar contenido** (puedes usar HTML)
5. **Guardar cambios** automáticamente actualiza la web
6. **Activar/Desactivar** servicios según necesidad

## Ejemplos de Contenido HTML

### Farmacias de Turno:
```html
<div class="space-y-4">
  <h3 class="text-lg font-semibold mb-2">Farmacias de Turno Hoy</h3>
  <div class="bg-blue-50 p-4 rounded-lg">
    <p><strong>Farmacia del Centro:</strong> Av. Mitre 123 - Tel: 03492-123456</p>
    <p><strong>Farmacia Norte:</strong> San Martín 456 - Tel: 03492-456789</p>
  </div>
  <p class="text-sm text-gray-600 mt-2">Actualizado: 08:00 AM</p>
</div>
```

### Necrológicas:
```html
<div class="space-y-4">
  <h3 class="text-lg font-semibold mb-2">Agradecemos a quienes partieron</h3>
  <div class="space-y-3">
    <div class="border-l-2 border-gray-300 pl-4">
      <p class="font-medium">Gómez, Ana María</p>
      <p class="text-sm text-gray-600">82 años - Partió el 05/04/2024</p>
    </div>
  </div>
</div>
```

## Verificación

Después de la implementación:

1. **Ejecuta el script SQL** en Supabase
2. **Reinicia el servidor**
3. **Verifica las rutas**:
   - http://localhost:3000/servicios/farmacias
   - http://localhost:3000/servicios/necrologicas
   - http://localhost:3000/servicios/municipales
4. **Prueba el panel admin** en http://localhost:3000/admin
5. **Configura contenidos** desde la sección "Gestionar Servicios"

## Notas Técnicas

- El widget de clima usa **mock data** pero está estructurado para conectar a una API real
- Los contenidos soportan **HTML completo** para dar flexibilidad de diseño
- Las rutas son **SEO-friendly** con metadata dinámica
- El panel admin tiene **validaciones** y estados de carga
- Todo el sistema es **responsive** y funciona en móviles

## Solución de Problemas Comunes

### Error 404 en servicios:
- **Causa**: No ejecutaste el script SQL
- **Solución**: Ejecuta `scripts/create_services_table.sql`

### Widget no aparece:
- **Causa**: Error de importación en header
- **Solución**: Verifica que `WeatherWidget` esté importado

### Panel admin no funciona:
- **Causa**: Componente no importado
- **Solución**: Verifica import en `admin-dashboard.tsx`

Todo el sistema está listo para funcionar una vez ejecutado el script SQL.
