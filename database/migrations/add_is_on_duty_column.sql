-- Agregar columna is_on_duty a la tabla de farmacias
-- Para el sistema de gestión manual de farmacias de turno

ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE;

-- Actualizar todas las farmacias existentes a false por defecto
UPDATE public.pharmacies 
SET is_on_duty = FALSE 
WHERE is_on_duty IS NULL;

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pharmacies_is_on_duty ON public.pharmacies(is_on_duty);

-- Verificar la estructura de la tabla
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pharmacies' 
AND table_schema = 'public'
ORDER BY ordinal_position;
