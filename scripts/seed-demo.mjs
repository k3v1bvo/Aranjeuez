import { loadEnvFile } from 'node:process';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { demoData } from './demo-data.mjs';
try {
  loadEnvFile('.env.local');
} catch {
  /* CI can supply environment directly. */
}
if (process.env.DEMO_MODE !== 'true')
  throw new Error('El seed requiere DEMO_MODE=true y un proyecto de pruebas.');
const password = process.env.PASEO_DEMO_PASSWORD;
if (!password || password.length < 12)
  throw new Error(
    'Define PASEO_DEMO_PASSWORD con al menos 12 caracteres en .env.local. No se incluye una contraseña predeterminada.',
  );
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const ready = await db.from('paseo_settings').select('id').eq('id', 1).single();
if (ready.error)
  throw new Error(
    'La migración no está disponible en el proyecto configurado. Ejecuta check-services.mjs.',
  );
const data = demoData();
const hash = await bcrypt.hash(password, 12);
for (const [name, rows] of Object.entries(data)) {
  const table = 'paseo_' + name;
  const existing = await db
    .from(table)
    .select('id')
    .in(
      'id',
      rows.map((r) => r.id),
    );
  if (existing.error) throw new Error(`No se pudo consultar ${table}: ${existing.error.code}`);
  const ids = new Set(existing.data.map((r) => r.id));
  const missing = rows
    .filter((r) => !ids.has(r.id))
    .map((r) => (name === 'users' ? { ...r, password: hash } : r));
  if (missing.length) {
    const result = await db.from(table).insert(missing);
    if (result.error) throw new Error(`No se pudo crear demo en ${table}: ${result.error.code}`);
  }
  console.log(
    `${table}: ${missing.length} creados; ${rows.length - missing.length} existentes conservados.`,
  );
}
console.log(
  'Demo lista. Correos: cliente@paseo.example, comercio@paseo.example, admin@paseo.example. Contraseña: valor local de PASEO_DEMO_PASSWORD.',
);
