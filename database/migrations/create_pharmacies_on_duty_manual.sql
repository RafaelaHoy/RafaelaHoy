-- Ejecutar este SQL en el Supabase Dashboard > SQL Editor
-- Crear la tabla pharmacies_on_duty para el sistema de farmacias de turno

CREATE TABLE IF NOT EXISTS public.pharmacies_on_duty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pharmacies_on_duty_date ON public.pharmacies_on_duty(date);
CREATE INDEX IF NOT EXISTS idx_pharmacies_on_duty_name ON public.pharmacies_on_duty(name);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.pharmacies_on_duty ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Anyone can view pharmacies_on_duty" ON public.pharmacies_on_duty
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage pharmacies_on_duty" ON public.pharmacies_on_duty
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger automático para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_pharmacies_on_duty_updated_at
  BEFORE UPDATE ON public.pharmacies_on_duty
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insertar datos de ejemplo (opcional)
INSERT INTO public.pharmacies_on_duty (name, address, phone, date) VALUES
  ('Farmacia del Sol', 'Av. San Martín 1234, Rafaela, Santa Fe', '3492-123456', CURRENT_DATE),
  ('Farmacia San José', 'Calle Belgrano 890, Rafaela, Santa Fe', '3492-234567', CURRENT_DATE),
  ('Farmacia del Centro', 'Plaza 25 de Mayo 456, Rafaela, Santa Fe', '3492-345678', CURRENT_DATE);

-- Verificar que la tabla se creó correctamente
SELECT * FROM public.pharmacies_on_duty LIMIT 3;
