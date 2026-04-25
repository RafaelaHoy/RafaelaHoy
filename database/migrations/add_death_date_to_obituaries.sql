-- Migración para agregar campo death_date a la tabla obituaries
-- Reemplaza el campo 'date' automático con 'death_date' manual

-- 1. Agregar el nuevo campo death_date
ALTER TABLE obituaries 
ADD COLUMN death_date DATE;

-- 2. Si hay datos existentes, migrar el campo date a death_date
-- (asumiendo que el campo date contenía la fecha de fallecimiento)
UPDATE obituaries 
SET death_date = date::DATE 
WHERE death_date IS NULL AND date IS NOT NULL;

-- 3. Marcar death_date como obligatorio (si quieres que sea requerido)
-- ALTER TABLE obituaries ALTER COLUMN death_date SET NOT NULL;

-- 4. Opcional: Eliminar el campo antiguo 'date' si ya no se necesita
-- ALTER TABLE obituaries DROP COLUMN date;

-- 5. Verificar los cambios
SELECT 
    id, 
    full_name, 
    age, 
    death_date, 
    service_info, 
    created_at,
    updated_at
FROM obituaries 
ORDER BY death_date DESC NULLS LAST;
