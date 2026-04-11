-- Insert sample data for obituaries and pharmacies tables
-- This script will populate the tables with realistic test data

-- Insert sample obituaries
INSERT INTO obituaries (full_name, age, service_info, date, created_at, updated_at) VALUES
('María Elena Rodríguez de Pérez', 78, 'Servicio religioso en Iglesia San José, Av. San Martín 1234, Rafaela. Hora: 10:00 hs.', NOW(), NOW(), NOW()),
('Juan Carlos Pérez', 65, 'Crematorio Municipal, Calle 25 de Mayo 567, Rafaela. Hora: 15:00 hs.', NOW() - INTERVAL '1 day', NOW(), NOW()),
('Ana María González de Martínez', 82, 'Parroquia Nuestra Señora del Carmen, Calle Belgrano 890, Rafaela. Hora: 11:30 hs.', NOW() - INTERVAL '2 days', NOW(), NOW()),
('Roberto Carlos Martínez', 71, 'Capilla del Cementerio Local, Ruta 34 Km 12, Rafaela. Hora: 16:00 hs.', NOW() - INTERVAL '3 days', NOW(), NOW()),
('Carmen Luisa Fernández de Sánchez', 89, 'Iglesia Catedral, Plaza 25 de Mayo, Rafaela. Hora: 09:00 hs.', NOW() - INTERVAL '4 days', NOW(), NOW()),
('Alberto José Sánchez', 74, 'Salón Velatorio Municipal, Calle Rivadavia 456, Rafaela. Hora: 14:30 hs.', NOW() - INTERVAL '5 days', NOW(), NOW()),
('Laura Beatriz Gutiérrez de López', 67, 'Iglesia San Francisco, Calle Moreno 789, Rafaela. Hora: 10:30 hs.', NOW() - INTERVAL '6 days', NOW(), NOW()),
('Carlos Alberto López', 85, 'Templo Bautista, Av. España 345, Rafaela. Hora: 15:30 hs.', NOW() - INTERVAL '7 days', NOW(), NOW()),
('Margarita Rosa Díaz', 76, 'Iglesia del Sagrado Corazón, Calle Urquiza 567, Rafaela. Hora: 12:00 hs.', NOW() - INTERVAL '8 days', NOW(), NOW()),
('José Luis Ramírez', 69, 'Parroquia San Jorge, Calle Sarmiento 890, Rafaela. Hora: 16:30 hs.', NOW() - INTERVAL '9 days', NOW(), NOW());

-- Insert sample pharmacies
INSERT INTO pharmacies (name, phone, cell_phone, address, created_at, updated_at) VALUES
('Farmacia del Sol', '3492-123456', '3492-1234567', 'Av. San Martín 1234, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia San José', '3492-234567', '3492-2345678', 'Calle Belgrano 890, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia del Centro', '3492-345678', NULL, 'Plaza 25 de Mayo 456, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia La Paz', '3492-456789', '3492-4567890', 'Calle Rivadavia 1234, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia del Pueblo', '3492-567890', '3492-5678901', 'Av. España 567, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia San Francisco', '3492-678901', '3492-6789012', 'Calle Moreno 890, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia Urquiza', '3492-789012', '3492-7890123', 'Calle Urquiza 345, Rafaela, Santa Fe', NOW(), NOW()),
('Farmacia Mitre', '3492-890123', '3492-8901234', 'Av. Mitre 678, Rafaela, Santa Fe', NOW(), NOW());

-- Verify data insertion
SELECT 'Obituaries inserted: ' || COUNT(*) FROM obituaries;
SELECT 'Pharmacies inserted: ' || COUNT(*) FROM pharmacies;

-- Show sample data
SELECT 
    id, 
    full_name, 
    age, 
    LEFT(service_info, 50) || '...' as service_preview,
    TO_CHAR(date, 'DD/MM/YYYY') as formatted_date
FROM obituaries 
ORDER BY date DESC 
LIMIT 5;

SELECT 
    id, 
    name, 
    phone, 
    cell_phone,
    LEFT(address, 40) || '...' as address_preview
FROM pharmacies 
ORDER BY created_at DESC 
LIMIT 5;
