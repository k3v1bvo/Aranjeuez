import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
try {
  loadEnvFile('.env.local');
} catch {
  /* CI can supply credentials. */
}
const base = (process.env.PASEO_TEST_URL || 'https://aranjeuez-xi.vercel.app').replace(/\/$/, '');
const home = await fetch(base, { cache: 'no-store' });
assert.equal(home.status, 200);
assert((await home.text()).includes('Tu próximo plan'), 'The new home is not deployed yet.');
const catalog = await fetch(base + '/api/paseo/catalogo', { cache: 'no-store' });
const catalogData = await catalog.json();
assert.equal(catalog.status, 200, JSON.stringify(catalogData));
assert(Array.isArray(catalogData.products));
console.log(
  JSON.stringify({
    check: 'public site and catalog',
    status: 'pass',
    products: catalogData.products.length,
    stores: catalogData.stores.length,
    demoMode: catalogData.settings.demo_mode,
  }),
);
assert.equal((await fetch(base + '/api/paseo/gestion/usuarios')).status, 401);
for (const [name, role, path] of [
  ['cliente', 'cliente', 'puntos'],
  ['comercio', 'comercio', 'pedidos'],
  ['admin', 'admin', 'resumen'],
]) {
  if (!process.env.PASEO_DEMO_PASSWORD) break;
  const login = await fetch(base + '/api/paseo/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({
      action: 'login',
      email: name + '@paseo.example',
      password: process.env.PASEO_DEMO_PASSWORD,
    }),
  });
  const data = await login.json();
  assert.equal(login.status, 200, JSON.stringify(data));
  assert.equal(data.user.role, role);
  const cookie = login.headers.get('set-cookie');
  assert(cookie?.includes('HttpOnly'));
  if (base.startsWith('https:')) assert(cookie.includes('Secure'));
  const res = await fetch(base + '/api/paseo/' + path, {
    headers: { Cookie: cookie.split(';')[0] },
  });
  assert.equal(res.status, 200);
  console.log(JSON.stringify({ check: 'login and role endpoint', role, status: 'pass' }));
}
