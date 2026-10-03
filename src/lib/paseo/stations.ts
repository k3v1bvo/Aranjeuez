// Catálogo único de estaciones QR físicas (tótems) del Paseo.
// Lo usan la API (check-in), el panel de QRs y el mapa de calor, así las
// coordenadas X/Y/Z siempre coinciden en los tres lugares.

export type FloorId = 'subsuelo' | 'piso-pb' | 'piso-1' | 'piso-2' | 'piso-3';
export type StationKind = 'bienvenida' | 'entrada' | 'salida';

export interface Station {
  code: string;
  name: string;
  floorId: FloorId;
  floorLabel: string;
  z: number;
  /** Posición en % sobre el plano del piso (0-100). */
  x: number;
  y: number;
  kind: StationKind;
  points: number;
  place: string;
}

export const FLOORS: Array<{ id: FloorId; label: string; short: string; z: number }> = [
  { id: 'piso-pb', label: 'Planta Baja', short: 'PB', z: 0 },
  { id: 'piso-1', label: 'Piso 1', short: 'P1', z: 1 },
  { id: 'piso-2', label: 'Piso 2', short: 'P2', z: 2 },
  { id: 'piso-3', label: 'Piso 3 · Terraza', short: 'P3', z: 3 },
  { id: 'subsuelo', label: 'Subsuelo 1', short: 'S1', z: -1 },
];

/** Puntos por tipo de estación. */
export const POINTS_BY_KIND: Record<StationKind, number> = {
  bienvenida: 5,
  entrada: 1,
  salida: 2,
};

/** Minutos mínimos entre la entrada y la salida de un mismo piso para que la salida sume. */
export const MIN_MINUTES_ON_FLOOR = 2;

function floorStations(
  floorId: FloorId,
  entrada: { x: number; y: number; place: string },
  salida: { x: number; y: number; place: string },
): Station[] {
  const floor = FLOORS.find((f) => f.id === floorId)!;
  return [
    {
      code: `PASEO-${floor.short}-ENTRADA`,
      name: `Entrada ${floor.label}`,
      floorId,
      floorLabel: floor.label,
      z: floor.z,
      kind: 'entrada',
      points: POINTS_BY_KIND.entrada,
      ...entrada,
    },
    {
      code: `PASEO-${floor.short}-SALIDA`,
      name: `Salida ${floor.label}`,
      floorId,
      floorLabel: floor.label,
      z: floor.z,
      kind: 'salida',
      points: POINTS_BY_KIND.salida,
      ...salida,
    },
  ];
}

export const STATIONS: Station[] = [
  // Planta baja: coordenadas sobre el plano oficial de evacuación (viewBox 1000x660).
  {
    code: 'PASEO-INGRESO-AMERICA',
    name: 'Ingreso Av. América',
    floorId: 'piso-pb',
    floorLabel: 'Planta Baja',
    z: 0,
    x: 22,
    y: 17,
    kind: 'bienvenida',
    points: POINTS_BY_KIND.bienvenida,
    place: 'Puerta principal · Lobby y núcleo de ascensores',
  },
  {
    code: 'PASEO-INGRESO-DALENCE',
    name: 'Ingreso Calle Pantaleón Dalence',
    floorId: 'piso-pb',
    floorLabel: 'Planta Baja',
    z: 0,
    x: 78,
    y: 68,
    kind: 'bienvenida',
    points: POINTS_BY_KIND.bienvenida,
    place: 'Acceso peatonal lateral con gradas',
  },
  {
    code: 'PASEO-PB-SALIDA',
    name: 'Salida Planta Baja',
    floorId: 'piso-pb',
    floorLabel: 'Planta Baja',
    z: 0,
    x: 70,
    y: 40,
    kind: 'salida',
    points: POINTS_BY_KIND.salida,
    place: 'Área de circulación, antes de la salida a Dalence',
  },
  ...floorStations(
    'piso-1',
    { x: 25, y: 30, place: 'Llegada de ascensores y gradas' },
    { x: 78, y: 70, place: 'Extremo este del pasillo comercial' },
  ),
  ...floorStations(
    'piso-2',
    { x: 25, y: 30, place: 'Llegada de ascensores y gradas' },
    { x: 78, y: 70, place: 'Extremo este del pasillo' },
  ),
  ...floorStations(
    'piso-3',
    { x: 25, y: 30, place: 'Llegada de ascensores a la terraza' },
    { x: 75, y: 25, place: 'Mirador panorámico' },
  ),
  ...floorStations(
    'subsuelo',
    { x: 25, y: 45, place: 'Lobby de ascensores del parqueo' },
    { x: 70, y: 60, place: 'Rampa de salida vehicular' },
  ),
];

/** Códigos antiguos que ya podrían estar impresos. */
const LEGACY_CODES: Record<string, string> = {
  'PASEO-TOTEM-LOBBY': 'PASEO-INGRESO-AMERICA',
  'PASEO-TOTEM-PANDO': 'PASEO-INGRESO-DALENCE',
  'PASEO-TOTEM-TERRAZA': 'PASEO-P3-ENTRADA',
  'PASEO-TOTEM-PARKING': 'PASEO-S1-ENTRADA',
};

/**
 * Acepta el código puro ("PASEO-P1-ENTRADA") o la URL impresa en el QR
 * ("https://.../qr/PASEO-P1-ENTRADA"). Devuelve null si no es una estación.
 */
export function findStation(raw: string | null | undefined): Station | null {
  if (!raw) return null;
  let value = String(raw).trim();
  const fromUrl = value.match(/\/qr\/([A-Za-z0-9-]+)/);
  if (fromUrl) value = fromUrl[1];
  const fromQuery = value.match(/[?&]qr=([A-Za-z0-9-]+)/);
  if (fromQuery) value = fromQuery[1];
  value = value.toUpperCase();
  value = LEGACY_CODES[value] || value;
  return STATIONS.find((s) => s.code === value) || null;
}

/** Hora local de Bolivia (0-23) de una fecha ISO. */
export function laPazHour(iso: string): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/La_Paz', hour: '2-digit', hour12: false }).format(
      new Date(iso),
    ),
  ) % 24;
}

export type TimeBucket = 'manana' | 'mediodia' | 'tarde' | 'noche';

export function bucketFor(hour: number): TimeBucket {
  if (hour < 12) return 'manana';
  if (hour < 15) return 'mediodia';
  if (hour < 19) return 'tarde';
  return 'noche';
}

export const PENDING_QR_KEY = 'paseo_pending_qr';
