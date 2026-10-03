import 'server-only';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  ApiError,
  body,
  checked,
  db,
  failure,
  number,
  ownsStore,
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
import { sendPaseoWelcomeEmail, sendPaseoOrderCustomerEmail, sendPaseoOrderMerchantEmail, sendPaseoOrderStatusEmail } from './email';

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
const ownResources = new Set(['productos', 'promociones']);
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
  if (req.method === 'GET')
    return NextResponse.json({ user: await session(req.cookies.get('paseo_token')?.value) });
  const data = await body(req);
  if (data.action === 'logout') {
    const response = NextResponse.json({ success: true });
    response.cookies.set('paseo_token', '', { path: '/', maxAge: 0 });
    return response;
  }
  rateLimit('auth:' + (req.headers.get('x-forwarded-for') || 'local'), 15);
  const email = string(data.email, 'Correo', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, 'Introduce un correo válido.');
  const password = passwordValue(data.password);
  if (data.action === 'google') {
    rateLimit('auth-google:' + (req.headers.get('x-forwarded-for') || 'local'), 30);
    const email = string(data.email, 'Correo', 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(400, 'Introduce un correo válido.');
    const name = string(data.name || email.split('@')[0], 'Nombre', 2, 80);
    const avatar_url = typeof data.avatar_url === 'string' ? data.avatar_url : null;

    let record = checked(
      await db()
        .from('paseo_users')
        .select(USER_FIELDS)
        .eq('email', email)
        .maybeSingle(),
    );

    let isNew = false;
    if (!record) {
      isNew = true;
      const fakePass = await bcrypt.hash('GoogleOAuthUser2026', 12);
      const created = checked(
        await db()
          .from('paseo_users')
          .insert({
            email,
            name,
            password: fakePass,
            role: 'cliente',
            points: 50,
            lifetime_points: 50,
            avatar_url,
            is_active: true,
          })
          .select(USER_FIELDS)
          .single(),
      );
      const newRecord = created as User;
      record = newRecord;

      // Movimiento de bienvenida
      await db().from('paseo_point_movements').insert({
        user_id: newRecord.id,
        amount: 50,
        reason: 'Bono de bienvenida Club Paseo Aranjuez',
      });

      // Correo SMTP de bienvenida en segundo plano
      void sendPaseoWelcomeEmail(newRecord.email, newRecord.name, 50);
    } else if (!record.is_active) {
      throw new ApiError(403, 'Tu cuenta se encuentra inactiva. Contacta a administración.');
    }

    return signedResponse(record as User);
  }

  if (data.action === 'register') {
    if (data.role && data.role !== 'cliente')
      throw new ApiError(403, 'El registro público es solo para clientes.');
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
  const user = await requireUser(req, ['comercio', 'admin']);
  const data = await body(req);
  rateLimit(`scanner:${user.id}`, 30);
  const code = codeValue(data.code, String(data.type));
  const client = db();
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
    await ownsStore(user, order.store_id);
    return NextResponse.json({ order: visibleOrder(order, user) });
  }
  throw new ApiError(400, 'Tipo de código inválido.');
}
async function purchase(req: NextRequest) {
  const user = await requireUser(req, ['comercio', 'admin']);
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
    if (!['cliente', 'comercio', 'admin'].includes(String(data.role)))
      throw new ApiError(400, 'Rol inválido.');
    result.role = data.role;
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
    await ownsStore(user, uuid(fields.store_id));
    if (req.method === 'PATCH') {
      const previous = checked(
        await client.from(table).select('store_id').eq('id', uuid(data.id)).maybeSingle(),
      );
      if (!previous) throw new ApiError(404, 'Registro no encontrado.');
      await ownsStore(user, previous.store_id);
    }
  }
  if (resource === 'usuarios') {
    if (req.method === 'POST') {
      const email = string(data.email, 'Correo', 3, 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Correo inválido.');
      fields.email = email;
      fields.password = await bcrypt.hash(passwordValue(data.password), 12);
    } else if (data.id === user.id && (fields.role !== 'admin' || fields.is_active !== true))
      throw new ApiError(
        400,
        'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador.',
      );
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
  const settings = checked(await client.from('paseo_settings').select('*').eq('id', 1).single());
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
  const values = {
    points_ratio: number(data.points_ratio, 'Equivalencia', 0.01, 100),
    welcome_points: number(data.welcome_points, 'Bienvenida', 0, 10000, true),
    paseo_name: string(data.paseo_name, 'Nombre', 2, 100),
    location: string(data.location, 'Ubicación', 2, 250),
  };
  checked(await db().from('paseo_settings').update(values).eq('id', 1));
  checked(
    await db().from('paseo_audit').insert({
      actor_id: user.id,
      action: 'configuracion_editada',
      entity: 'configuracion',
      detail: values,
    }),
  );
  return NextResponse.json({ success: true });
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
    else if (resource === 'scanner' && req.method === 'POST') response = await scanner(req);
    else if (resource === 'compras' && req.method === 'POST') response = await purchase(req);
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
