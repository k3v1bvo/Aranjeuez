-- =============================================
-- MIGRACIÓN 06: Seed Data — Datos de Prueba
-- Categorías, productos, órdenes demo
-- =============================================
-- NOTE: Users must be created via Supabase Auth first.
-- This seed uses placeholder UUIDs. Replace with real user IDs after signup.
-- Or use the demo mode in the app which doesn't require Supabase connection.

-- ============ CATEGORIES ============
INSERT INTO categories (id, name, slug, description, position, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Chalecos Tácticos', 'chalecos-tacticos', 'Chalecos antibalas, porta-placas y plate carriers de grado militar', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Calzado Táctico', 'calzado-tactico', 'Botas militares, de combate y operativas de alto rendimiento', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Óptica & Linternas', 'optica-linternas', 'Miras holográficas, telescópicas, linternas tácticas y visión nocturna', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Mochilas & Bolsos', 'mochilas-bolsos', 'Mochilas militares, bolsos MOLLE y fundas de transporte', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Accesorios Tácticos', 'accesorios-tacticos', 'Guantes, rodilleras, cinturones, fundas y accesorios MOLLE', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'Cuchillería', 'cuchilleria', 'Cuchillos tácticos, navajas y herramientas de supervivencia', 6, true),
  ('c1000000-0000-0000-0000-000000000007', 'Comunicaciones', 'comunicaciones', 'Radios, auriculares tácticos y sistemas de comunicación', 7, true),
  ('c1000000-0000-0000-0000-000000000008', 'Vestimenta Táctica', 'vestimenta-tactica', 'Uniformes, pantalones cargo, camisetas y ropa táctica', 8, true);

-- ============ DEMO PRODUCTS (using placeholder vendor_id — replace in production) ============
-- These will work with the demo mode in the app
-- In production, create users first and use their real UUIDs

-- NOTE: The following inserts require a valid vendor_id in profiles table.
-- For demo purposes, we provide the SQL but it should be run AFTER creating demo users.
-- The frontend app has built-in demo data that doesn't require this seed.

/*
-- Uncomment and replace 'VENDOR_UUID_HERE' with real vendor profile ID after creating users

INSERT INTO products (name, description, price, stock, low_stock_threshold, category_id, images, vendor_id) VALUES
  ('Plate Carrier Táctico Nivel IV', 'Porta-placas táctico con sistema MOLLE completo. Compatible con placas balísticas NIJ IV. Ajuste rápido con velcro y hebillas. Color: Multicam.', 289.99, 15, 3, 'c1000000-0000-0000-0000-000000000001', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Plate+Carrier'], 'VENDOR_UUID_HERE'),
  ('Botas Tácticas Desert Storm', 'Botas de combate con suela Vibram, membrana impermeable Gore-Tex, puntera reforzada. Altura: 8 pulgadas. Color: Arena.', 179.99, 22, 5, 'c1000000-0000-0000-0000-000000000002', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Botas+Desert'], 'VENDOR_UUID_HERE'),
  ('Mira Holográfica EOTech XPS3', 'Mira holográfica de punto rojo con retícula 68 MOA. Compatible con visión nocturna. Sumergible 10m. Batería CR123A.', 599.99, 8, 2, 'c1000000-0000-0000-0000-000000000003', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=EOTech+XPS3'], 'VENDOR_UUID_HERE'),
  ('Mochila Táctica 72h Assault', 'Mochila de asalto 45L con sistema MOLLE, compartimento para hidratación, múltiples bolsillos y correas de compresión. Color: OD Green.', 129.99, 30, 5, 'c1000000-0000-0000-0000-000000000004', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Mochila+72h'], 'VENDOR_UUID_HERE'),
  ('Guantes Tácticos Oakley SI', 'Guantes de operaciones con protección en nudillos, palma antideslizante Kevlar y pantalla táctil compatible. Talla: M-XL.', 64.99, 45, 10, 'c1000000-0000-0000-0000-000000000005', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Guantes+Oakley'], 'VENDOR_UUID_HERE'),
  ('Cuchillo KA-BAR USMC', 'Cuchillo de combate USMC con hoja de acero 1095 Cro-Van de 7 pulgadas. Mango de cuero apilado. Incluye funda Kydex.', 89.99, 18, 3, 'c1000000-0000-0000-0000-000000000006', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=KA-BAR+USMC'], 'VENDOR_UUID_HERE'),
  ('Radio Baofeng UV-5R Táctica', 'Radio bidireccional dual-band (VHF/UHF) con 128 canales, batería de 1800mAh y alcance de hasta 5km. Incluye auricular.', 39.99, 50, 10, 'c1000000-0000-0000-0000-000000000007', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Baofeng+UV5R'], 'VENDOR_UUID_HERE'),
  ('Pantalón Cargo Táctico Ripstop', 'Pantalón de combate con tela ripstop reforzada, rodilleras integradas, 8 bolsillos cargo y cintura ajustable. Color: Khaki.', 54.99, 60, 10, 'c1000000-0000-0000-0000-000000000008', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Pantalon+Cargo'], 'VENDOR_UUID_HERE'),
  ('Linterna Táctica SureFire G2X', 'Linterna LED de 600 lúmenes con cuerpo de polímero Nitrolon, 2 modos (alto/bajo), bisel de acero inoxidable. Batería CR123A x2.', 79.99, 25, 5, 'c1000000-0000-0000-0000-000000000003', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=SureFire+G2X'], 'VENDOR_UUID_HERE'),
  ('Cinturón Táctico Rigger', 'Cinturón de servicio con hebilla de liberación rápida V-Ring, refuerzo interno rígido y sistema MOLLE. Ancho: 1.75 pulgadas.', 44.99, 35, 5, 'c1000000-0000-0000-0000-000000000005', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Cinturon+Rigger'], 'VENDOR_UUID_HERE'),
  ('Chaleco Táctico Ligero MOLLE', 'Chaleco táctico ligero con sistema MOLLE completo, ventilación mesh y bolsillos para cargadores. Ideal para airsoft y entrenamiento.', 69.99, 40, 8, 'c1000000-0000-0000-0000-000000000001', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Chaleco+MOLLE'], 'VENDOR_UUID_HERE'),
  ('Kit de Supervivencia Táctico', 'Kit completo con pedernal, brújula, sierra de cable, manta térmica, silbato y más. 15 herramientas en estuche compacto.', 34.99, 55, 10, 'c1000000-0000-0000-0000-000000000006', ARRAY['https://placehold.co/600x600/1a1a2e/e94560?text=Kit+Supervivencia'], 'VENDOR_UUID_HERE');
*/
