-- Script para crear tabla de servicios del sitio
-- Ejecutar en SQL Editor de Supabase

-- 1. Crear tabla site_services
CREATE TABLE IF NOT EXISTS site_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE, -- farmacias, necrologicas, servicios-municipales
    content TEXT, -- Contenido HTML o texto plano del servicio
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_site_services_type ON site_services(type);

-- 3. Insertar servicios iniciales con contenido por defecto
INSERT INTO site_services (type, content) VALUES
('farmacias', 'Próximamente información de farmacias de turno.'),
('necrologicas', 'Próximamente sección necrológica.'),
('servicios-municipales', 'Próximamente información de servicios municipales.')
ON CONFLICT (type) DO NOTHING;

-- 4. Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_services_updated_at 
    BEFORE UPDATE ON site_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Verificar que se creó correctamente
SELECT * FROM site_services ORDER BY type;
