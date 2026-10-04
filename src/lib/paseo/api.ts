import { employees, operationalStores } from './team';
import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  body,
  checked,
  db,
  failure,
  number,
  ownsStore,
  operatesStore,
  passwordValue,
  rateLimit,
  requireUser,
  session,
  signedResponse,
  string,
  USER_FIELDS,
  uuid,
} from './server';
import type { Catalog, User } from './model';
import { askJarvis } from './jarvis-server';
import {
  STATIONS,
  FLOORS,
  MIN_MINUTES_ON_FLOOR,
  DEFAULT_QR_CONFIG,
  getStationPoints,
  type QrPointsConfig,
  findStation,
  laPazHour,
  bucketFor,
  type TimeBucket,
} from './stations';
import {
  sendPaseoWelcomeEmail,
  sendPaseoOrderCustomerEmail,
  sendPaseoOrderMerchantEmail,
  sendPaseoOrderStatusEmail,
  sendPaseoPasswordRecoveryEmail,
  sendPaseoMerchantPromotedEmail,
} from './email';

const ORDER_FIELDS =
  '*,store:paseo_stores(id,name,floor,sector,local_num,schedule,reference),user:paseo_users(id,name,email),items:paseo_order_items(*)';
const TABLES: Record<string, string> = {
  tiendas: 'paseo_stores',
  productos: 'paseo_products',
  promociones: 'paseo_promotions',
  eventos: 'paseo_events',
  recompensas: 'paseo_rewards',
  categorias: 'paseo_categories',
  usuarios: 'paseo_users',
};
const ownResources = new Set(['productos', 'promociones', 'tiendas']);
function visibleOrder<T extends { pickup_code?: string; qr_token?: string }>(order: T, user: User) {
  if (user.role === 'cliente') return order;
  const { pickup_code: _pickup, qr_token: _token, ...safe } = order;
  void _pickup;
  void _token;
  return safe;
}

export async function catalog(): Promise<Catalog> {
  const client = db();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
  const [stores, products, promotions, events, categories, settings] = await Promise.all([
    client.from('paseo_stores').select('*').eq('is_active', true).order('name'),
    client
      .from('paseo_products')
      .select('*,store:paseo_stores!inner(*)')
      .eq('is_active', true)
      .eq('store.is_active', true)
      .order('name'),
    client
      .from('paseo_promotions')
      .select('*,store:paseo_stores(*)')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('end_date'),
    client
      .from('paseo_events')
      .select('*')
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString())
      .order('starts_at'),
    client.from('paseo_categories').select('*').order('name'),
    client.from('paseo_settings').select('*').eq('id', 1).single(),
  ]);
  return {
    stores: checked(stores),
    products: checked(products),
    promotions: (checked(promotions) || []).filter((p) => !p.store || p.store.is_active),
    events: checked(events),
    categories: checked(categories),
    settings: { ...checked(settings), demo_mode: process.env.DEMO_MODE === 'true' },
  } as Catalog;
}
async function auth(req: NextRequest) {
  // 0. Consulta de sesión activa actual (GET /api/paseo/auth)
  if (req.method === 'GET') {
    const token = req.cookies.get('paseo_token')?.value;
    const currentUser = await session(token);
    return NextResponse.json({ user: currentUser });
  }

  const data = await body(req);

  // 0.1 Cierre de sesión (POST { action: 'logout' })
  if (data.action === 'logout') {
    const response = NextResponse.json({ ok: true, message: 'Sesión cerrada correctamente.' });
    response.cookies.set('paseo_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  // 1. Recuperación de contraseña olvidada
  if (data.action === 'forgot_password') {
    rateLimit('forgot:' + (req.headers.get('x-forwarded-for') || 'local'), 10);
    const email = string(data.email, 'Correo', 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Introduce un correo electrónico válido.');
    }

    const record = checked(
      await db()
        .from('paseo_users')
        .select('id,email,name,is_active')
        .eq('email', email)
        .maybeSingle(),
    );

    if (record && record.is_active) {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32)
        throw new ApiError(503, 'Configuración de recuperación no disponible.');
      const token = await new SignJWT({ purpose: 'password-reset' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(record.id)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(new TextEncoder().encode(secret));
      checked(
        await db()
          .from('paseo_password_resets')
          .insert({
            token_hash: createHash('sha256').update(token).digest('hex'),
            user_id: record.id,
            expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
          }),
      );
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      await sendPaseoPasswordRecoveryEmail({
        to: record.email,
        name: record.name,
        resetUrl: appUrl + '/auth/recuperar#token=' + encodeURIComponent(token),
      });
    }
    return NextResponse.json({
      ok: true,
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    });
  }
  if (data.action === 'reset_password') {
    rateLimit('reset:' + (req.headers.get('x-forwarded-for') || 'local'), 10);
    const token = string(data.token, 'Enlace', 20, 2000);
    const hash = await bcrypt.hash(passwordValue(data.password), 12);
    checked(
      await db().rpc('paseo_reset_password', {
        p_hash: createHash('sha256').update(token).digest('hex'),
        p_password: hash,
      }),
    );
    return NextResponse.json({ ok: true });
  }

  // 2. Cambio de contraseña desde el perfil
  if (data.action === 'change_password') {
    const user = await requireUser(req);
    const currentPass = passwordValue(data.currentPassword);
    const newPass = passwordValue(data.newPassword);
    if (newPass.length < 8) {
      throw new ApiError(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    }

    const record = checked(
      await db().from('paseo_users').select('password').eq('id', user.id).single(),
    );
    const valid = await bcrypt.compare(currentPass, record?.password || '');
    if (!valid) {
      throw new ApiError(401, 'La contraseña actual no es correcta.');
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);
    checked(await db().from('paseo_users').update({ password: hashedPassword }).eq('id', user.id));
    return NextResponse.json({
      ok: true,
      message: 'Tu contraseña ha sido actualizada con éxito.',
    });
  }

  // 3. Edición de datos del perfil
  if (data.action === 'update_profile') {
    const user = await requireUser(req);
    const name = string(data.name, 'Nombre', 2, 80);
    const phone = data.phone ? string(data.phone, 'Celular', 5, 25) : null;
    const birthday = data.birthday ? string(data.birthday, 'Fecha de nacimiento', 10, 10) : null;

    checked(await db().from('paseo_users').update({ name, phone, birthday }).eq('id', user.id));

    const updated = checked(
      await db().from('paseo_users').select(USER_FIELDS).eq('id', user.id).single(),
    ) as User;
    return signedResponse(updated);
  }

  // 4. Inicio de sesión con Google OAuth
  if (data.action === 'google' || (data.provider === 'google' && data.accessToken)) {
    rateLimit('auth-google:' + (req.headers.get('x-forwarded-for') || 'local'), 20);
    const token = string(data.accessToken, 'Token de Google', 20, 4000);
    const { data: verified, error: verifyError } = await db().auth.getUser(token);
    const googleUser = verified?.user;
    if (verifyError || !googleUser?.email) {
      throw new ApiError(401, 'No pudimos verificar tu cuenta de Google. Intenta nuevamente.');
    }

    const email = googleUser.email.toLowerCase();
    const meta = (googleUser.user_metadata || {}) as Record<string, unknown>;
    const rawName = String(meta.full_name || meta.name || email.split('@')[0]).trim();
    const name = rawName.length >= 2 ? rawName.slice(0, 80) : 'Cliente Paseo';

    const existing = checked(
      await db().from('paseo_users').select(USER_FIELDS).eq('email', email).maybeSingle(),
    ) as User | null;

    if (existing) {
      if (!existing.is_active) {
        throw new ApiError(403, 'Tu cuenta está inactiva. Contacta a administración.');
      }
      return signedResponse(existing);
    }

    const randomSecret = randomUUID() + randomUUID();
    const id = checked(
      await db().rpc('paseo_register', {
        p_email: email,
        p_password: await bcrypt.hash(randomSecret, 12),
        p_name: name,
        p_phone: null,
        p_birthday: null,
      }),
    );
    const created = checked(
      await db().from('paseo_users').select(USER_FIELDS).eq('id', id).single(),
    ) as User;
    void sendPaseoWelcomeEmail(created.email, created.name, created.points);
    return signedResponse(created);
  }

  // 5. Registro o Login convencional con email y password
  rateLimit('auth:' + (req.headers.get('x-forwarded-for') || 'local'), 15);
  const email = string(data.email, 'Correo', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, 'Introduce un correo válido.');
  const password = passwordValue(data.password);

  if (data.action === 'register') {
    const name = string(data.name, 'Nombre', 2, 80);
    const phone = data.phone ? string(data.phone, 'Celular', 5, 25) : null;
    const birthday = data.birthday ? string(data.birthday, 'Fecha de nacimiento', 10, 10) : null;
    if (
      birthday &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) ||
        !Number.isFinite(Date.parse(birthday)) ||
        new Date(birthday) > new Date())
    )
      throw new ApiError(400, 'Fecha de nacimiento inválida.');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new ApiError(503, 'Falta configurar el secreto de sesión.');

    const id = checked(
      await db().rpc('paseo_register', {
        p_email: email,
        p_password: await bcrypt.hash(password, 12),
        p_name: name,
        p_phone: phone,
        p_birthday: birthday,
      }),
    );

    const user = checked(
      await db().from('paseo_users').select(USER_FIELDS).eq('id', id).single(),
    ) as User;
    void sendPaseoWelcomeEmail(user.email, user.name, user.points);
    return signedResponse(user);
  }

  if (data.action !== 'login') throw new ApiError(400, 'Acción de autenticación no disponible.');
  const record = checked(
    await db()
      .from('paseo_users')
      .select(`${USER_FIELDS},password`)
      .eq('email', email)
      .maybeSingle(),
  );
  const valid = await bcrypt.compare(
    password,
    record?.password || '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxLgSQqKo5nUMjGxMsYmEiRVY0e',
  );
  if (!record?.is_active || !valid) throw new ApiError(401, 'Correo o contraseña incorrectos.');
  const { password: _password, ...user } = record;
  void _password;
  return signedResponse(user as User);
}
async function orders(req: NextRequest) {
  const user = await requireUser(req);
  const client = db();
  if (req.method === 'GET') {
    let query = client
      .from('paseo_orders')
      .select(ORDER_FIELDS)
      .order('created_at', { ascending: false })
      .limit(200);
    if (user.role === 'cliente') query = query.eq('user_id', user.id);
    if (user.role === 'empleado') {
      const storeId = user.avatar_url?.startsWith('store:') ? user.avatar_url.slice(6) : '';
      if (!storeId) return NextResponse.json({ orders: [] });
      await operatesStore(user, storeId);
      query = query.eq('store_id', storeId);
    }
    if (user.role === 'comercio') {
      const stores =
        checked(await client.from('paseo_stores').select('id').eq('owner_id', user.id)) || [];
      if (!stores.length) return NextResponse.json({ orders: [] });
      query = query.in(
        'store_id',
        stores.map((s) => s.id),
      );
    }
    return NextResponse.json({
      orders: (checked(await query) || []).map((order) => visibleOrder(order, user)),
    });
  }
  const data = await body(req);
  let id: string;
  if (req.method === 'POST') {
    if (user.role !== 'cliente') throw new ApiError(403, 'Compra con una cuenta de cliente.');
    const store = uuid(data.storeId);
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50)
      throw new ApiError(400, 'Carrito inválido.');
    const items = data.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new ApiError(400, 'Producto inválido.');
      const row = item as Record<string, unknown>;
      return {
        productId: uuid(row.productId),
        quantity: number(row.quantity, 'Cantidad', 1, 100, true),
      };
    });
    if (new Set(items.map((i) => i.productId)).size !== items.length)
      throw new ApiError(400, 'El carrito contiene productos duplicados.');
    id = checked(
      await client.rpc('paseo_create_order', {
        p_actor: user.id,
        p_store: store,
        p_items: items,
        p_key: uuid(data.requestKey),
      }),
    );
  } else if (req.method === 'PATCH') {
    id = checked(
      await client.rpc('paseo_transition', {
        p_actor: user.id,
        p_order: uuid(data.orderId),
        p_status: string(data.status, 'Estado', 3, 20),
        p_code: data.code ? codeValue(data.code, 'order') : null,
      }),
    );
  } else throw new ApiError(405, 'Método no permitido.');
  return NextResponse.json(
    {
      order: visibleOrder(
        checked(await client.from('paseo_orders').select(ORDER_FIELDS).eq('id', id).single()),
        user,
      ),
    },
    { status: req.method === 'POST' ? 201 : 200 },
  );
}
async function points(req: NextRequest) {
  const user = await requireUser(req);
  const client = db();
  if (req.method === 'GET') {
    const [movements, rewards, redemptions, settings] = await Promise.all([
      client
        .from('paseo_point_movements')
        .select('*,store:paseo_stores(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
      client
        .from('paseo_rewards')
        .select('*,store:paseo_stores(*)')
        .eq('is_active', true)
        .order('points_cost'),
      client
        .from('paseo_redemptions')
        .select('*,reward:paseo_rewards(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      client.from('paseo_settings').select('points_ratio').eq('id', 1).single(),
    ]);
    return NextResponse.json({
      user,
      movements: checked(movements),
      rewards: checked(rewards),
      redemptions: (checked(redemptions) || []).map((c) => ({
        ...c,
        status:
          c.status === 'activo' && c.expires_at && Date.parse(c.expires_at) <= Date.now()
            ? 'expirado'
            : c.status,
      })),
      settings: checked(settings),
    });
  }
  if (req.method !== 'POST') throw new ApiError(405, 'Método no permitido.');
  const data = await body(req);
  const id = checked(
    await client.rpc('paseo_redeem', {
      p_actor: user.id,
      p_reward: uuid(data.rewardId),
      p_key: uuid(data.requestKey),
    }),
  );
  return NextResponse.json(
    {
      redemption: checked(
        await client
          .from('paseo_redemptions')
          .select('*,reward:paseo_rewards(*)')
          .eq('id', id)
          .single(),
      ),
    },
    { status: 201 },
  );
}
export function codeValue(value: unknown, expected: string) {
  const raw = string(value, 'Código', 3, 500);
  if (!raw.startsWith('{')) return raw;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(400, 'El QR no contiene un código válido.');
  }
  if (!parsed || parsed.type !== expected)
    throw new ApiError(400, 'Este QR corresponde a otra operación.');
  return string(parsed.token, 'Token QR', 8, 100);
}
async function scanner(req: NextRequest) {
  const user = await requireUser(req, ['comercio', 'empleado', 'admin']);
  const data = await body(req);
  rateLimit(`scanner:${user.id}`, 30);
  const code = codeValue(data.code, String(data.type));
  const client = db();
  if (user.role === 'empleado') await operatesStore(user, uuid(user.avatar_url?.slice(6)));
  if (data.type === 'user') {
    if (user.role === 'comercio') {
      const stores =
        checked(
          await client
            .from('paseo_stores')
            .select('id')
            .eq('owner_id', user.id)
            .eq('is_active', true)
            .limit(1),
        ) || [];
      if (!stores.length) throw new ApiError(403, 'No tienes un comercio activo.');
    }
    const customer = checked(
      await client
        .from('paseo_users')
        .select('id,name,points,lifetime_points')
        .eq('qr_token', code)
        .eq('is_active', true)
        .eq('role', 'cliente')
        .maybeSingle(),
    );
    if (!customer) throw new ApiError(404, 'Cliente no encontrado.');
    return NextResponse.json({ customer });
  }
  if (data.type === 'coupon') {
    const id = checked(
      await client.rpc('paseo_consume_coupon', { p_actor: user.id, p_code: code }),
    );
    return NextResponse.json({
      success: true,
      id,
      message: 'Cupón validado. Entrega el beneficio al cliente.',
    });
  }
  if (data.type === 'order') {
    // No interpolar códigos de usuario en expresiones PostgREST.
    const byToken = /^[0-9a-f-]{36}$/i.test(code);
    const order = checked(
      await client
        .from('paseo_orders')
        .select(ORDER_FIELDS)
        .eq(byToken ? 'qr_token' : 'pickup_code', byToken ? code : code.toUpperCase())
        .maybeSingle(),
    );
    if (!order) throw new ApiError(404, 'Pedido no encontrado.');
    await operatesStore(user, order.store_id);
    return NextResponse.json({ order: visibleOrder(order, user) });
  }
  throw new ApiError(400, 'Tipo de código inválido.');
}

function parseQrPoints(locationStr: string = ''): QrPointsConfig {
  if (!locationStr) return DEFAULT_QR_CONFIG;
  const parts = locationStr.split('|| QR_POINTS:');
  if (parts.length > 1) {
    try {
      const q = JSON.parse(parts[1].trim());
      return {
        welcome:
          typeof q.welcome === 'number' && q.welcome >= 0
            ? Number(q.welcome)
            : DEFAULT_QR_CONFIG.welcome,
        entry:
          typeof q.entry === 'number' && q.entry >= 0 ? Number(q.entry) : DEFAULT_QR_CONFIG.entry,
        exit: typeof q.exit === 'number' && q.exit >= 0 ? Number(q.exit) : DEFAULT_QR_CONFIG.exit,
        minMinutes:
          typeof q.minMinutes === 'number' && q.minMinutes >= 0
            ? Number(q.minMinutes)
            : DEFAULT_QR_CONFIG.minMinutes,
      };
    } catch {
      return DEFAULT_QR_CONFIG;
    }
  }
  return DEFAULT_QR_CONFIG;
}

function parseGeofence(locationStr: string = '') {
  const DEFAULT_GEOFENCE = {
    radius: 200,
    lat: -17.3739,
    lng: -66.1558,
    strict: true,
    address: 'Av. América Este & Pantaleón Dalence, Cochabamba',
  };

  if (!locationStr) return DEFAULT_GEOFENCE;

  const address =
    locationStr.split('|| GEOFENCE:')[0].split('|| QR_POINTS:')[0].trim() ||
    DEFAULT_GEOFENCE.address;

  if (locationStr.includes('|| GEOFENCE:')) {
    try {
      const geoRaw = locationStr.split('|| GEOFENCE:')[1].split('|| QR_POINTS:')[0].trim();
      const geo = JSON.parse(geoRaw);
      return {
        radius: Number(geo.radius) || 200,
        lat: Number(geo.lat) || -17.3739,
        lng: Number(geo.lng) || -66.1558,
        strict: Boolean(geo.strict),
        address,
      };
    } catch {
      return { ...DEFAULT_GEOFENCE, address };
    }
  }

  return { ...DEFAULT_GEOFENCE, address };
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

async function checkin(req: NextRequest) {
  const user = await requireUser(req, ['cliente']);
  const client = db();
  const data = await body(req);
  const station = findStation(typeof data.code === 'string' ? data.code : '');
  if (!station) throw new ApiError(404, 'Este código QR no pertenece al Paseo Aranjuez.');

  const userLat = data.userLat === undefined ? null : number(data.userLat, 'Latitud', -90, 90);
  const userLng = data.userLng === undefined ? null : number(data.userLng, 'Longitud', -180, 180);

  rateLimit(`checkin:${user.id}`, 20);

  // Geocerca del edificio (configurable por el admin)
  const rawSettings = checked(
    await client.from('paseo_settings').select('location').eq('id', 1).maybeSingle(),
  );
  const geo = parseGeofence(rawSettings?.location);
  const qrConfig = parseQrPoints(rawSettings?.location);
  let distanceToPaseo: number | null = null;
  let inGeofence: boolean | null = null;
  if (geo.strict && (userLat === null || userLng === null))
    throw new ApiError(400, 'Activa tu ubicación para registrar esta visita.');
  if (userLat !== null && userLng !== null) {
    distanceToPaseo = getDistanceMeters(userLat, userLng, geo.lat, geo.lng);
    inGeofence = distanceToPaseo <= geo.radius;
    if (geo.strict && !inGeofence) {
      throw new ApiError(400, 'Este QR solo se puede registrar dentro del Paseo Aranjuez.');
    }
  }

  // Escaneos reales de hoy (hora Bolivia) de este usuario
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
  const dayStart = new Date(`${today}T00:00:00-04:00`).toISOString();
  const todayScans = (
    (checked(
      await client
        .from('paseo_audit')
        .select('detail,created_at')
        .eq('actor_id', user.id)
        .eq('action', 'telemetry_scan')
        .gte('created_at', dayStart)
        .order('created_at', { ascending: false })
        .limit(200),
    ) || []) as Array<{ detail: Record<string, unknown>; created_at: string }>
  ).filter((s) => !s.detail?.demo);

  const scanned = (code: string) => todayScans.filter((s) => s.detail?.station_code === code);
  const rewarded = (code: string) =>
    scanned(code).some((s) => Number(s.detail?.points_granted) > 0);

  let points = getStationPoints(station, qrConfig);
  let message = '';

  if (station.kind === 'bienvenida') {
    const welcomed = STATIONS.filter((s) => s.kind === 'bienvenida').some((s) => rewarded(s.code));
    if (welcomed) {
      points = 0;
      message =
        '¡Hola de nuevo! Tu bienvenida de hoy ya fue sumada. Recorre los pisos para ganar más puntos.';
    }
  } else if (rewarded(station.code)) {
    points = 0;
    message = `Ya sumaste los puntos de ${station.name} hoy. ¡Vuelve mañana!`;
  } else if (station.kind === 'salida') {
    // La salida de un piso solo suma si antes se registró la entrada de ese piso.
    const entryCodes = STATIONS.filter(
      (s) => s.floorId === station.floorId && s.kind !== 'salida',
    ).map((s) => s.code);
    const entry = todayScans.find((s) => entryCodes.includes(String(s.detail?.station_code)));
    if (!entry) {
      points = 0;
      message = `Escanea primero el QR de entrada de ${station.floorLabel} para sumar al salir.`;
    } else if (Date.now() - new Date(entry.created_at).getTime() < qrConfig.minMinutes * 60000) {
      points = 0;
      message = `Recorre un poco ${station.floorLabel} antes de registrar tu salida (mínimo ${qrConfig.minMinutes} min).`;
    }
  }

  points = checked(
    await client.rpc('paseo_checkin', {
      p_actor: user.id,
      p_points: points,
      p_min_minutes: qrConfig.minMinutes,
      p_daily_limit: 100,
      p_detail: {
        station_code: station.code,
        totem_code: station.code,
        totem_name: station.name,
        kind: station.kind,
        floor_id: station.floorId,
        floor: station.floorLabel,
        x: station.x,
        y: station.y,
        z: station.z,
        type: 'totem_scan',
        user_name: user.name,
        lat: userLat,
        lng: userLng,
        distance_meters: distanceToPaseo,
        in_geofence: inGeofence,
      },
    }),
  );
  message =
    points > 0
      ? station.name + ': sumaste ' + points + ' puntos.'
      : message ||
        'Visita registrada. Ya alcanzaste la recompensa de esta visita o el límite diario.';

  return NextResponse.json({
    ok: true,
    pointsAwarded: points,
    alreadyCheckedIn: points === 0,
    stationName: station.name,
    message,
  });
}

// ---------------------------------------------------------------------------
// Mapa de calor (solo administración)
// ---------------------------------------------------------------------------
type ScanRow = { actor_id: string | null; detail: Record<string, unknown>; created_at: string };

async function heatmap(req: NextRequest) {
  const admin = await requireUser(req, ['admin']);
  const client = db();

  if (req.method === 'GET') {
    const daysParam = Number(new URL(req.url).searchParams.get('dias') || 7);
    const days = Number.isFinite(daysParam) ? Math.max(1, Math.min(90, Math.round(daysParam))) : 7;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = (checked(
      await client
        .from('paseo_audit')
        .select('actor_id,detail,created_at')
        .eq('action', 'telemetry_scan')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10000),
    ) || []) as ScanRow[];

    const empty = () => ({ manana: 0, mediodia: 0, tarde: 0, noche: 0 });
    const stats = new Map<
      string,
      {
        total: number;
        real: number;
        demo: number;
        buckets: Record<TimeBucket, number>;
        visitors: Set<string>;
      }
    >();
    for (const s of STATIONS)
      stats.set(s.code, { total: 0, real: 0, demo: 0, buckets: empty(), visitors: new Set() });

    // Recorridos: entrada -> salida del mismo piso, mismo usuario, mismo día
    const journeys = new Map<string, { entered: boolean; exited: boolean }>();
    let real = 0;
    let demo = 0;
    for (const row of rows) {
      const station = findStation(String(row.detail?.station_code || row.detail?.totem_code || ''));
      if (!station) continue;
      const st = stats.get(station.code)!;
      const isDemo = Boolean(row.detail?.demo);
      st.total += 1;
      if (isDemo) {
        st.demo += 1;
        demo += 1;
      } else {
        st.real += 1;
        real += 1;
      }
      st.buckets[bucketFor(laPazHour(row.created_at))] += 1;
      if (row.actor_id) st.visitors.add(row.actor_id);
      const day = row.created_at.slice(0, 10);
      const key = `${row.actor_id}|${station.floorId}|${day}`;
      const j = journeys.get(key) || { entered: false, exited: false };
      if (station.kind === 'salida') j.exited = true;
      else j.entered = true;
      journeys.set(key, j);
    }

    const floors = FLOORS.map((f) => {
      const floorJourneys = [...journeys.entries()].filter(([k]) => k.split('|')[1] === f.id);
      const started = floorJourneys.filter(([, j]) => j.entered).length;
      const completed = floorJourneys.filter(([, j]) => j.entered && j.exited).length;
      const visitors = new Set(
        STATIONS.filter((s) => s.floorId === f.id).flatMap((s) => [...stats.get(s.code)!.visitors]),
      );
      return { id: f.id, label: f.label, started, completed, visitors: visitors.size };
    });

    return NextResponse.json({
      days,
      totals: { scans: real + demo, real, demo },
      floors,
      stations: STATIONS.map((s) => {
        const st = stats.get(s.code)!;
        return {
          ...s,
          total: st.total,
          real: st.real,
          demo: st.demo,
          buckets: st.buckets,
          visitors: st.visitors.size,
        };
      }),
      recent: rows.slice(0, 25).map((r) => ({
        created_at: r.created_at,
        station_code: r.detail?.station_code || r.detail?.totem_code,
        user_name: r.detail?.user_name,
        points_granted: r.detail?.points_granted,
        demo: Boolean(r.detail?.demo),
      })),
    });
  }

  if (req.method === 'POST') {
    const data = await body(req);
    if (data.accion === 'limpiar') {
      checked(
        await client
          .from('paseo_audit')
          .delete()
          .eq('action', 'telemetry_scan')
          .eq('detail->>demo', 'true'),
      );
      return NextResponse.json({ ok: true, message: 'Datos de prueba eliminados.' });
    }
    if (data.accion === 'demo') {
      const existing = await client
        .from('paseo_audit')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'telemetry_scan')
        .eq('detail->>demo', 'true');
      if ((existing.count || 0) > 6000)
        throw new ApiError(
          400,
          'Ya hay suficientes datos de prueba. Límpialos antes de generar más.',
        );

      const people = (checked(
        await client
          .from('paseo_users')
          .select('id,name')
          .eq('role', 'cliente')
          .like('email', '%@paseo.example'),
      ) || []) as Array<{ id: string; name: string }>;
      if (!people.length)
        throw new ApiError(400, 'No hay cuentas cliente de prueba (@paseo.example).');

      const rows = buildDemoJourneys(people, 7);
      for (let i = 0; i < rows.length; i += 500) {
        checked(await client.from('paseo_audit').insert(rows.slice(i, i + 500)));
      }
      checked(
        await client.from('paseo_audit').insert({
          actor_id: admin.id,
          action: 'mapa_calor_demo',
          entity: 'heat_telemetry',
          detail: { generados: rows.length },
        }),
      );
      return NextResponse.json({
        ok: true,
        created: rows.length,
        message: `Se generaron ${rows.length} escaneos de prueba.`,
      });
    }
  }
  throw new ApiError(400, 'Acción no disponible.');
}

/** Genera recorridos verosímiles: horas pico, puerta de ingreso, pisos según la hora. */
function buildDemoJourneys(people: Array<{ id: string; name: string }>, days: number) {
  const pick = <T>(items: Array<[T, number]>): T => {
    const total = items.reduce((n, [, w]) => n + w, 0);
    let r = Math.random() * total;
    for (const [v, w] of items) {
      r -= w;
      if (r <= 0) return v;
    }
    return items[items.length - 1][0];
  };
  const byCode = (code: string) => STATIONS.find((s) => s.code === code)!;
  const rows: Array<Record<string, unknown>> = [];
  const scan = (personIdx: number, code: string, at: Date) => {
    const s = byCode(code);
    const p = people[personIdx % people.length];
    rows.push({
      actor_id: p.id,
      action: 'telemetry_scan',
      entity: 'heat_telemetry',
      created_at: at.toISOString(),
      detail: {
        demo: true,
        station_code: s.code,
        totem_code: s.code,
        totem_name: s.name,
        kind: s.kind,
        floor_id: s.floorId,
        floor: s.floorLabel,
        x: s.x,
        y: s.y,
        z: s.z,
        points_granted: 0,
        type: 'totem_scan',
        user_name: p.name,
      },
    });
  };

  for (let d = 0; d < days; d++) {
    const weekend = [0, 6].includes(new Date(Date.now() - d * 86400000).getDay());
    const visits = Math.round((weekend ? 70 : 45) * (0.85 + Math.random() * 0.3));
    for (let v = 0; v < visits; v++) {
      const hour = pick<number>([
        [10, 3],
        [11, 4],
        [12, 8],
        [13, 10],
        [14, 6],
        [15, 4],
        [16, 5],
        [17, 7],
        [18, 8],
        [19, 10],
        [20, 9],
        [21, 5],
      ]);
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(
        new Date(Date.now() - d * 86400000),
      );
      let t = new Date(
        `${day}T${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00-04:00`,
      );
      if (t.getTime() > Date.now()) continue;
      const person = Math.floor(Math.random() * 1000);
      const byCar = Math.random() < 0.25;
      const later = (min: number, max: number) => {
        t = new Date(t.getTime() + (min + Math.random() * (max - min)) * 60000);
        return t;
      };

      if (byCar) scan(person, 'PASEO-S1-ENTRADA', t);
      scan(
        person,
        Math.random() < (byCar ? 0.5 : 0.7) ? 'PASEO-INGRESO-AMERICA' : 'PASEO-INGRESO-DALENCE',
        byCar ? later(2, 5) : t,
      );

      const night = hour >= 19;
      const lunch = hour >= 12 && hour < 15;
      const floorChance: Array<[string, number]> = [
        ['P1', night ? 0.35 : 0.6],
        ['P2', night ? 0.2 : 0.4],
        ['P3', night || lunch ? 0.75 : 0.3],
      ];
      for (const [short, chance] of floorChance) {
        if (Math.random() > chance) continue;
        scan(person, `PASEO-${short}-ENTRADA`, later(3, 8));
        if (Math.random() < 0.7)
          scan(
            person,
            `PASEO-${short}-SALIDA`,
            later(short === 'P3' ? 30 : 10, short === 'P3' ? 75 : 35),
          );
      }
      if (Math.random() < 0.6) scan(person, 'PASEO-PB-SALIDA', later(5, 20));
      if (byCar && Math.random() < 0.8) scan(person, 'PASEO-S1-SALIDA', later(2, 6));
    }
  }
  return rows.filter((r) => new Date(String(r.created_at)).getTime() <= Date.now());
}

async function purchase(req: NextRequest) {
  const user = await requireUser(req, ['comercio', 'empleado', 'admin']);
  const data = await body(req);
  const id = checked(
    await db().rpc('paseo_purchase', {
      p_actor: user.id,
      p_store: uuid(data.storeId),
      p_customer: uuid(data.customerId),
      p_amount: number(data.amount, 'Monto', 0.01, 100000),
      p_reference: string(data.reference, 'Referencia de compra', 3, 100),
    }),
  );

  // Telemetría silenciosa interna de ubicación (x, y, z) del local
  try {
    const client = db();
    const storeInfo = checked(
      await client
        .from('paseo_stores')
        .select('id,name,floor,sector,local_num')
        .eq('id', uuid(data.storeId))
        .maybeSingle(),
    );
    if (storeInfo) {
      let z = 1;
      const fl = (storeInfo.floor || '').toLowerCase();
      if (fl.includes('subsuelo')) z = -1;
      else if (fl.includes('baja') || fl.includes('pb') || fl.includes('lobby')) z = 0;
      else if (fl.includes('1')) z = 1;
      else if (fl.includes('2')) z = 2;
      else if (fl.includes('3') || fl.includes('terraza')) z = 3;
      else if (fl.includes('torre') || fl.includes('4')) z = 4;

      const hash = storeInfo.name
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const x = 20 + (hash % 60);
      const y = 20 + ((hash * 7) % 60);

      await client.from('paseo_audit').insert({
        actor_id: user.id,
        action: 'telemetry_scan',
        entity: 'heat_telemetry',
        detail: {
          x,
          y,
          z,
          floor: storeInfo.floor || `Piso ${z}`,
          sector: storeInfo.sector || 'Comercial',
          local_num: storeInfo.local_num,
          store_id: storeInfo.id,
          store_name: storeInfo.name,
          customer_id: data.customerId,
          amount: data.amount,
          type: 'qr_purchase',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch {
    // Silencioso
  }

  return NextResponse.json(
    { purchase: checked(await db().from('paseo_purchases').select('*').eq('id', id).single()) },
    { status: 201 },
  );
}

function validateFields(resource: string, data: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  const text = (key: string, max = 200, required = true) => {
    result[key] = required
      ? string(data[key], key, 1, max)
      : data[key]
        ? string(data[key], key, 0, max)
        : '';
  };
  const flag = (key: string) => {
    if (typeof data[key] !== 'boolean')
      throw new ApiError(400, `${key} debe ser verdadero o falso.`);
    result[key] = data[key];
  };
  const store = () => {
    result.store_id = data.store_id ? uuid(data.store_id) : null;
  };
  if (resource === 'tiendas') {
    text('name', 100);
    text('description', 1000);
    text('category', 50);
    for (const key of ['floor', 'sector', 'local_num', 'reference', 'schedule', 'phone'])
      text(key, 200, false);
    result.owner_id = data.owner_id ? uuid(data.owner_id) : null;
    result.image_url = data.image_url ? string(data.image_url, 'Imagen', 1, 1000) : null;
    if (result.image_url && !/^https:\/\//.test(String(result.image_url)))
      throw new ApiError(400, 'La imagen debe usar HTTPS.');
    flag('is_active');
  } else if (resource === 'productos') {
    text('name', 100);
    text('description', 1500);
    text('category', 50);
    store();
    if (!result.store_id) throw new ApiError(400, 'Selecciona un establecimiento.');
    result.price = number(data.price, 'Precio', 0.01, 100000);
    result.stock = number(data.stock, 'Stock', 0, 100000, true);
    flag('is_active');
    flag('is_featured');
    result.image_url = data.image_url ? string(data.image_url, 'Imagen', 1, 1000) : null;
    if (result.image_url && !/^https:\/\//.test(String(result.image_url)))
      throw new ApiError(400, 'La imagen debe usar HTTPS.');
  } else if (resource === 'recompensas') {
    text('name', 100);
    text('description', 1000);
    store();
    result.points_cost = number(data.points_cost, 'Costo en puntos', 1, 1000000, true);
    result.stock = number(data.stock, 'Stock', -1, 100000, true);
    flag('is_active');
  } else if (resource === 'promociones') {
    text('title', 120);
    text('description', 1500);
    store();
    flag('is_active');
    result.discount = number(data.discount, 'Descuento', 0, 100);
    for (const key of ['start_date', 'end_date']) {
      text(key, 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(String(result[key])) ||
        !Number.isFinite(Date.parse(String(result[key])))
      )
        throw new ApiError(400, 'Fecha inválida.');
    }
    if (String(result.end_date) < String(result.start_date))
      throw new ApiError(400, 'La fecha final debe ser posterior al inicio.');
  } else if (resource === 'eventos') {
    text('title', 120);
    text('description', 2000);
    text('location', 200);
    flag('is_active');
    for (const key of ['starts_at', 'ends_at']) {
      text(key, 40);
      if (!Number.isFinite(Date.parse(String(result[key]))))
        throw new ApiError(400, 'Fecha y hora inválidas.');
    }
    if (Date.parse(String(result.ends_at)) < Date.parse(String(result.starts_at)))
      throw new ApiError(400, 'El evento debe terminar después de comenzar.');
  } else if (resource === 'categorias') {
    text('name', 60);
    result.id = string(data.id, 'Identificador de categoría', 2, 40);
    if (!/^[a-z0-9-]+$/.test(String(result.id)))
      throw new ApiError(400, 'Usa letras minúsculas, números o guiones en la categoría.');
  } else if (resource === 'usuarios') {
    text('name', 80);
    flag('is_active');
    if (!['cliente', 'comercio', 'empleado', 'admin'].includes(String(data.role)))
      throw new ApiError(400, 'Rol inválido.');
    result.role = data.role;
    result.phone = data.phone ? string(data.phone, 'Teléfono', 5, 25) : null;
    if (data.role === 'cliente')
      result.points = number(data.points ?? 0, 'Puntos', 0, 1000000, true);
  } else throw new ApiError(404, 'Recurso no encontrado.');
  return result;
}
async function manage(req: NextRequest, resource: string) {
  const user = await requireUser(req, ['admin', 'comercio']);
  const table = TABLES[resource];
  if (!table) throw new ApiError(404, 'Recurso no encontrado.');
  const client = db();
  const managed = checked(await client.from('paseo_stores').select('*').order('name')) || [];
  const stores = user.role === 'admin' ? managed : managed.filter((s) => s.owner_id === user.id);
  if (req.method === 'GET') {
    if (user.role !== 'admin' && !ownResources.has(resource) && resource !== 'tiendas')
      throw new ApiError(403, 'Solo administración puede consultar este recurso.');
    let query = client.from(table).select(resource === 'usuarios' ? USER_FIELDS : '*');
    if (user.role !== 'admin') {
      if (resource === 'tiendas') return NextResponse.json({ rows: stores, stores });
      if (!stores.length) return NextResponse.json({ rows: [], stores });
      query = query.in(
        'store_id',
        stores.map((s) => s.id),
      );
    }
    return NextResponse.json({
      rows: checked(
        await query.order(
          resource === 'eventos'
            ? 'starts_at'
            : resource === 'usuarios' ||
                resource === 'categorias' ||
                resource === 'tiendas' ||
                resource === 'productos' ||
                resource === 'recompensas'
              ? 'name'
              : 'title',
        ),
      ),
      stores,
    });
  }
  if (user.role !== 'admin' && !ownResources.has(resource))
    throw new ApiError(403, 'Acción reservada a administración.');
  const data = await body(req);
  if (!['POST', 'PATCH'].includes(req.method))
    throw new ApiError(405, 'Usa la opción desactivar para conservar el historial.');
  const fields = validateFields(resource, data);
  if (user.role !== 'admin') {
    if (resource === 'tiendas') {
      if (req.method === 'POST') {
        fields.owner_id = user.id;
      } else if (req.method === 'PATCH') {
        const prevStore = checked(
          await client
            .from('paseo_stores')
            .select('owner_id')
            .eq('id', uuid(data.id))
            .maybeSingle(),
        );
        if (!prevStore) throw new ApiError(404, 'Establecimiento no encontrado.');
        if (prevStore.owner_id !== user.id) {
          throw new ApiError(403, 'Solo puedes modificar tu propio establecimiento.');
        }
        delete fields.owner_id;
      }
    } else {
      await ownsStore(user, uuid(fields.store_id));
      if (req.method === 'PATCH') {
        const previous = checked(
          await client.from(table).select('store_id').eq('id', uuid(data.id)).maybeSingle(),
        );
        if (!previous) throw new ApiError(404, 'Registro no encontrado.');
        await ownsStore(user, previous.store_id);
      }
    }
  }
  if (resource === 'usuarios') {
    const email = string(data.email, 'Correo', 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Correo inválido.');
    fields.email = email;
    if (req.method === 'POST')
      fields.password = await bcrypt.hash(passwordValue(data.password), 12);
    const storeId =
      ['comercio', 'empleado'].includes(String(fields.role)) && data.store_id
        ? uuid(data.store_id)
        : null;
    let newStore = null;
    if (fields.role === 'comercio' && data.store_mode === 'new') {
      newStore = {
        name: string(data.new_store_name, 'Nombre del local', 2, 100),
        category: string(data.new_store_category, 'Categoría', 1, 50),
        floor: string(data.new_store_floor, 'Piso', 1, 50),
        local_num: string(data.new_store_local_num, 'Local', 1, 50),
        phone: data.new_store_phone ? string(data.new_store_phone, 'Teléfono', 5, 25) : '',
      };
    }
    if (['comercio', 'empleado'].includes(String(fields.role)) && !storeId && !newStore)
      throw new ApiError(400, 'Asigna un establecimiento.');
    const id = checked(
      await client.rpc('paseo_manage_user', {
        p_actor: user.id,
        p_id: req.method === 'POST' ? null : uuid(data.id),
        p_fields: fields,
        p_store: newStore ? null : storeId,
        p_new_store: newStore,
      }),
    );
    const row = checked(await client.from('paseo_users').select(USER_FIELDS).eq('id', id).single());
    return NextResponse.json({ row }, { status: req.method === 'POST' ? 201 : 200 });
  }
  if (resource === 'tiendas' && fields.owner_id) {
    const owner = checked(
      await client
        .from('paseo_users')
        .select('role,is_active')
        .eq('id', String(fields.owner_id))
        .maybeSingle(),
    );
    if (!owner?.is_active || !['comercio', 'admin'].includes(owner.role))
      throw new ApiError(400, 'El propietario debe ser un comercio o administrador activo.');
  }
  const selected = resource === 'usuarios' ? USER_FIELDS : '*';
  const result =
    req.method === 'POST'
      ? client.from(table).insert(fields)
      : client
          .from(table)
          .update(fields)
          .eq('id', resource === 'categorias' ? string(data.id, 'Categoría') : uuid(data.id));
  const row = checked(await result.select(selected).single()) as unknown as {
    id: string;
    name?: string;
    title?: string;
  } | null;
  if (!row) throw new ApiError(404, 'Registro no encontrado.');
  checked(
    await client.from('paseo_audit').insert({
      actor_id: user.id,
      action: req.method === 'POST' ? 'registro_creado' : 'registro_editado',
      entity: resource,
      entity_id: resource === 'categorias' ? null : row.id,
      detail: { name: row.name || row.title || row.id },
    }),
  );
  return NextResponse.json({ row }, { status: req.method === 'POST' ? 201 : 200 });
}
async function dashboard(req: NextRequest) {
  const user = await requireUser(req, ['admin', 'comercio']);
  const client = db();
  const stores = checked(await client.from('paseo_stores').select('*')) || [];
  const ids = stores
    .filter((s) => user.role === 'admin' || s.owner_id === user.id)
    .map((s) => s.id);
  let orders = client.from('paseo_orders').select('id,user_id,store_id,total,status,created_at');
  let movements = client
    .from('paseo_point_movements')
    .select('*,store:paseo_stores(name),user:paseo_users(name)')
    .order('created_at', { ascending: false })
    .limit(200);
  let purchases = client.from('paseo_purchases').select('*');
  let products = client.from('paseo_products').select('id,name,stock,store_id');
  if (user.role !== 'admin') {
    const filter = ids.length ? ids : ['00000000-0000-4000-8000-000000000000'];
    orders = orders.in('store_id', filter);
    movements = movements.in('store_id', filter);
    purchases = purchases.in('store_id', filter);
    products = products.in('store_id', filter);
  }
  const results = await Promise.all([orders, movements, purchases, products]);
  const orderRows = checked(results[0]);
  const movementRows = checked(results[1]);
  const purchaseRows = checked(results[2]);
  const productRows = checked(results[3]);
  const audit =
    user.role === 'admin'
      ? checked(
          await client
            .from('paseo_audit')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
        )
      : [];
  const users =
    user.role === 'admin'
      ? checked(
          await client
            .from('paseo_users')
            .select(USER_FIELDS)
            .order('lifetime_points', { ascending: false }),
        )
      : [];
  const questions =
    user.role === 'admin'
      ? checked(await client.from('paseo_questions').select('topic').limit(1000))
      : [];
  const rawSettings = checked(await client.from('paseo_settings').select('*').eq('id', 1).single());
  const geo = parseGeofence(rawSettings?.location);
  const qrPoints = parseQrPoints(rawSettings?.location);
  const settings = {
    ...rawSettings,
    location: geo.address,
    geofence_radius: geo.radius,
    geofence_lat: geo.lat,
    geofence_lng: geo.lng,
    geofence_strict: geo.strict,
    qr_welcome_points: qrPoints.welcome,
    qr_entry_points: qrPoints.entry,
    qr_exit_points: qrPoints.exit,
    qr_min_minutes: qrPoints.minMinutes,
  };
  return NextResponse.json({
    orders: orderRows,
    movements: movementRows,
    purchases: purchaseRows,
    products: productRows,
    stores: stores.filter((s) => ids.includes(s.id)),
    audit,
    users,
    questions,
    settings,
  });
}
async function settings(req: NextRequest) {
  const user = await requireUser(req, ['admin']);
  const data = await body(req);

  const currentRaw = checked(
    await db().from('paseo_settings').select('location').eq('id', 1).maybeSingle(),
  );
  const currentGeo = parseGeofence(currentRaw?.location);
  const currentQr = parseQrPoints(currentRaw?.location);

  const geoObj = {
    radius:
      typeof data.geofence_radius === 'number'
        ? Math.max(50, Math.min(5000, Number(data.geofence_radius)))
        : currentGeo.radius,
    lat: typeof data.geofence_lat === 'number' ? Number(data.geofence_lat) : currentGeo.lat,
    lng: typeof data.geofence_lng === 'number' ? Number(data.geofence_lng) : currentGeo.lng,
    strict: data.geofence_strict !== undefined ? Boolean(data.geofence_strict) : currentGeo.strict,
  };

  const qrPointsObj: QrPointsConfig = {
    welcome:
      typeof data.qr_welcome_points === 'number'
        ? Math.max(0, Math.min(1000, Number(data.qr_welcome_points)))
        : currentQr.welcome,
    entry:
      typeof data.qr_entry_points === 'number'
        ? Math.max(0, Math.min(500, Number(data.qr_entry_points)))
        : currentQr.entry,
    exit:
      typeof data.qr_exit_points === 'number'
        ? Math.max(0, Math.min(500, Number(data.qr_exit_points)))
        : currentQr.exit,
    minMinutes:
      typeof data.qr_min_minutes === 'number'
        ? Math.max(0, Math.min(120, Number(data.qr_min_minutes)))
        : currentQr.minMinutes,
  };

  const address =
    typeof data.location === 'string' && data.location.trim().length >= 2
      ? string(data.location, 'Ubicación', 2, 200)
      : currentGeo.address;
  const locationWithGeo = `${address} || GEOFENCE:${JSON.stringify(geoObj)} || QR_POINTS:${JSON.stringify(qrPointsObj)}`;

  const values: Record<string, unknown> = {
    location: locationWithGeo,
  };
  if (data.points_ratio !== undefined) {
    values.points_ratio = number(data.points_ratio, 'Equivalencia', 0.01, 100);
  }
  if (data.welcome_points !== undefined) {
    values.welcome_points = number(data.welcome_points, 'Bienvenida', 0, 10000, true);
  }
  if (data.paseo_name !== undefined) {
    values.paseo_name = string(data.paseo_name, 'Nombre', 2, 100);
  }

  checked(await db().from('paseo_settings').update(values).eq('id', 1));
  checked(
    await db()
      .from('paseo_audit')
      .insert({
        actor_id: user.id,
        action: 'configuracion_editada',
        entity: 'configuracion',
        detail: { ...values, geofence: geoObj, qr_points: qrPointsObj },
      }),
  );
  return NextResponse.json({ success: true, qr_points: qrPointsObj });
}


async function telemetryPing(req: NextRequest) {
  const user = await requireUser(req, ['cliente']);
  const client = db();
  const data = await body(req);

  const userLat = number(data.lat, 'Latitud', -90, 90);
  const userLng = number(data.lng, 'Longitud', -180, 180);
  const lastStationCode = typeof data.last_station === 'string' ? data.last_station : '';

  rateLimit(`ping:${user.id}`, 60);

  // Leer configuraci?n de Geocerca actual
  const rawSettings = checked(
    await client.from('paseo_settings').select('location').eq('id', 1).maybeSingle(),
  );
  const geo = parseGeofence(rawSettings?.location);

  const distanceToPaseo = getDistanceMeters(userLat, userLng, geo.lat, geo.lng);
  const inGeofence = distanceToPaseo <= geo.radius;

  // Si ya sali? de los 200m, avisarle al cliente que detenga el tracker
  if (!inGeofence) {
    return NextResponse.json({
      ok: true,
      in_geofence: false,
      should_stop: true,
      distance_meters: Math.round(distanceToPaseo),
      message: 'Fuera de per?metro (>= ' + Math.round(distanceToPaseo) + 'm). Monitoreo finalizado.',
    });
  }

  // Si est? dentro de los 200m, registrar presencia en paseo_audit para el mapa de calor
  const station = lastStationCode ? findStation(lastStationCode) : null;
  const x = station ? station.x : 50;
  const y = station ? station.y : 50;
  const z = station ? station.z : 0;
  const floor = station ? station.floorLabel : 'Planta Baja';

  await client.from('paseo_audit').insert({
    actor_id: user.id,
    action: 'telemetry_scan',
    entity: 'heat_telemetry',
    detail: {
      type: 'heartbeat_presence',
      station_code: station?.code || 'PRESENCIA-ACTIVA',
      totem_code: station?.code || 'PRESENCIA-ACTIVA',
      totem_name: station ? 'Presencia en ' + station.name : 'Visitante en Recorrido',
      floor_id: station?.floorId || 'piso-pb',
      floor: floor,
      x,
      y,
      z,
      lat: userLat,
      lng: userLng,
      distance_meters: Math.round(distanceToPaseo),
      in_geofence: true,
      points_granted: 0,
      user_name: user.name,
      timestamp: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    in_geofence: true,
    should_stop: false,
    distance_meters: Math.round(distanceToPaseo),
    floor,
    z,
  });
}

export async function handle(req: NextRequest, path: string[]) {
  try {
    let response: NextResponse;
    const [resource, child] = path;
    if (resource === 'auth' && ['GET', 'POST'].includes(req.method)) response = await auth(req);
    else if (resource === 'catalogo' && req.method === 'GET')
      response = NextResponse.json(await catalog());
    else if (resource === 'pedidos') response = await orders(req);
    else if (resource === 'puntos') response = await points(req);
    else if (resource === 'checkin' && req.method === 'POST') response = await checkin(req);
    else if (resource === 'telemetria' && child === 'ping' && req.method === 'POST') response = await telemetryPing(req);
    else if (resource === 'mapa-calor') response = await heatmap(req);
    else if (resource === 'scanner' && req.method === 'POST') response = await scanner(req);
    else if (resource === 'compras' && req.method === 'POST') response = await purchase(req);
    else if (resource === 'empleados') response = await employees(req);
    else if (resource === 'operacion' && child === 'tiendas' && req.method === 'GET')
      response = await operationalStores(req);
    else if (resource === 'gestion' && child) response = await manage(req, child);
    else if (resource === 'resumen' && req.method === 'GET') response = await dashboard(req);
    else if (resource === 'configuracion' && req.method === 'PATCH') response = await settings(req);
    else if (resource === 'jarvis' && req.method === 'POST') response = await askJarvis(req);
    else throw new ApiError(404, 'Ruta no encontrada.');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return failure(error);
  }
}
