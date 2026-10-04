// Browser integration with an isolated Supabase HTTP fixture. Never contacts the live database.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const base = 'http://127.0.0.1:3117',
  secret = 'audit-local-only-secret-that-is-never-a-production-key';
const uid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sid = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const password = await bcrypt.hash('Local-test-123', 12);
const users = ['cliente', 'comercio', 'empleado', 'admin'].map((role, i) => ({
  id: uid(i + 1),
  name: `Prueba ${role}`,
  email: `${role}@example.test`,
  role,
  phone: '77777777',
  password,
  points: 250,
  lifetime_points: 250,
  qr_token: uid(i + 10),
  avatar_url: role === 'empleado' ? 'store:' + sid(1) : null,
  is_active: true,
  created_at: new Date().toISOString(),
}));
const stores = [
  {
    id: sid(1),
    owner_id: uid(2),
    name: 'Café de prueba',
    category: 'gastronomia',
    description: 'Café y productos',
    floor: 'Planta Baja',
    local_num: 'L-01',
    sector: 'Norte',
    schedule: '10:00 - 21:00',
    phone: '77777777',
    reference: 'Ingreso',
    is_active: true,
    image_url: null,
  },
  {
    id: sid(2),
    owner_id: null,
    name: 'Tienda presencial',
    category: 'gastronomia',
    description: 'Visítanos en el local',
    floor: 'Piso 1',
    local_num: 'L-12',
    schedule: '10:00 - 21:00',
    is_active: true,
    image_url: null,
  },
];
const products = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    store_id: sid(1),
    name: 'Café especial',
    description: 'Café recién preparado',
    price: 25,
    stock: 10,
    category: 'gastronomia',
    is_active: true,
    is_featured: true,
    store: stores[0],
  },
];
products.push({
  ...products[0],
  id: '30000000-0000-4000-8000-000000000002',
  store_id: sid(2),
  name: 'Producto privado',
  is_active: false,
  store: stores[1],
});
const tables = {
  paseo_users: users,
  paseo_stores: stores,
  paseo_products: products,
  paseo_categories: [{ id: 'gastronomia', name: 'Gastronomía' }],
  paseo_settings: [{ id: 1, location: 'Cochabamba', points_ratio: 1, welcome_points: 0 }],
  paseo_orders: [],
  paseo_rewards: [],
  paseo_redemptions: [],
  paseo_point_movements: [],
  paseo_promotions: [],
  paseo_events: [],
  paseo_audit: [],
};
const database = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const table = url.pathname.split('/').at(-1);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'P0001', message: 'Read-only UI fixture' }));
    return;
  }
  let rows = [...(tables[table] || [])];
  for (const [key, filter] of url.searchParams) {
    if (filter.startsWith('eq.'))
      rows = rows.filter(
        (row) => String(key.split('.').reduce((value, k) => value?.[k], row)) === filter.slice(3),
      );
    if (filter.startsWith('in.('))
      rows = rows.filter((row) => filter.slice(4, -1).split(',').includes(String(row[key])));
  }
  const single = req.headers.accept?.includes('vnd.pgrst.object');
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
  });
  res.end(JSON.stringify(single ? rows[0] || null : rows));
});
await new Promise((resolve) => database.listen(3118, '127.0.0.1', resolve));
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', '-p', '3117', '-H', '127.0.0.1'],
  {
    windowsHide: true,
    env: {
      ...process.env,
      JWT_SECRET: secret,
      SUPABASE_URL: 'http://127.0.0.1:3118',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3118',
      SUPABASE_SERVICE_ROLE_KEY: 'local-test',
      GEMINI_API_KEY: '',
      NEXT_PUBLIC_APP_URL: base,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
child.stdout.on('data', (b) => (logs += b));
child.stderr.on('data', (b) => (logs += b));
let browser;
const results = [];
const pass = (name) => {
  results.push({ name, status: 'passed' });
  console.log('PASS:', name);
};
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base + '/auth/login')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.PASEO_TEST_BROWSER ||
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  mkdirSync('test-results/audit', { recursive: true });
  async function contextFor(role) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (role) {
      const user = users.find((u) => u.role === role);
      const token = await new SignJWT({})
        .setSubject(user.id)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('paseo')
        .setAudience('paseo-web')
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(secret));
      await context.addCookies([
        { name: 'paseo_token', value: token, url: base, httpOnly: true, sameSite: 'Lax' },
      ]);
    }
    return context;
  }
  const admin = await contextFor('admin');
  const page = await admin.newPage();
  await page.goto(base + '/admin/usuarios');
  await page.getByRole('button', { name: 'Crear registro' }).waitFor();
  await page.getByRole('button', { name: 'Crear registro' }).click();
  await page.getByLabel('Puntos Paseo', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('Establecimiento de operación', { exact: true }).count(), 0);
  pass('04: customer form has points without stores');
  await page.getByLabel('Rol', { exact: true }).selectOption('comercio');
  await page.getByText('Asignar a local existente').waitFor();
  await page.getByText('Crear nuevo local ahora').click();
  await page.getByLabel('Nombre del nuevo local', { exact: true }).waitFor();
  pass('06: merchant creation supports new store');
  await page.getByLabel('Rol', { exact: true }).selectOption('empleado');
  assert.equal(
    await page.getByLabel('Establecimiento de operación', { exact: true }).getAttribute('required'),
    '',
  );
  assert.equal(await page.getByLabel('Puntos Paseo', { exact: true }).count(), 0);
  pass('07: employee requires store and hides points');
  await page.getByLabel('Rol', { exact: true }).selectOption('admin');
  await page.getByText('Esta cuenta tiene permisos globales', { exact: false }).waitFor();
  assert.equal(await page.getByLabel('Establecimiento de operación', { exact: true }).count(), 0);
  pass('08: administrator form isolates privileges');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Prueba comercio', exact: true }).click();
  await page.getByText('Tienda actualmente vinculada:', { exact: false }).waitFor();
  pass('05: merchant edit shows assigned store');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  for (const label of ['PaseoYa', 'Paseo Points', 'Jarvis'])
    assert.equal(await page.getByRole('link', { name: label, exact: true }).count(), 0);
  assert.equal(await page.getByLabel(/Carrito,/).count(), 0);
  pass('02: admin navigation excludes consumption');
  await page.screenshot({ path: 'test-results/audit/admin.png', fullPage: true });
  const logo = page.getByAltText('Isotipo oficial de Paseo Aranjuez').first();
  const size = await logo.boundingBox();
  assert(Math.abs(size.width / size.height - 2) < 0.01);
  pass('01: original logo keeps 2:1 aspect ratio');
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `Admin overflow ${width}`,
    );
  }
  pass('23/24: admin fits mobile and desktop widths');
  const employee = await contextFor('empleado');
  const emp = await employee.newPage();
  await emp.goto(base + '/comercio');
  await emp.getByRole('heading', { name: 'Pedidos de tu local' }).waitFor();
  assert.equal(await emp.getByRole('link', { name: 'Mis productos', exact: true }).count(), 0);
  await emp.goto(base + '/comercio/productos');
  await emp.waitForURL(base + '/acceso-denegado');
  const forbidden = await employee.request.get(base + '/api/paseo/gestion/productos');
  assert.equal(forbidden.status(), 403);
  pass('11: employee denied inventory page and API');
  await emp.goto(base + '/comercio/scanner');
  await emp.getByRole('heading', { name: 'Caja y validación' }).waitFor();
  pass('22: employee scanner opens with assigned store');
  const customer = await contextFor('cliente');
  const client = await customer.newPage();
  await client.goto(base + '/cliente');
  const merchant = await contextFor('comercio');
  const inventory = await merchant.request.get(base + '/api/paseo/gestion/productos');
  assert.equal(inventory.status(), 200);
  assert((await inventory.json()).rows.every((p) => p.store_id === sid(1)));
  const foreignProduct = await merchant.request.patch(base + '/api/paseo/gestion/productos', {
    data: { ...products[0], id: products[1].id },
  });
  assert.equal(foreignProduct.status(), 403);
  const foreignPromotion = await merchant.request.post(base + '/api/paseo/gestion/promociones', {
    data: {
      title: 'Oferta',
      description: 'Prueba',
      store_id: sid(2),
      is_active: true,
      discount: 5,
      start_date: '2026-10-04',
      end_date: '2026-10-05',
    },
  });
  assert.equal(foreignPromotion.status(), 403);
  assert.equal((await customer.request.get(base + '/api/paseo/empleados')).status(), 403);
  assert.equal((await customer.request.get(base + '/api/paseo/gestion/usuarios')).status(), 403);
  pass('10: store inventory isolation and foreign writes rejected; customers denied management');
  await client.getByRole('heading', { name: 'Tienda presencial' }).waitFor();
  await client.getByText('Visita presencial', { exact: true }).waitFor();
  await client.getByRole('heading', { name: 'Café especial' }).waitFor();
  pass('13/14: unified directory includes store with no online products');
  await client.locator('header').getByText('cliente@example.test', { exact: true }).waitFor();
  await client.getByRole('button', { name: 'Cerrar sesión', exact: true }).waitFor();
  pass('03: named session, email, role and logout');
  for (const width of [320, 375, 768, 1440]) {
    await client.setViewportSize({ width, height: 900 });
    await client.waitForTimeout(150);
    await client.screenshot({ path: `test-results/audit/catalog-${width}.png`, fullPage: true });
    const overflow = await client.evaluate(() =>
      Array.from(document.querySelectorAll('main *,footer *'))
        .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 8)
        .map((e) => ({ tag: e.tagName, cls: e.className, right: e.getBoundingClientRect().right })),
    );
    assert(
      await client.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `Catalog overflow ${width}: ${JSON.stringify(overflow)}`,
    );
  }
  pass('23/24: catalog and dock fit mobile and desktop widths');
  await client.locator('footer').getByText('Hasta las 02:00', { exact: true }).waitFor();
  await client
    .locator('footer')
    .getByText(/Estacionamiento subterráneo 24/)
    .waitFor();
  pass('25: footer separates hours, terraces and parking');
  await client.setViewportSize({ width: 1440, height: 1000 });
  await client.goto(base + '/cliente/puntos');
  await client.getByRole('button', { name: 'Registrar código manual' }).waitFor();
  await client.getByRole('button', { name: 'Abrir Cámara para Escanear' }).waitFor();
  pass('20/21: camera control and manual check-in are present');
  const far = await customer.request.post(base + '/api/paseo/checkin', {
    data: { code: 'PASEO-P1-ENTRADA', userLat: 0, userLng: 0 },
  });
  assert.equal(far.status(), 400);
  const noLocation = await customer.request.post(base + '/api/paseo/checkin', {
    data: { code: 'PASEO-P1-ENTRADA' },
  });
  assert.equal(noLocation.status(), 400);
  pass('21: strict geofence rejects remote or missing GPS');
  await client.goto(base + '/jarvis');
  await client.addScriptTag({
    content: `
    window.__languages=[];window.__resumeCount=0;
    const interval=window.setInterval;window.setInterval=(callback,delay)=>{if(delay===10000){window.__voiceInterval=delay;callback();}return interval(callback,delay);};
    Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{},resume:()=>window.__resumeCount++,speak:u=>{window.__spoken=u.text;u.onstart?.();}}});
    window.SpeechRecognition=class {start(){window.__languages.push(this.lang);setTimeout(()=>{if(window.__languages.length===1){this.onerror({error:'language-not-supported'});return;}this.onresult({results:[[{transcript:'horarios'}]]});this.onend();},20)}stop(){this.onend()}abort(){this.onend?.()}};`,
  });
  await client.getByRole('button', { name: 'Activar micrófono de Jarvis' }).click();
  await client.getByText('horarios', { exact: true }).waitFor();
  pass('15/19: speech end sends question and orb activates speech');
  await client.waitForFunction(() => window.__spoken?.length > 0);
  assert.deepEqual(await client.evaluate(() => window.__languages), [
    await client.evaluate(() => navigator.language),
    'es-419',
  ]);
  pass('16: voice language falls back after unsupported language');
  assert.equal(await client.evaluate(() => window.__voiceInterval), 10000);
  assert(await client.evaluate(() => window.__resumeCount > 0));
  pass('18: speech keep-alive calls resume at 10-second intervals');
  await client.getByRole('button', { name: 'Silenciar Jarvis', exact: true }).click();
  await client.getByRole('button', { name: 'Activar micrófono de Jarvis' }).waitFor();
  pass('19: orb can silence speaking response');
  const logoutResponse = client.waitForResponse(
    (r) => r.url().endsWith('/api/paseo/auth') && r.request().method() === 'POST',
  );
  await client.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  const loggedOut = await logoutResponse;
  assert.equal(loggedOut.status(), 200);
  await client.waitForTimeout(500);
  assert(
    !(await customer.cookies()).some((c) => c.name === 'paseo_token' && c.value),
    'Logout cookie should be removed',
  );
  await client.getByRole('link', { name: 'Ingresar', exact: true }).waitFor();
  pass('03: logout removes cookie');
  const guest = await contextFor();
  assert.equal(
    (
      await guest.request.post(base + '/api/upload', {
        multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('test') } },
      })
    ).status(),
    401,
  );
  pass('12: anonymous uploads rejected');
  assert.equal(
    (
      await guest.request.post(base + '/api/paseo/auth', {
        headers: { Origin: 'https://untrusted.vercel.app' },
        data: { action: 'logout' },
      })
    ).status(),
    403,
  );
  pass('Security: arbitrary Vercel origins rejected');
  writeFileSync('test-results/audit/results.json', JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  child.kill();
  database.close();
  writeFileSync('test-results/audit/server.log', logs);
}
