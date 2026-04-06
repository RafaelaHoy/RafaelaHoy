-- Seed initial categories
INSERT INTO public.categories (name, slug, display_order, is_main_nav, is_service) VALUES
  ('Inicio', 'inicio', 1, true, false),
  ('Locales', 'locales', 2, true, false),
  ('Provinciales', 'provinciales', 3, true, false),
  ('Policiales', 'policiales', 4, true, false),
  ('Deportes', 'deportes', 5, true, false),
  ('Economia', 'economia', 6, false, false),
  ('Nacionales', 'nacionales', 7, false, false),
  ('Internacionales', 'internacionales', 8, false, false),
  ('Gremiales', 'gremiales', 9, false, false),
  ('Educacion', 'educacion', 10, false, false),
  ('Cultura y Espectaculos', 'cultura-espectaculos', 11, false, false),
  ('Judiciales', 'judiciales', 12, false, false),
  ('Tecnologia', 'tecnologia', 13, false, false),
  ('Salud', 'salud', 14, false, false),
  ('Agroindustria', 'agroindustria', 15, false, false),
  ('Clima', 'clima', 16, false, true),
  ('Necrologicas', 'necrologicas', 17, false, true),
  ('Farmacias de Turno', 'farmacias-turno', 18, false, true),
  ('Servicios Municipales', 'servicios-municipales', 19, false, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample articles for demonstration
INSERT INTO public.articles (title, slug, excerpt, content, image_url, category_id, is_featured, is_published, published_at) VALUES
  (
    'Nueva plaza inaugurada en el centro de Rafaela',
    'nueva-plaza-inaugurada-centro-rafaela',
    'El intendente corto la cinta de la nueva plaza que beneficiara a miles de vecinos del centro de la ciudad.',
    'El intendente de Rafaela inauguro oficialmente la nueva plaza ubicada en el corazon de la ciudad. El espacio verde cuenta con juegos para ninos, bancos, iluminacion LED y un sistema de riego automatico. Los vecinos celebraron esta nueva incorporacion al espacio publico de la ciudad.',
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'locales'),
    true,
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'Atletico Rafaela vencio 2-0 en el clasico regional',
    'atletico-rafaela-vencio-clasico-regional',
    'Gran victoria del equipo local ante su rival historico con goles de Martinez y Gonzalez.',
    'Atletico Rafaela logro una importante victoria por 2-0 en el clasico regional disputado en el Estadio Nuevo Monumental. Los goles fueron convertidos por Juan Martinez en el primer tiempo y Carlos Gonzalez en el complemento. El equipo suma tres victorias consecutivas.',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'deportes'),
    true,
    true,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Accidente de transito deja dos heridos leves',
    'accidente-transito-dos-heridos-leves',
    'Dos vehiculos colisionaron en la interseccion de Bv. Santa Fe y calle Cordoba.',
    'Un accidente de transito ocurrio esta manana en la interseccion de Boulevard Santa Fe y calle Cordoba. Dos personas resultaron con heridas leves y fueron trasladadas al Hospital Dr. Jaime Ferre. Personal de transito trabajo en el lugar para normalizar la circulacion.',
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'policiales'),
    true,
    true,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'Gobierno provincial anuncia nuevas obras viales',
    'gobierno-provincial-nuevas-obras-viales',
    'Se invertiran mas de 500 millones de pesos en mejoras de rutas provinciales.',
    'El Gobierno de Santa Fe anuncio un ambicioso plan de obras viales que beneficiara a toda la region. Las obras incluyen la repavimentacion de la Ruta Provincial 70 y mejoras en accesos a localidades cercanas a Rafaela.',
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'provinciales'),
    true,
    true,
    NOW() - INTERVAL '4 hours'
  ),
  (
    'Feria de emprendedores en Plaza 25 de Mayo',
    'feria-emprendedores-plaza-25-mayo',
    'Este fin de semana se realizara la tradicional feria con mas de 50 expositores locales.',
    'La Municipalidad de Rafaela organiza una nueva edicion de la Feria de Emprendedores que se llevara a cabo en la Plaza 25 de Mayo. Mas de 50 emprendedores locales ofreceran sus productos artesanales, gastronomia y servicios.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'locales'),
    false,
    true,
    NOW() - INTERVAL '5 hours'
  ),
  (
    'Nuevo centro de salud en barrio Villa Rosas',
    'nuevo-centro-salud-barrio-villa-rosas',
    'El centro atendera a mas de 5000 vecinos de la zona sur de la ciudad.',
    'Se inauguro el nuevo Centro de Atencion Primaria de Salud en el barrio Villa Rosas. El establecimiento cuenta con consultorios de medicina general, pediatria, odontologia y enfermeria. Atendera de lunes a viernes de 7 a 19 horas.',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'salud'),
    false,
    true,
    NOW() - INTERVAL '6 hours'
  ),
  (
    'Inflacion de marzo fue del 4.2% segun INDEC',
    'inflacion-marzo-indec',
    'El indice de precios al consumidor mostro una leve desaceleracion respecto al mes anterior.',
    'El Instituto Nacional de Estadistica y Censos (INDEC) informo que la inflacion de marzo fue del 4.2%, mostrando una leve desaceleracion respecto al 4.6% registrado en febrero. Los rubros con mayor incidencia fueron alimentos y bebidas.',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'economia'),
    false,
    true,
    NOW() - INTERVAL '7 hours'
  ),
  (
    'Festival de teatro independiente en el Centro Cultural',
    'festival-teatro-independiente-centro-cultural',
    'Durante tres dias se presentaran obras de companias de toda la region.',
    'El Centro Cultural Municipal sera sede del Festival de Teatro Independiente que reunira a companias teatrales de Santa Fe, Cordoba y Buenos Aires. Las funciones seran gratuitas y se desarrollaran viernes, sabado y domingo.',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'cultura-espectaculos'),
    false,
    true,
    NOW() - INTERVAL '8 hours'
  ),
  (
    'Gremios docentes anuncian paro por 48 horas',
    'gremios-docentes-paro-48-horas',
    'Los sindicatos reclaman aumento salarial y mejoras en condiciones laborales.',
    'Los principales gremios docentes de la provincia anunciaron un paro de 48 horas para la proxima semana. El reclamo incluye un aumento salarial del 25% y mejoras en la infraestructura escolar. Las autoridades convocaron a una mesa de dialogo.',
    'https://images.unsplash.com/photo-1544411047-c491e34a24e0?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'gremiales'),
    false,
    true,
    NOW() - INTERVAL '9 hours'
  ),
  (
    'Escuelas tecncias recibiran nuevo equipamiento',
    'escuelas-tecnicas-nuevo-equipamiento',
    'El programa Conectar Igualdad entregara computadoras y herramientas a 15 establecimientos.',
    'El Ministerio de Educacion de la Nacion, a traves del programa Conectar Igualdad, entregara nuevo equipamiento informatico y herramientas a 15 escuelas tecnicas de la region. Los estudiantes recibiran notebooks y kits de robotica.',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'educacion'),
    false,
    true,
    NOW() - INTERVAL '10 hours'
  ),
  (
    'Cosecha record de soja en la region',
    'cosecha-record-soja-region',
    'Los productores locales celebran rindes superiores al promedio historico.',
    'La campana agricola 2025/2026 arrojo resultados excepcionales para los productores de soja de la region. Los rindes promedio superaron los 40 quintales por hectarea, un record historico para la zona. Las lluvias oportunas y el buen manejo agronomico fueron claves.',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'agroindustria'),
    false,
    true,
    NOW() - INTERVAL '11 hours'
  ),
  (
    'Lluvia intensa pronosticada para el fin de semana',
    'lluvia-intensa-fin-semana',
    'El Servicio Meteorologico advierte por tormentas fuertes desde el viernes.',
    'El Servicio Meteorologico Nacional emitio un alerta por tormentas fuertes que afectarian a la region desde el viernes por la noche. Se esperan lluvias de entre 50 y 80 mm con posibilidad de granizo. Se recomienda precaucion a la poblacion.',
    'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&h=500&fit=crop',
    (SELECT id FROM public.categories WHERE slug = 'clima'),
    false,
    true,
    NOW() - INTERVAL '12 hours'
  );
