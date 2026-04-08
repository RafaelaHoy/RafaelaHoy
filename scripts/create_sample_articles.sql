-- Script para crear artículos de ejemplo en Rafaela Hoy
-- Ejecutar en SQL Editor de Supabase después de haber ejecutado el fix_categories

-- 1. Insertar artículos de ejemplo para cada categoría
INSERT INTO articles (title, slug, excerpt, content, category_id, image_url, is_featured, is_published, sort_order, published_at, created_at, updated_at) VALUES

-- Locales
('Nuevo centro de salud en barrio norte', 'nuevo-centro-salud-barrio-norte', 
'El municipio anuncia la construcción de un nuevo centro de atención primaria en el barrio norte.',
'<p>El intendente anunció hoy la construcción de un nuevo centro de salud que atenderá a más de 5.000 vecinos. La obra comenzará el próximo mes y tendrá una inversión de $50 millones.</p><p>El centro contará con guardia 24 horas, laboratorio y atención especializada.</p>',
(SELECT id FROM categories WHERE slug = 'locales' LIMIT 1),
'https://images.unsplash.com/photo-1584515971173-263c2626ab96?w=800&h=400&fit=crop',
true, true, 1, NOW(), NOW(), NOW()),

('Inauguran nuevo espacio cultural en el centro', 'inauguran-nuevo-espacio-cultural-centro',
'Abren sus puertas un centro cultural con talleres gratuitos para niños y adultos.',
'<p>El nuevo espacio cultural ofrece talleres de arte, música y teatro completamente gratuitos para la comunidad.</p>',
(SELECT id FROM categories WHERE slug = 'locales' LIMIT 1),
'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
false, true, 2, NOW(), NOW(), NOW()),

('Mejoran la iluminación en avenidas principales', 'mejoran-iluminacion-avenidas-principales',
'El municipio inicia un plan de renovación de luminarias LED en toda la ciudad.',
'<p>Se reemplazarán más de 2.000 luminarias por tecnología LED, ahorrando un 60% en consumo energético.</p>',
(SELECT id FROM categories WHERE slug = 'locales' LIMIT 1),
'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&h=400&fit=crop',
false, true, 3, NOW(), NOW(), NOW()),

-- Provinciales
('Gobernador anuncia nuevo plan de obras', 'gobernador-anuncia-nuevo-plan-obras',
'El gobierno provincial presentó un plan de infraestructura por $2.000 millones.',
'<p>El gobernador presentó hoy un ambicioso plan de obras que incluye rutas, escuelas y hospitales en toda la provincia.</p>',
(SELECT id FROM categories WHERE slug = 'provinciales' LIMIT 1),
'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
true, true, 4, NOW(), NOW(), NOW()),

('Nueva ruta conectará Rafaela con Santa Fe', 'nueva-ruta-conectara-rafaela-santa-fe',
'Anuncian la construcción de una carretera que reducirá el tiempo de viaje a 45 minutos.',
'<p>La nueva ruta 22 conectará directamente Rafaela con la capital provincial, mejorando el transporte de mercaderías.</p>',
(SELECT id FROM categories WHERE slug = 'provinciales' LIMIT 1),
'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=400&fit=crop',
false, true, 5, NOW(), NOW(), NOW()),

-- Policiales
('Detienen a banda dedicada a robos en rutas', 'detienen-banda-robos-rutas',
'La policía provincial detuvo a cinco personas sospechosas de asaltar camiones en la ruta nacional.',
'<p>Operativo policial en la ruta 34 culminó con la detención de una banda dedicada al robo de mercadería en tránsito.</p>',
(SELECT id FROM categories WHERE slug = 'policiales' LIMIT 1),
'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
true, true, 6, NOW(), NOW(), NOW()),

('Operativo antidelito en el centro de la ciudad', 'operativo-antidelito-centro-ciudad',
'Refuerzan la seguridad en la zona céntrica con más patrullas y cámaras nuevas.',
'<p>Se instalaron 50 nuevas cámaras de seguridad y se duplicó el patrullaje en horarios nocturnos.</p>',
(SELECT id FROM categories WHERE slug = 'policiales' LIMIT 1),
'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=400&fit=crop',
false, true, 7, NOW(), NOW(), NOW()),

-- Deportes
('Rafaela Athletic clasifica a la siguiente instancia', 'rafaela-athletic-clasifica-siguiente-instancia',
'El equipo local venció 2-1 a su rival y avanzó en el torneo regional.',
'<p>Con goles de Martínez y López, Rafaela Athletic logró una victoria clave en el estadio de la Independencia.</p>',
(SELECT id FROM categories WHERE slug = 'deportes' LIMIT 1),
'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
true, true, 8, NOW(), NOW(), NOW()),

('Torneo de fútbol infantil en el club Atlético', 'torneo-futbol-infantil-club-atletico',
'Más de 300 niños participarán del torneo de fin de semana en instalaciones locales.',
'<p>El torneo reunirá a equipos de toda la región en categorías desde infantiles hasta cadetes.</p>',
(SELECT id FROM categories WHERE slug = 'deportes' LIMIT 1),
'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&h=400&fit=crop',
false, true, 9, NOW(), NOW(), NOW()),

-- Política
('Concejo deliberante aprobó nuevo presupuesto', 'concejo-aprobo-nuevo-presupuesto',
'Los ediles aprobaron por mayoría el presupuesto municipal para el próximo año.',
'<p>El presupuesto municipal 2024 fue aprobado con el voto favorable de 12 concejales y la oposición de 3.</p>',
(SELECT id FROM categories WHERE slug = 'politica' LIMIT 1),
'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
true, true, 10, NOW(), NOW(), NOW()),

('Presentaron proyecto de ordenamiento urbano', 'presentaron-proyecto-ordenamiento-urbano',
'Nuevas normas de construcción y zonificación para el crecimiento ordenado de la ciudad.',
'<p>El proyecto busca regular el crecimiento urbano y proteger áreas residenciales y comerciales.</p>',
(SELECT id FROM categories WHERE slug = 'politica' LIMIT 1),
'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
false, true, 11, NOW(), NOW(), NOW()),

-- Economía
('Nuevas medidas para incentivar el comercio local', 'nuevas-medidas-incentivar-comercio-local',
'El municipio lanzará un programa de créditos para pequeños comerciantes.',
'<p>Se anuncian medidas de apoyo al comercio local con tasas preferenciales y asistencia técnica.</p>',
(SELECT id FROM categories WHERE slug = 'economia' LIMIT 1),
'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
false, true, 12, NOW(), NOW(), NOW()),

('Ferias comerciales atraen a miles de visitantes', 'ferias-comerciales-atraen-miles-visitantes',
'Las ferias de fin de semana generan un movimiento económico importante en el centro.',
'<p>Los fines de semana, las ferias comerciales congregan a más de 5.000 personas y benefician a 200 comerciantes.</p>',
(SELECT id FROM categories WHERE slug = 'economia' LIMIT 1),
'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
false, true, 13, NOW(), NOW(), NOW()),

-- Cultura y Espectáculos
('Festival de cine independiente llega a Rafaela', 'festival-cine-independiente-llega-rafaela',
'Del 15 al 20 de mayo se realizará la primera edición del festival de cine local.',
'<p>El festival contará con más de 20 películas de realizadores rafaelinos y nacionales.</p>',
(SELECT id FROM categories WHERE slug = 'cultura-y-espectaculos' LIMIT 1),
'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
false, true, 14, NOW(), NOW(), NOW()),

('Concierto de música clásica en el teatro', 'concierto-musica-clasica-teatro',
'La orquesta sinfónica local presentará un programa especial el sábado por la noche.',
'<p>El concierto incluirá obras de Mozart, Beethoven y compositores argentinos contemporáneos.</p>',
(SELECT id FROM categories WHERE slug = 'cultura-y-espectaculos' LIMIT 1),
'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
false, true, 15, NOW(), NOW(), NOW()),

-- Tecnología
('Nuevo parque tecnológico en la ciudad', 'nuevo-parque-tecnologico-ciudad',
'Anuncian la creación de un espacio para empresas de tecnología y startups.',
'<p>El municipio destinará 10 hectáreas para el desarrollo de un parque tecnológico.</p>',
(SELECT id FROM categories WHERE slug = 'tecnologia' LIMIT 1),
'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
false, true, 16, NOW(), NOW(), NOW()),

('Programa de capacitación en programación', 'programa-capacitacion-programacion',
'Ofrecen cursos gratuitos de desarrollo web y móvil para jóvenes.',
'<p>El programa incluye formación en HTML, CSS, JavaScript y desarrollo de aplicaciones móviles.</p>',
(SELECT id FROM categories WHERE slug = 'tecnologia' LIMIT 1),
'https://images.unsplash.com/photo-1517048676732-a65130e2a4f9?w=800&h=400&fit=crop',
false, true, 17, NOW(), NOW(), NOW()),

-- Salud
('Campaña de vacunación gratuita', 'campaña-vacunacion-gratuita',
'El hospital regional realizará una jornada de vacunación gratuita este sábado.',
'<p>Se aplicarán vacunas contra la gripe y COVID-19 sin turno previo de 8 a 14 horas.</p>',
(SELECT id FROM categories WHERE slug = 'salud' LIMIT 1),
'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=400&fit=crop',
false, true, 18, NOW(), NOW(), NOW()),

('Nuevas especialidades en el hospital regional', 'nuevas-especialidades-hospital-regional',
'Incorporarán servicios de cardiología y neurología con especialistas de renombre.',
'<p>Las nuevas especialidades comenzarán a atender a partir del próximo mes con turnos presidenciales y virtuales.</p>',
(SELECT id FROM categories WHERE slug = 'salud' LIMIT 1),
'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
false, true, 19, NOW(), NOW(), NOW()),

-- Agroindustria
('Record de exportación de granos', 'record-exportacion-granos',
'El puerto de San Lorenzo registró un histórico en la exportación de soja y trigo.',
'<p>En el último mes se exportaron más de 2 millones de toneladas de granos.</p>',
(SELECT id FROM categories WHERE slug = 'agroindustria' LIMIT 1),
'https://images.unsplash.com/photo-1500937386664-567c297963b5?w=800&h=400&fit=crop',
false, true, 20, NOW(), NOW(), NOW()),

('Nueva planta de procesamiento de lácteos', 'nueva-planta-procesamiento-lacteos',
'Anuncian la inversión de $100 millones en una planta industrial en la zona.',
'<p>La planta procesará más de 500.000 litros diarios y generará 200 puestos de trabajo.</p>',
(SELECT id FROM categories WHERE slug = 'agroindustria' LIMIT 1),
'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=400&fit=crop',
false, true, 21, NOW(), NOW(), NOW());

-- 2. Verificar que se insertaron correctamente
SELECT 
  a.title,
  a.slug,
  c.name as category,
  a.is_featured,
  a.is_published,
  a.sort_order
FROM articles a
JOIN categories c ON a.category_id = c.id
ORDER BY a.sort_order, a.published_at DESC;
