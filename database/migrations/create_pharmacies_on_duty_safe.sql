-- Script SQL seguro para crear/actualizar la tabla pharmacies_on_duty
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.pharmacies_on_duty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'pharmacies_on_duty' AND indexname = 'idx_pharmacies_on_duty_date') THEN
        CREATE INDEX idx_pharmacies_on_duty_date ON public.pharmacies_on_duty(date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'pharmacies_on_duty' AND indexname = 'idx_pharmacies_on_duty_name') THEN
        CREATE INDEX idx_pharmacies_on_duty_name ON public.pharmacies_on_duty(name);
    END IF;
END $$;

-- 3. Habilitar RLS si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pharmacies_on_duty' AND rowsecurity = true) THEN
        ALTER TABLE public.pharmacies_on_duty ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Eliminar políticas si existen y volver a crear
DROP POLICY IF EXISTS "Anyone can view pharmacies_on_duty" ON public.pharmacies_on_duty;
DROP POLICY IF EXISTS "Service role can manage pharmacies_on_duty" ON public.pharmacies_on_duty;

-- 5. Crear políticas nuevas
CREATE POLICY "Anyone can view pharmacies_on_duty" ON public.pharmacies_on_duty
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage pharmacies_on_duty" ON public.pharmacies_on_duty
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Crear o reemplazar la función para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Eliminar trigger si existe y volver a crear
DROP TRIGGER IF EXISTS handle_pharmacies_on_duty_updated_at ON public.pharmacies_on_duty;

CREATE TRIGGER handle_pharmacies_on_duty_updated_at
  BEFORE UPDATE ON public.pharmacies_on_duty
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Insertar datos de ejemplo solo si la tabla está vacía
INSERT INTO public.pharmacies_on_duty (name, address, phone, date)
SELECT 
  'Farmacia del Sol', 
  'Av. San Martín 1234, Rafaela, Santa Fe', 
  '3492-123456', 
  CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.pharmacies_on_duty LIMIT 1);

INSERT INTO public.pharmacies_on_duty (name, address, phone, date)
SELECT 
  'Farmacia San José', 
  'Calle Belgrano 890, Rafaela, Santa Fe', 
  '3492-234567', 
  CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.pharmacies_on_duty WHERE name = 'Farmacia San José');

INSERT INTO public.pharmacies_on_duty (name, address, phone, date)
SELECT 
  'Farmacia del Centro', 
  'Plaza 25 de Mayo 456, Rafaela, Santa Fe', 
  '3492-345678', 
  CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.pharmacies_on_duty WHERE name = 'Farmacia del Centro');

-- 9. Verificar que todo esté correcto
SELECT 
  'Tabla pharmacies_on_duty creada exitosamente' as status,
  COUNT(*) as total_pharmacies
FROM public.pharmacies_on_duty;

-- Mostrar los datos insertados
SELECT id, name, address, phone, date, created_at 
FROM public.pharmacies_on_duty 
ORDER BY created_at;
