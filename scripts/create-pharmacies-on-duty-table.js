const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPharmaciesOnDutyTable() {
  try {
    console.log('Creando tabla pharmacies_on_duty...')
    
    // SQL para crear la tabla
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.pharmacies_on_duty (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Crear índices
      CREATE INDEX IF NOT EXISTS idx_pharmacies_on_duty_date ON public.pharmacies_on_duty(date);
      CREATE INDEX IF NOT EXISTS idx_pharmacies_on_duty_name ON public.pharmacies_on_duty(name);

      -- Habilitar RLS
      ALTER TABLE public.pharmacies_on_duty ENABLE ROW LEVEL SECURITY;

      -- Políticas RLS
      CREATE POLICY "Anyone can view pharmacies_on_duty" ON public.pharmacies_on_duty
        FOR SELECT USING (true);

      CREATE POLICY "Service role can manage pharmacies_on_duty" ON public.pharmacies_on_duty
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

      -- Trigger para updated_at
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
    `

    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('Error al crear la tabla:', error)
      
      // Alternativa: intentar con SQL directo
      console.log('Intentando con método alternativo...')
      const { error: altError } = await supabase
        .from('pharmacies_on_duty')
        .select('count')
        .limit(1)
      
      if (altError && altError.code === 'PGRST116') {
        console.log('La tabla no existe, necesita ser creada manualmente en Supabase Dashboard')
        console.log('Por favor, ejecuta este SQL en el Supabase SQL Editor:')
        console.log('---')
        console.log(createTableSQL)
        console.log('---')
      } else if (!altError) {
        console.log('La tabla ya existe')
      }
    } else {
      console.log('Tabla pharmacies_on_duty creada exitosamente')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createPharmaciesOnDutyTable()
