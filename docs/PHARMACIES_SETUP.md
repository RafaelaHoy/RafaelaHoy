# Configuración de Farmacias de Turno Automatizadas

## Overview

Este sistema automatiza la extracción y muestra de las farmacias de turno desde el sitio del Círculo Médico de Rafaela.

## Componentes

### 1. Base de Datos
- **Tabla**: `pharmacies_on_duty`
- **Campos**: id, name, address, phone, date, created_at, updated_at
- **Migración**: `database/migrations/create_pharmacies_on_duty.sql`

### 2. Scraper
- **Archivo**: `lib/scraper.ts`
- **Función**: Extrae datos de `https://circulorafaela.com.ar/farmacias`
- **Procesamiento**: Limpia y estructura los datos de farmacias

### 3. API Routes
- **GET**: `/api/pharmacies-on-duty` - Obtiene farmacias del día
- **POST**: `/api/pharmacies-on-duty` - Actualiza farmacias (scraping)
- **Cron**: `/api/cron/update-pharmacies` - Endpoint para Vercel Cron

### 4. Componentes UI
- **Componente**: `components/pharmacies-on-duty.tsx`
- **Estilos**: Tarjetas con borde azul y títulos en rojo
- **Funcionalidad**: Botón "Cómo llegar" que abre Google Maps

### 5. Automatización
- **Cron Job**: Se ejecuta diariamente a las 8 AM
- **Configuración**: `vercel.json`
- **Secret**: `CRON_SECRET` para autenticación

## Instalación

### 1. Ejecutar la migración en Supabase
```sql
-- Ejecutar el contenido de database/migrations/create_pharmacies_on_duty.sql
```

### 2. Configurar variables de entorno en Vercel
```
CRON_SECRET=tu-secreto-aqui
NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Deploy a Vercel
El cron job se configurará automáticamente con el `vercel.json`

## Uso

### Manual
```bash
# Actualizar farmacias manualmente
curl -X POST https://tu-sitio.vercel.app/api/pharmacies-on-duty

# Obtener farmacias del día
curl https://tu-sitio.vercel.app/api/pharmacies-on-duty
```

### Automático
El sistema se actualiza automáticamente todos los días a las 8 AM.

## Componentes en la UI

### Home Page
- Widget de farmacias de turno visible en la página principal

### Servicios Page
- Página completa de servicios con el widget destacado
- Acceso a otros servicios (Clima, Necrológicas)

## Fallback

Si el scraping falla:
- Muestra mensaje amable de error
- Botón para reintentar
- Botón para ir directamente a `circulorafaela.com.ar/farmacias`

## Estructura de Datos

```typescript
interface PharmacyData {
  id: string
  name: string
  address: string
  phone?: string
  date: string
  created_at: string
}
```

## Estilos

- **Tarjetas**: Borde azul (`border-blue-200`)
- **Títulos**: Rojo (`text-red-600`)
- **Botones**: Azul (`bg-blue-600`)
- **Iconos**: MapPin y Phone en azul

## Monitoreo

- Logs en Vercel para el cron job
- Logs del scraper en consola
- Manejo de errores con fallback

## Mantenimiento

- Revisar periódicamente si el HTML del Círculo cambió
- Ajustar patrones de scraping si es necesario
- Monitorear ejecución del cron job
