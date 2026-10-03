// Full stack integration against the configured Supabase TEST project and local Next production.
// Each run uses unique test IDs and removes only the records created for that run.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { chromium } from 'playwright-core';
import { demoData, demoId as baseId } from './demo-data.mjs';

try {
  loadEnvFile('.env.local');
} catch {
  /* optional provider configuration */
}
assert.equal(
  process.env.DEMO_MODE,
  'true',
  'Run only against an authorized test project with DEMO_MODE=true.',
);
assert.equal(
  process.env.PASEO_TEST_REMOTE,
  'true',
  'Set PASEO_TEST_REMOTE=true to run tests against the configured Supabase test project.',
);
const prefix = 'e' + randomBytes(4).toString('hex').slice(0, 7);
const demoId = (kind, n) => baseId(kind, n).replace('d0000000', prefix);
const emailFor = (email) => email.replace('@paseo.example', `-${prefix}@paseo.example`);
const fixtures = JSON.parse(
  JSON.stringify(demoData())
    .replaceAll('d0000000', prefix)
    .replaceAll('@paseo.example', `-${prefix}@paseo.example`),
);
const database = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const secret = randomBytes(48).toString('base64url');
const password = randomBytes(18).toString('base64url');
const base = 'http://localhost:3000';
const focusForms = process.env.PASEO_TEST_FOCUS === 'forms';
const children = [];
let browser;
const testUserIds = fixtures.users.map((u) => u.id);
const testStoreIds = fixtures.stores.map((s) => s.id);
const stock = async (id) => {
  const result = await database.from('paseo_products').select('stock').eq('id', id).single();
  assert(!result.error, result.error?.code);
  return result.data.stock;
};
async function cleanup() {
  const orderResult = await database.from('paseo_orders').select('id').in('user_id', testUserIds);
  const orders = orderResult.data?.map((o) => o.id) || [];
  const deletes = [
    ['paseo_audit', 'actor_id', testUserIds],
    ['paseo_point_movements', 'user_id', testUserIds],
    ['paseo_purchases', 'user_id', testUserIds],
    ['paseo_redemptions', 'user_id', testUserIds],
    ['paseo_order_items', 'order_id', orders],
    ['paseo_orders', 'user_id', testUserIds],
    ['paseo_cart_items', 'user_id', testUserIds],
    ['paseo_products', 'store_id', testStoreIds],
    ['paseo_promotions', 'id', fixtures.promotions.map((p) => p.id)],
    ['paseo_events', 'id', fixtures.events.map((e) => e.id)],
    ['paseo_rewards', 'id', fixtures.rewards.map((r) => r.id)],
    ['paseo_stores', 'id', testStoreIds],
    ['paseo_users', 'id', testUserIds],
  ];
  for (const [table, column, ids] of deletes)
    if (ids.length) {
      const result = await database.from(table).delete().in(column, ids);
      if (result.error) console.error('Test cleanup failed:', table, result.error.code);
    }
}
function start(exe, args, env) {
  const child = spawn(exe, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push(child);
  child.stderr.on('data', (buffer) => {
    const msg = buffer.toString();
    if (/Paseo DB|Jarvis provider|Error|error|FATAL/.test(msg)) console.error(msg.trim());
  });
  child.on('error', (error) => console.error(error.message));
  return child;
}
async function ready(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Service not ready: ${url}`);
}
async function call(path, method = 'GET', body, cookie, expected = 200) {
  const response = await fetch(base + '/api/paseo/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return { data, response };
}
async function login(email) {
  const { response, data } = await call('auth', 'POST', {
    action: 'login',
    email: emailFor(email),
    password,
  });
  assert(!('password' in data.user));
  const cookie = response.headers.get('set-cookie');
  assert(cookie?.includes('HttpOnly'));
  return cookie.split(';')[0];
}
try {
  // Refuse to run against or replace another application listening on the test port.
  let occupied = false;
  try {
    await fetch(base);
    occupied = true;
  } catch {}
  assert(
    !occupied,
    'Port 3000 is already in use; stop that local app before running the isolated test.',
  );
  const hash = await bcrypt.hash(password, 12);
  for (const [table, rows] of Object.entries(fixtures)) {
    const result = await database
      .from('paseo_' + table)
      .insert(rows.map((row) => (table === 'users' ? { ...row, password: hash } : row)));
    assert(!result.error, `Seed ${table}: ${result.error?.code}`);
  }
  start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    JWT_SECRET: secret,
    DEMO_MODE: 'true',
    NODE_ENV: 'production',
  });
  await ready(base);
  const client = await login('cliente@paseo.example');
  const merchant = await login('comercio@paseo.example');
  const admin = await login('admin@paseo.example');
  const otherMerchant = await login('comercio2@paseo.example');
  const client2 = await login('cliente2@paseo.example');
  const catalog = (await call('catalogo')).data;
  assert(catalog.products.length >= 12);
  assert(catalog.stores.length >= 6);
  await call('gestion/usuarios', 'GET', undefined, client, 403);
  await call('pedidos', 'GET', undefined, undefined, 401);
  await call(
    'auth',
    'POST',
    { action: 'register', name: 'Attacker', email: 'bad@example.test', password, role: 'admin' },
    undefined,
    403,
  );
  const registered = await call('auth', 'POST', {
    action: 'register',
    name: 'New Customer',
    email: emailFor('new@paseo.example'),
    password,
  });
  testUserIds.push(registered.data.user.id);
  assert.equal(registered.data.user.role, 'cliente');
  assert.equal(registered.data.user.points, 50);
  const csrf = await fetch(base + '/api/paseo/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.invalid' },
    body: JSON.stringify({ action: 'logout' }),
  });
  assert.equal(csrf.status, 403);
  const denied = await fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/paseo_users?select=id',
  );
  assert([401, 403, 404].includes(denied.status));
  console.log(
    'PASS auth: public registration, welcome points, role guards, HttpOnly, CSRF and anonymous DB protection.',
  );
  const payload = {
    storeId: demoId(2, 1),
    items: [{ productId: demoId(3, 1), quantity: 2 }],
    requestKey: randomUUID(),
    total: 0.01,
  };
  for (const quantity of [0, -1, 1.5])
    await call(
      'pedidos',
      'POST',
      { ...payload, requestKey: randomUUID(), items: [{ productId: demoId(3, 1), quantity }] },
      client,
      400,
    );
  await call(
    'pedidos',
    'POST',
    { ...payload, items: [...payload.items, ...payload.items] },
    client,
    400,
  );
  await call(
    'pedidos',
    'POST',
    { ...payload, items: [{ productId: demoId(3, 4), quantity: 1 }] },
    client,
    409,
  );
  const order = (await call('pedidos', 'POST', payload, client, 201)).data.order;
  assert.equal(Number(order.total), 44);
  const same = (await call('pedidos', 'POST', payload, client, 201)).data.order;
  assert.equal(same.id, order.id);
  assert.equal(await stock(demoId(3, 1)), 18);
  const merchantOrders = (await call('pedidos', 'GET', undefined, merchant)).data.orders;
  assert(merchantOrders.some((o) => o.id === order.id));
  assert(merchantOrders.every((o) => !('pickup_code' in o) && !('qr_token' in o)));
  assert(
    !(await call('pedidos', 'GET', undefined, client2)).data.orders.some((o) => o.id === order.id),
  );
  await call('pedidos', 'PATCH', { orderId: order.id, status: 'confirmado' }, otherMerchant, 409);
  await call(
    'pedidos',
    'PATCH',
    { orderId: order.id, status: 'entregado', code: order.pickup_code },
    client,
    409,
  );
  for (const status of ['confirmado', 'preparando', 'listo'])
    await call('pedidos', 'PATCH', { orderId: order.id, status }, merchant);
  await call(
    'pedidos',
    'PATCH',
    { orderId: order.id, status: 'entregado', code: 'BADCODE' },
    merchant,
    409,
  );
  await call('pedidos', 'PATCH', { orderId: order.id, status: 'llego' }, client);
  await call(
    'pedidos',
    'PATCH',
    { orderId: order.id, status: 'entregado', code: order.pickup_code },
    merchant,
  );
  await call(
    'pedidos',
    'PATCH',
    { orderId: order.id, status: 'entregado', code: order.pickup_code },
    merchant,
    409,
  );
  assert.equal((await call('puntos', 'GET', undefined, client)).data.user.points, 44);
  console.log(
    'PASS orders: authoritative prices, quantities, ownership, hidden pickup codes, idempotency, transitions and single points award.',
  );
  const couponPayload = { rewardId: demoId(4, 1), requestKey: randomUUID() };
  await call('puntos', 'POST', couponPayload, client2, 409);
  const coupon = (await call('puntos', 'POST', couponPayload, client, 201)).data.redemption;
  assert.equal(
    (await call('puntos', 'POST', couponPayload, client, 201)).data.redemption.id,
    coupon.id,
  );
  assert.equal((await call('puntos', 'GET', undefined, client)).data.user.points, 4);
  await call('scanner', 'POST', { type: 'coupon', code: coupon.coupon_code }, otherMerchant, 409);
  await call('scanner', 'POST', { type: 'coupon', code: coupon.coupon_code }, merchant);
  await call('scanner', 'POST', { type: 'coupon', code: coupon.coupon_code }, merchant, 409);
  const purchase = {
    storeId: demoId(2, 1),
    customerId: demoId(1, 1),
    amount: 100,
    reference: 'E2E-TICKET-001',
  };
  await call('compras', 'POST', purchase, merchant, 201);
  await call('compras', 'POST', purchase, merchant, 201);
  await call('compras', 'POST', { ...purchase, amount: 200 }, merchant, 409);
  await call('compras', 'POST', purchase, otherMerchant, 409);
  const points = (await call('puntos', 'GET', undefined, client)).data;
  assert.equal(points.user.points, 104);
  assert.equal(points.user.lifetime_points, 144);
  console.log(
    'PASS loyalty: insufficient points, idempotent redemption and purchase, one-use coupon, store authorization and lifetime level balance.',
  );
  await call('gestion/productos', 'PATCH', { ...fixtures.products[11], stock: 1 }, admin);
  const concurrent = await Promise.all(
    [client, client2].map((cookie) =>
      fetch(base + '/api/paseo/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie },
        body: JSON.stringify({
          storeId: demoId(2, 5),
          items: [{ productId: demoId(3, 12), quantity: 1 }],
          requestKey: randomUUID(),
        }),
      }),
    ),
  );
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await stock(demoId(3, 12)), 0);
  const cancelled = (
    await call('pedidos', 'POST', { ...payload, requestKey: randomUUID() }, client, 201)
  ).data.order;
  await call('pedidos', 'PATCH', { orderId: cancelled.id, status: 'cancelado' }, client);
  await call('pedidos', 'PATCH', { orderId: cancelled.id, status: 'cancelado' }, client, 409);
  assert.equal(await stock(demoId(3, 1)), 18);
  console.log('PASS concurrency: last unit sold once; cancelling restores stock exactly once.');
  const product = fixtures.products[0];
  await call('gestion/productos', 'PATCH', { ...product, price: 23 }, otherMerchant, 403);
  await call('gestion/productos', 'PATCH', { ...product, price: -1 }, merchant, 400);
  await call('gestion/productos', 'PATCH', { ...product, price: 23, stock: 18 }, merchant);
  await call(
    'gestion/usuarios',
    'PATCH',
    { id: demoId(1, 3), name: 'Admin', role: 'cliente', is_active: true },
    admin,
    400,
  );
  const summary = (await call('resumen', 'GET', undefined, admin)).data;
  assert(summary.audit.length > 0);
  assert(summary.users.every((u) => !('password' in u)));
  const ownerSummary = (await call('resumen', 'GET', undefined, otherMerchant)).data;
  assert(ownerSummary.stores.every((s) => s.owner_id === demoId(1, 4)));
  assert.equal(ownerSummary.users.length, 0);
  console.log(
    'PASS management: ownership, invalid values, self-demotion guard, audit and scoped reports.',
  );
  if (process.env.PASEO_TEST_AI === 'true') {
    for (const question of [
      'Busco un regalo por menos de Bs. 150.',
      '¿Qué promociones y eventos hay?',
      '¿Dónde queda Conecta y qué horario tiene?',
      '¿Existe la tienda Unicornio Galáctico?',
    ]) {
      const result = (
        await call('jarvis', 'POST', { messages: [{ role: 'user', content: question }] })
      ).data;
      assert.equal(result.source, 'gemini');
      assert(result.reply.length > 20);
      assert(result.products.every((p) => catalog.products.some((c) => c.id === p.id)));
      console.log(
        'PASS Gemini:',
        question,
        JSON.stringify({
          reply: result.reply,
          products: result.products.map((p) => p.name),
          stores: result.stores.map((s) => s.name),
        }),
      );
    }
  }
  mkdirSync('test-results', { recursive: true });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const consoleErrors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const uiRoutes = [
    '/',
    '/cliente',
    '/jarvis',
    '/auth/login',
    '/auth/registro',
    `/producto/${demoId(3, 1)}`,
  ];
  for (const width of focusForms ? [] : [320, 480, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of uiRoutes) {
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      assert((await page.locator('h1').count()) > 0, `Heading: ${route}`);
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Overflow: ${route} at ${width}`,
      );
    }
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  }
  await context.addCookies([
    {
      name: 'paseo_token',
      value: client.split('=')[1],
      url: base,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  for (const width of focusForms ? [] : [320, 480, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/cliente/puntos', '/cliente/pedidos', '/cliente/perfil']) {
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      assert(!page.url().includes('/auth/'));
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Overflow: ${route} at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/cliente/puntos');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/points-1440.png', fullPage: true });
  await context.addCookies([
    {
      name: 'paseo_token',
      value: merchant.split('=')[1],
      url: base,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  for (const width of focusForms ? [] : [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      '/comercio',
      '/comercio/productos',
      '/comercio/promociones',
      '/comercio/scanner',
    ]) {
      await page.goto(base + route);
      await page.waitForLoadState('networkidle');
      assert((await page.locator('h1').count()) > 0);
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Overflow: ${route} at ${width}`,
      );
    }
  }
  await context.addCookies([
    { name: 'paseo_token', value: admin.split('=')[1], url: base, httpOnly: true, sameSite: 'Lax' },
  ]);
  for (const width of focusForms ? [] : [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const section of [
      'overview',
      'stores',
      'products',
      'users',
      'rewards',
      'promotions',
      'events',
      'categories',
      'sales',
      'audit',
      'analytics',
      'alerts',
      'settings',
    ]) {
      await page.goto(base + '/admin/' + section);
      await page.waitForLoadState('networkidle');
      assert((await page.locator('h1').count()) > 0);
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Overflow: /admin/${section} at ${width}`,
      );
    }
  }
  await page.goto(base + '/admin/products');
  await page.getByRole('button', { name: 'Crear registro' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Producto creado desde navegador');
  await page.getByLabel('Descripción', { exact: true }).fill('Prueba de formulario completo.');
  await page.getByLabel('Establecimiento', { exact: true }).selectOption(demoId(2, 1));
  await page.getByLabel('Precio (Bs.)', { exact: true }).fill('55');
  await page.getByLabel('Stock', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Producto creado desde navegador', exact: true })
    .waitFor();
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.goto(base + '/admin/overview');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/admin-1440.png', fullPage: true });
  await context.clearCookies();
  await page.goto(base + '/auth/login');
  await page.getByLabel('Correo electrónico').fill(emailFor('cliente2@paseo.example'));
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await page.waitForURL(base + '/cliente');
  await page.goto(base + '/producto/' + demoId(3, 3));
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto(base + '/carrito');
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click();
  await page.waitForURL(base + '/cliente/pedidos');
  await page.getByRole('heading', { name: 'Mis pedidos', exact: true }).waitFor();
  assert.equal(consoleErrors.length, 0, consoleErrors.join('\n'));
  console.log(
    focusForms
      ? 'PASS browser: create product and login → cart → order.'
      : 'PASS browser: responsive public/client pages at 320/480/768/1024/1440, all management routes at 320/768/1440, create product and login → cart → order.',
  );
  writeFileSync(
    'test-results/result.json',
    JSON.stringify(
      {
        completedAt: new Date().toISOString(),
        database: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        browser: 'Microsoft Edge',
        apiPassed: true,
        responsiveChecked: !focusForms,
        formsPassed: true,
        geminiTested: process.env.PASEO_TEST_AI === 'true',
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  for (const child of children.reverse()) {
    child.kill();
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', resolve);
      setTimeout(resolve, 4000);
    });
  }
  await cleanup();
}
