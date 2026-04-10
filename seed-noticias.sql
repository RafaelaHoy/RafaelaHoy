-- Script para insertar noticias de prueba realistas para Rafaela y la región
-- Inserta 2 noticias por categoría actual

-- Insertar noticias para categoría "Locales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Continúan las obras de pavimentación en el centro de Rafaela',
    'continuan-obras-pavimentacion-centro-rafaela',
    'El municipio informó que avanzan los trabajos de renovación del pavimento en las calles más céntricas de la ciudad. Se estima que las obras finalizarán en las próximas semanas, mejorando la circulación vehicular y peatonal.',
    'El municipio avanza con las obras de pavimentación en el centro de Rafaela, mejorando la infraestructura vial para vecinos y comerciantes.',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'locales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Atlético de Rafaela se prepara para el clásico local del fin de semana',
    'atletico-rafaela-clasico-local-fin-semana',
    'El equipo "La Crema" realizará la última práctica hoy en el Predio del Club antes de enfrentarse a su rival tradicional. El técnico confirmó la formación titular y expresó confianza en el resultado del partido.',
    'Atlético de Rafaela completa los preparativos para el clásico del fin de semana con el equipo completo y la confianza puesta en la victoria.',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'locales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Regionales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Reconquista: Nuevo centro de salud atenderá a más de 10.000 vecinos',
    'reconquista-nuevo-centro-salud-vecinos',
    'Las autoridades provinciales inauguraron un moderno centro de atención primaria en Reconquista que beneficiará a más de diez mil habitantes de la zona. El establecimiento cuenta con equipamiento de última generación y personal médico especializado.',
    'Inauguran en Reconquista un nuevo centro de salud que atenderá a más de 10.000 vecinos con equipamiento moderno.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'regionales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Productores de Sunchales solicitan apoyo ante la sequía',
    'productores-sunchales-apoyo-sequia',
    'Los agricultores de la zona de Sunchales expresaron su preocupación por la falta de lluvias y solicitaron medidas de ayuda económica del gobierno provincial. La situación afecta principalmente los cultivos de soja y maíz.',
    'Productores de Sunchales piden ayuda económica ante la persistente sequía que afecta los cultivos de la región.',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'regionales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Provinciales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Santa Fe: Anuncian nuevo plan de obras públicas para 2024',
    'santa-fe-nuevo-plan-obras-publicas-2024',
    'El gobernador de Santa Fe presentó el plan de infraestructura para el próximo año que incluye más de 500 proyectos en toda la provincia. Las inversiones superarán los 50.000 millones de pesos.',
    'El gobierno provincial anuncia un ambicioso plan de obras públicas para 2024 con más de 500 proyectos y grandes inversiones.',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'provinciales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Aumentan los controles de tránsito en rutas santafesinas',
    'aumentan-controles-transito-rutas-santafesinas',
    'Las autoridades de tránsito provincial intensificaron los controles en las rutas más transitadas de Santa Fe. La medida busca reducir los accidentes fatales que han aumentado en los últimos meses.',
    'Intensifican los controles de tránsito en las rutas de Santa Fe para reducir la cantidad de accidentes fatales.',
    'https://images.unsplash.com/photo-1515522697342-e5d63b2733e8?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'provinciales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Policiales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Detienen a una banda dedicada a robos en comercios de Rafaela',
    'detienen-banda-robos-comercios-rafaela',
    'La policía local logró desarticular una banda que se dedicaba a robar en comercios del centro de la ciudad. Se recuperó mercadería por más de dos millones de pesos y hay cinco personas detenidas.',
    'La policía de Rafaela desarticuló una banda de ladrones de comercios con cinco detenidos y mercadería recuperada.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'policiales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Investigan un incendio en una vivienda del barrio Las Heras',
    'investigan-incendio-vivienda-barrio-las-heras',
    'Las causas del fuego que destruyó una casa en el barrio Las Heras de Rafaela todavía se investigan. Los bomberos pudieron controlar las llamas antes de que se propagaran a viviendas vecinas.',
    'Investigan las causas de un incendio que destruyó una vivienda en el barrio Las Heras de Rafaela.',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'policiales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Deportes"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Ben Hur se impuso como local en la Liga Nacional de Básquet',
    'ben-hur-impuso-local-liga-nacional-basquet',
    'El conjunto rafaelino derrotó a su rival por 89-84 en un partido emocionante jugado en el Fortín. La figura del encuentro fue el base que aportó 25 puntos y 8 asistencias.',
    'Ben Hur venció 89-84 en el Fortín y mantiene su buen rendimiento en la Liga Nacional de Básquet.',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc0?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'deportes'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Rafaela Rugby Club prepara el torneo de primavera',
    'rafaela-rugby-club-prepara-torneo-primavera',
    'El club organizador confirmó que el tradicional torneo de primavera se realizará el próximo mes con equipos de toda la provincia. Las inscripciones ya están abiertas y se esperan más de 20 participantes.',
    'Rafaela Rugby Club organiza el tradicional torneo de primavera con equipos de toda la provincia.',
    'https://images.unsplash.com/photo-1517466787929-bc90951ce09c?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'deportes'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Política"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'El Concejo Deliberante aprobó nuevas ordenanzas municipales',
    'concejo-deliberante-aprobo-nuevas-ordenanzas-municipales',
    'Los ediles de Rafaela dieron sanción definitiva a tres ordenanzas que regulan el uso del espacio público y la actividad comercial. Las normas entrarán en vigencia a partir del próximo mes.',
    'El Concejo Deliberante aprobó nuevas ordenanzas que regulan el uso del espacio público y la actividad comercial.',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'politica'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Presentaron proyectos para mejorar la seguridad ciudadana',
    'presentaron-proyectos-mejorar-seguridad-ciudadana',
    'Diferentes bloques políticos presentaron iniciativas para fortalecer la seguridad en Rafaela. Los proyectos incluyen mayor presencia policial y instalación de nuevas cámaras de vigilancia.',
    'Presentaron proyectos en el Concejo para mejorar la seguridad ciudadana con más policía y cámaras.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'politica'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Economía"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'El agro rafaelino muestra signos de recuperación',
    'agro-rafaelino-muestra-signos-recuperacion',
    'Los últimos informes del sector agropecuario regional indican una mejoría en los precios de los granos. Los productores de la zona de Rafaela expresan optimismo ante la perspectiva de mejores cosechas.',
    'El sector agropecuario de Rafaela muestra signos de recuperación con mejoría en los precios de los granos.',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'economia'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Comerciantes locales reportan aumento en las ventas de fin de año',
    'comerciantes-locales-aumento-ventas-fin-ano',
    'Los negocios de Rafaela registran un incremento del 15% en las ventas comparado con el mismo período del año anterior. El movimiento comercial se nota especialmente en el centro de la ciudad.',
    'Los comercios de Rafaela reportan un aumento del 15% en las ventas de fin de año respecto al 2023.',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'economia'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Educación"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'La UTN Rafaela lanza nueva carrera tecnológica',
    'utn-rafaela-lanza-nueva-carrera-tecnologica',
    'La Universidad Tecnológica Nacional Regional Rafaela presentó una nueva carrera de grado en Inteligencia Artificial. Las inscripciones ya están abiertas y las clases comenzarán en marzo.',
    'La UTN Rafaela lanza una nueva carrera de grado en Inteligencia Artificial con inscripciones abiertas.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'educacion'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Escuelas rurales recibirán equipamiento informático',
    'escuelas-rurales-recibiran-equipamiento-informatico',
    'El Ministerio de Educación provincial anunció la entrega de computadoras y tablets a 15 escuelas rurales de la región. La iniciativa busca reducir la brecha digital en el ámbito educativo.',
    'Anuncian la entrega de equipamiento informático para 15 escuelas rurales de la región.',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'educacion'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Judiciales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Inicia juicio por fraude en empresa local',
    'inicia-juicio-fraude-empresa-local',
    'Comenzó el juicio oral contra los directivos de una empresa rafaelina acusados de estafa a más de 100 inversores. El proceso judicial se desarrollará en los tribunales de la ciudad.',
    'Comenzó el juicio contra los directivos de una empresa local acusados de estafar a más de 100 inversores.',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'judiciales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Falló a favor de trabajadores en un caso de despido',
    'fallo-favor-trabajadores-caso-despido',
    'La justicia laboral dictaminó a favor de los empleados de una empresa de servicios que fueron despedidos sin causa justificada. La firma deberá indemnizar a los trabajadores afectados.',
    'La justicia laboral falló a favor de trabajadores despedidos sin causa justificada por una empresa de servicios.',
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'judiciales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Cultura y Espectáculos"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Llega el Festival de Cine Independiente a Rafaela',
    'llega-festival-cine-independiente-rafaela',
    'Del 15 al 20 de diciembre se realizará la edición número 12 del Festival de Cine Independiente en el cine local. Se proyectarán más de 40 películas de realizadores nacionales e internacionales.',
    'Rafaela será sede del Festival de Cine Independiente con más de 40 películas en programación.',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'cultura-y-espectaculos'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'El Museo Municipal presenta nueva exposición de arte local',
    'museo-municipal-nueva-exposicion-arte-local',
    'El Museo Histórico Municipal de Rafaela inauguró una exposición que reúne obras de 20 artistas plásticos de la ciudad. La muestra permanecerá abierta durante todo el verano.',
    'El Museo Municipal de Rafaela presenta una exposición con obras de 20 artistas locales.',
    'https://images.unsplash.com/photo-1536924940846-6b05b3ae4b93?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'cultura-y-espectaculos'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Salud"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Hospital Cullen incorpora nuevo equipo de diagnóstico',
    'hospital-cullen-incorpora-nuevo-equipo-diagnostico',
    'El principal nosocomio de Rafaela adquirió un moderno tomógrafo que permitirá mejorar los estudios diagnósticos. La inversión superó los 50 millones de pesos y beneficiará a miles de pacientes.',
    'El Hospital Cullen incorporó un moderno tomógrafo para mejorar los estudios diagnósticos de los pacientes.',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'salud'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Lanzan campaña de vacunación gratuita en Rafaela',
    'lanzan-campana-vacunacion-gratuita-rafaela',
    'El municipio inició una campaña de vacunación gratuita contra la gripe y el COVID-19. La inmunización se realizará en diferentes centros de salud de la ciudad hasta fin de mes.',
    'Comenzó en Rafaela una campaña de vacunación gratuita contra gripe y COVID-19 en centros de salud.',
    'https://images.unsplash.com/photo-1584118624036-cbf14d98b544?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'salud'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Agroindustria"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Nueva planta de procesamiento de granos se instalará en la región',
    'nueva-planta-procesamiento-granos-region',
    'Una importante empresa agroindustrial anunció la construcción de una planta de procesamiento de granos en la zona de Rafaela. La inversión generará 200 puestos de trabajo directos e indirectos.',
    'Anuncian la construcción de una nueva planta de procesamiento de granos que generará 200 empleos.',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'agroindustria'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Exportaciones de lácteos rafaelinos aumentaron un 20%',
    'exportaciones-lacteos-rafaelinos-aumentaron-20',
    'El sector lácteo de Rafaela registró un incremento del 20% en las exportaciones durante el último semestre. Los principales destinos fueron Brasil y países del sudeste asiático.',
    'Las exportaciones de lácteos de Rafaela aumentaron un 20% en el último semestre.',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'agroindustria'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Interés general"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Rafaela será sede del Congreso Nacional de Ciudades',
    'rafaela-sede-congreso-nacional-ciudades',
    'La ciudad fue elegida para organizar el próximo Congreso Nacional de Ciudades que reunirá a intendentes de todo el país. El evento se desarrollará en marzo en el centro de convenciones local.',
    'Rafaela fue elegida sede del Congreso Nacional de Ciudades que reunirá a intendentes de todo el país.',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'interes-general'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Recordan los 25 años del Centro Cultural',
    'recuerdan-25-anos-centro-cultural',
    'El Centro Cultural de Rafaela cumple un cuarto de siglo y prepara una serie de actividades para celebrarlo. Durante todo el mes habrá espectáculos, talleres y eventos especiales.',
    'El Centro Cultural de Rafaela celebra sus 25 años con una programación especial de actividades.',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'interes-general'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Tecnología"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Rafaela: Primera ciudad en implementar wifi gratuito en todo el centro',
    'rafaela-primera-ciudad-implementar-wifi-gratuito-centro',
    'El municipio completó la instalación de puntos de acceso wifi gratuito en todo el microcentro de Rafaela. El servicio beneficiará a comerciantes, estudiantes y turistas que transitan la zona.',
    'Rafaela se convierte en la primera ciudad de la provincia en implementar wifi gratuito en todo el microcentro.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'tecnologia'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Lanzan app para pagos de servicios municipales',
    'lanzan-app-pagos-servicios-municipales',
    'El gobierno local presentó una aplicación móvil que permite pagar impuestos, tasas y servicios municipales desde el celular. La iniciativa busca modernizar la gestión administrativa.',
    'Presentaron una app para realizar pagos de servicios municipales desde el celular.',
    'https://images.unsplash.com/photo-1512941937409-4616e2b1c1a2?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'tecnologia'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Virales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'Video de un gato ayudando en un comercio de Rafaela se vuelve viral',
    'video-gato-ayudando-comercio-rafaela-viral',
    'Un video que muestra a un gato "atendiendo" clientes en una tienda de Rafaela acumula más de un millón de visitas en redes sociales. El dueño cuenta que el felino es la mascota del local desde hace años.',
    'Un video de un gato "atendiendo" clientes en un comercio de Rafaela se volvió viral con más de un millón de visitas.',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'virales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Vecinos organizan flash mob en la plaza principal',
    'vecinos-organizan-flash-mob-plaza-principal',
    'Un grupo de jóvenes sorprendió a los transeúntes con un flash mob en la plaza 25 de Mayo de Rafaela. El video del evento ya supera las 500.000 reproducciones en redes sociales.',
    'Jóvenes organizaron un flash mob en la plaza principal de Rafaela que se volvió viral en redes sociales.',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'virales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Insertar noticias para categoría "Internacionales"
INSERT INTO articles (
    title, 
    slug, 
    content, 
    excerpt, 
    image_url, 
    category_id, 
    is_published, 
    is_featured, 
    published_at, 
    created_at, 
    sort_order
) VALUES 
(
    'La ONU alerta sobre el cambio climático en América Latina',
    'onu-alerta-cambio-climatico-america-latina',
    'Un nuevo informe de las Naciones Unidas advierte sobre los impactos del cambio climático en América Latina. El documento destaca la necesidad de políticas urgentes para mitigar los efectos.',
    'La ONU emitió una alerta sobre los impactos del cambio climático en América Latina y la necesidad de acción urgente.',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'internacionales'),
    true,
    true,
    NOW(),
    NOW(),
    1
),
(
    'Mercados globales reaccionan positivamente a nuevas medidas económicas',
    'mercados-globales-reaccionan-positivamente-medidas-economicas',
    'Los principales mercados financieros internacionales mostraron una tendencia alcista tras el anuncio de nuevas medidas económicas en Estados Unidos y Europa. Los inversores expresan optimismo.',
    'Los mercados financieros globales reaccionan positivamente a las nuevas medidas económicas de EE.UU. y Europa.',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    (SELECT id FROM categories WHERE slug = 'internacionales'),
    true,
    false,
    NOW(),
    NOW(),
    2
);

-- Confirmación de inserción
SELECT 'Noticias de prueba insertadas correctamente para todas las categorías' AS resultado;
