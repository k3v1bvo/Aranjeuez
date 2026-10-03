// Datos Mock Oficiales — Paseo Aranjuez
// Strict TypeScript types, sin any, sin lorem ipsum, sin emojis

export interface Store {
  id: string;
  name: string;
  category: 'Tecnología' | 'Moda' | 'Gastronomía' | 'Accesorios' | 'Servicios' | 'Belleza';
  floor: 'Piso 1' | 'Piso 2' | 'Piso 3 (Terraza)' | 'Subsuelo';
  localNum: string;
  rating: number;
  schedule: string;
  image: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  floorLabel: string;
  name: string;
  description: string;
  price: number; // en Bs.
  pointsReward: number;
  category: string;
  image: string;
  stock: number;
  featured?: boolean;
}

export interface Reward {
  id: string;
  title: string;
  store: string;
  pointsCost: number;
  category: 'Gastronomía' | 'Moda' | 'Servicios' | 'Estética' | 'Exclusivo';
  image: string;
  stock: number;
  description: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  points: number;
  level: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
  nextLevelPoints: number;
  qrToken: string;
  pinCode: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
}

export interface PointsHistoryItem {
  id: string;
  storeName: string;
  type: 'ganado' | 'canjeado';
  points: number;
  date: string;
  description: string;
}

export const MOCK_USER: UserProfile = {
  name: 'Mateo Quiroga',
  email: 'mateo.quiroga@email.com',
  phone: '+591 77489201',
  memberSince: 'Marzo 2024',
  points: 1450,
  level: 'Plata',
  nextLevelPoints: 5000,
  qrToken: 'PASEO-ARANJUEZ-MQ-7492',
  pinCode: '849 201',
};

export const MOCK_STORES: Store[] = [
  {
    id: 'store-1',
    name: 'TechZone Bolivia',
    category: 'Tecnología',
    floor: 'Piso 1',
    localNum: 'Local 105',
    rating: 4.8,
    schedule: '10:00 - 21:00',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-2',
    name: 'Moda Élite Bolivia',
    category: 'Moda',
    floor: 'Piso 2',
    localNum: 'Local 204',
    rating: 4.9,
    schedule: '10:00 - 21:00',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-3',
    name: 'Terraza Grill & Beer',
    category: 'Gastronomía',
    floor: 'Piso 3 (Terraza)',
    localNum: 'Terraza T-02',
    rating: 4.7,
    schedule: '11:00 - 23:00',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-4',
    name: 'Óptica Visión Aranjuez',
    category: 'Accesorios',
    floor: 'Piso 1',
    localNum: 'Local 112',
    rating: 4.6,
    schedule: '10:00 - 20:30',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-5',
    name: 'Mundo Regalo & Maletas',
    category: 'Accesorios',
    floor: 'Piso 2',
    localNum: 'Local 211',
    rating: 4.8,
    schedule: '10:00 - 21:00',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-6',
    name: 'Café Aranjuez',
    category: 'Gastronomía',
    floor: 'Piso 1',
    localNum: 'Local 118',
    rating: 4.9,
    schedule: '08:30 - 22:00',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'store-7',
    name: 'Barbería Real',
    category: 'Belleza',
    floor: 'Piso 1',
    localNum: 'Local 114',
    rating: 4.8,
    schedule: '09:00 - 20:00',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    storeId: 'store-1',
    storeName: 'TechZone Bolivia',
    floorLabel: 'Piso 1 · Local 105',
    name: 'Audífonos Inalámbricos Pro ANC',
    description: 'Cancelación activa de ruido, 30 horas de autonomía y estuche de carga rápida.',
    price: 280,
    pointsReward: 280,
    category: 'Tecnología',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    stock: 12,
    featured: true,
  },
  {
    id: 'p-2',
    storeId: 'store-2',
    storeName: 'Moda Élite Bolivia',
    floorLabel: 'Piso 2 · Local 204',
    name: 'Chaqueta Outdoor Softshell',
    description: 'Membrana impermeable de alto rendimiento con forro térmico transpirable.',
    price: 450,
    pointsReward: 450,
    category: 'Moda',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    stock: 6,
    featured: true,
  },
  {
    id: 'p-3',
    storeId: 'store-3',
    storeName: 'Terraza Grill & Beer',
    floorLabel: 'Piso 3 · Terraza',
    name: 'Combo Burger Artesanal + Papas',
    description: 'Carne Angus 200g a la parrilla, queso cheddar madurado, panceta y papas rústicas.',
    price: 55,
    pointsReward: 55,
    category: 'Gastronomía',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    stock: 50,
    featured: true,
  },
  {
    id: 'p-4',
    storeId: 'store-4',
    storeName: 'Óptica Visión Aranjuez',
    floorLabel: 'Piso 1 · Local 112',
    name: 'Lentes Polarizados Urban Edition',
    description: 'Protección UV400 completa con armazón de acetato ultraligero.',
    price: 195,
    pointsReward: 195,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    stock: 15,
  },
  {
    id: 'p-5',
    storeId: 'store-5',
    storeName: 'Mundo Regalo & Maletas',
    floorLabel: 'Piso 2 · Local 211',
    name: 'Mochila Antirrobo Ejecutiva',
    description: 'Cremalleras ocultas, puerto USB externo y compartimento acolchado para laptop 15.6".',
    price: 320,
    pointsReward: 320,
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    stock: 8,
  },
  {
    id: 'p-6',
    storeId: 'store-6',
    storeName: 'Café Aranjuez',
    floorLabel: 'Piso 1 · Local 118',
    name: 'Café Pacamara Especial 250g',
    description: 'Café de grano selecto tostado artesanalmente en Cochabamba.',
    price: 65,
    pointsReward: 65,
    category: 'Gastronomía',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    stock: 30,
  },
];

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'rew-1',
    title: 'Café de Especialidad Gratis',
    store: 'Café Aranjuez · Piso 1, Local 118',
    pointsCost: 350,
    category: 'Gastronomía',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    stock: 40,
    description: 'Canjea un café espresso, americano o cappuccino mediano en Café Aranjuez.',
  },
  {
    id: 'rew-2',
    title: 'Cupón 20% de Descuento',
    store: 'Moda Élite · Piso 2, Local 204',
    pointsCost: 800,
    category: 'Moda',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    stock: 25,
    description: 'Válido en cualquier prenda seleccionada de la colección de temporada.',
  },
  {
    id: 'rew-3',
    title: 'Pase Libre Estacionamiento 4h',
    store: 'Subsuelo 1 y 2 · Paseo Aranjuez',
    pointsCost: 500,
    category: 'Servicios',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    stock: 100,
    description: 'Estacionamiento cubierto por 4 horas con acceso directo a elevadores.',
  },
  {
    id: 'rew-4',
    title: 'Corte de Cabello VIP / Barba',
    store: 'Barbería Real · Piso 1, Local 114',
    pointsCost: 1200,
    category: 'Estética',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
    stock: 10,
    description: 'Servicio completo con lavado, perfilado de barba y toalla caliente.',
  },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Festival Potterhead Magia y Fantasía',
    date: '31 Julio - 2 Agosto 2026',
    location: 'Plaza Central · Piso 1',
    description: 'Exhibiciones temáticas, talleres interactivos y feria de coleccionismo.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ev-2',
    title: 'Cenas de Origen Huari',
    date: 'Viernes y Sábados 19:30',
    location: 'Terraza Gastronómica · Piso 3',
    description: 'Maridajes exclusivos y menú degustación con chefs invitados de Bolivia.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'ev-3',
    title: 'Exposiciones en la Galería de Arte',
    date: 'Todo el Mes',
    location: 'Mezzanina Cultural · Nivel 2',
    description: 'Obras contemporáneas y fotografía urbana de artistas cochabambinos.',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
  },
];

export const MOCK_POINTS_HISTORY: PointsHistoryItem[] = [
  {
    id: 'ph-1',
    storeName: 'Don Mateo Grill (Terraza Piso 3)',
    type: 'ganado',
    points: 120,
    date: 'Hoy, 14:30',
    description: 'Compra en local · Bife de Chorizo a la Leña',
  },
  {
    id: 'ph-2',
    storeName: 'Café Aranjuez (Piso 1)',
    type: 'canjeado',
    points: -350,
    date: 'Ayer, 16:15',
    description: 'Canje de Café Americano + Croissant',
  },
  {
    id: 'ph-3',
    storeName: 'Moda Élite (Piso 2)',
    type: 'ganado',
    points: 450,
    date: '30 Sep 2026',
    description: 'Compra presencial · Chaqueta de Cuero',
  },
  {
    id: 'ph-4',
    storeName: 'Paseo Aranjuez (Torre)',
    type: 'ganado',
    points: 200,
    date: '28 Sep 2026',
    description: 'Bonificación por visita recurrente al mall',
  },
  {
    id: 'ph-5',
    storeName: 'Estacionamiento Subsuelo',
    type: 'canjeado',
    points: -500,
    date: '25 Sep 2026',
    description: 'Pase Libre 4 Horas de Parqueo Cubierto',
  },
];
