// Synthetic fixtures. These are not confirmed tenants, schedules or offers of the Paseo.
export const demoId = (kind, n) =>
  `d0000000-${String(kind).padStart(4, '0')}-4000-8000-${String(n).padStart(12, '0')}`;
export function demoData() {
  const users = [
    ['Cliente Demo', 'cliente'],
    ['Comercio Demo', 'comercio'],
    ['Administración Demo', 'admin'],
    ['Segundo Comercio Demo', 'comercio'],
    ['Segundo Cliente Demo', 'cliente'],
  ].map(([name, role], i) => ({
    id: demoId(1, i + 1),
    name,
    role,
    email: ['cliente', 'comercio', 'admin', 'comercio2', 'cliente2'][i] + '@paseo.example',
    points: 0,
    lifetime_points: 0,
    is_active: true,
  }));
  const stores = [
    ['Café Encuentro · Demo', 'gastronomia', 'Café de especialidad y repostería para una pausa.'],
    ['Conecta · Demo', 'tecnologia', 'Accesorios y tecnología para todos los días.'],
    ['Detalles · Demo', 'regalos', 'Pequeños regalos para momentos especiales.'],
    ['Estilo Local · Demo', 'moda', 'Accesorios y prendas para tu próximo plan.'],
    ['Audio y Más · Demo', 'tecnologia', 'Audífonos y accesorios de audio.'],
    ['Espacio Bienestar · Demo', 'servicios', 'Información y reservas presenciales de servicios.'],
  ].map(([name, category, description], i) => ({
    id: demoId(2, i + 1),
    owner_id: demoId(1, i === 4 ? 4 : 2),
    name,
    category,
    description: description + ' Establecimiento ficticio de demostración.',
    floor: i < 3 ? 'Planta baja (demo)' : 'Primer piso (demo)',
    sector: i % 2 ? 'Sector B (demo)' : 'Sector A (demo)',
    local_num: `D-${i + 1}`,
    reference: 'Ubicación ilustrativa; confirmar los locales reales con administración.',
    schedule: 'Horario ilustrativo: lunes a sábado, 10:00–20:00.',
    phone: '',
    is_active: true,
  }));
  const items = [
    ['Cappuccino de la casa', 1, 22, 'Café espresso con leche y espuma cremosa.', 'gastronomia'],
    [
      'Croissant artesanal',
      1,
      18,
      'Hojaldre recién horneado para acompañar tu café.',
      'gastronomia',
    ],
    ['Combo pausa de café', 1, 38, 'Un cappuccino y una porción de repostería.', 'gastronomia'],
    [
      'Audífonos Bluetooth Urban',
      2,
      129,
      'Conexión inalámbrica, estuche de carga y micrófono.',
      'tecnologia',
    ],
    [
      'Soporte de escritorio',
      2,
      49,
      'Soporte ajustable para teléfono, ligero y plegable.',
      'tecnologia',
    ],
    [
      'Caja regalo Momentos',
      3,
      95,
      'Una selección de libreta, vela y tarjeta para regalar.',
      'regalos',
    ],
    [
      'Vela aromática Jardín',
      3,
      45,
      'Vela artesanal con aroma floral y envase reutilizable.',
      'regalos',
    ],
    ['Libreta creativa', 3, 35, 'Libreta de tapa dura para ideas y nuevos proyectos.', 'regalos'],
    ['Bolso de tela Paseo', 4, 65, 'Bolso de algodón amplio y reutilizable.', 'moda'],
    ['Pañuelo de temporada', 4, 79, 'Accesorio ligero con estampado para combinar.', 'moda'],
    [
      'Audífonos Bluetooth Compact',
      5,
      99,
      'Modelo compacto con micrófono y carga USB-C.',
      'tecnologia',
    ],
    [
      'Parlante portátil',
      5,
      149,
      'Parlante Bluetooth pequeño para compartir música.',
      'tecnologia',
    ],
  ];
  const products = items.map(([name, store, price, description, category], i) => ({
    id: demoId(3, i + 1),
    store_id: demoId(2, store),
    name,
    price,
    description,
    category,
    stock: 20,
    is_active: true,
    is_featured: [0, 3, 5, 8].includes(i),
    image_url: null,
  }));
  const rewards = [
    ['Un café para volver', 40, 1, 'Canjea un café de cortesía en el local de demostración.'],
    ['Detalle sorpresa', 100, 3, 'Recibe una libreta creativa en el local de demostración.'],
    [
      'Beneficio Club Paseo',
      200,
      null,
      'Cupón de demostración válido en un comercio participante.',
    ],
  ].map(([name, points_cost, store, description], i) => ({
    id: demoId(4, i + 1),
    name,
    points_cost,
    store_id: store ? demoId(2, store) : null,
    description,
    stock: 30,
    is_active: true,
  }));
  const date = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const promotions = [
    {
      id: demoId(5, 1),
      store_id: demoId(2, 1),
      title: 'La pausa sabe mejor · Demo',
      description:
        'Promoción ilustrativa: consulta el combo de café en el catálogo. No constituye una oferta real.',
      discount: 0,
      start_date: date(-1),
      end_date: date(30),
      is_active: true,
    },
  ];
  const events = [
    {
      id: demoId(6, 1),
      title: 'Tarde de ideas y café · Demo',
      description: 'Evento ficticio para mostrar la agenda del Paseo y las respuestas de Jarvis.',
      starts_at: date(7) + 'T18:00:00-04:00',
      ends_at: date(7) + 'T20:00:00-04:00',
      location: 'Espacio central (ubicación de demostración)',
      is_active: true,
    },
  ];
  return { users, stores, products, rewards, promotions, events };
}
