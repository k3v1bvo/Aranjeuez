import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import type { Role, User } from './model';

export const USER_FIELDS =
  'id,name,email,phone,role,points,lifetime_points,qr_token,birthday,is_active,created_at';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new ApiError(503, 'Falta configurar la conexión de Supabase en el servidor.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new ApiError(503, 'Falta configurar JWT_SECRET (mínimo 32 caracteres).');
  return new TextEncoder().encode(value);
}
export async function session(token?: string): Promise<User | null> {
  if (!token) return null;
  const key = secret();
  let id: string;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer: 'paseo',
      audience: 'paseo-web',
    });
    if (typeof payload.sub !== 'string') return null;
    id = payload.sub;
  } catch {
    return null;
  }
  const { data, error } = await db()
    .from('paseo_users')
    .select(USER_FIELDS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new ApiError(503, 'No pudimos consultar tu sesión. Reintenta en un momento.');
  if (data && !['cliente', 'comercio', 'admin'].includes(data.role)) return null;
  return data as User | null;
}
export async function requireUser(req: NextRequest, roles?: Role[]) {
  const user = await session(req.cookies.get('paseo_token')?.value);
  if (!user) throw new ApiError(401, 'Inicia sesión para continuar.');
  if (roles && !roles.includes(user.role))
    throw new ApiError(403, 'No tienes permiso para esta acción.');
  return user;
}
export async function protectPage(roles: Role[]) {
  const user = await session((await cookies()).get('paseo_token')?.value);
  if (!user) redirect('/auth/login');
  if (!roles.includes(user.role)) redirect('/acceso-denegado');
  return user;
}
export async function signedResponse(user: User) {
  const token = await new SignJWT({})
    .setSubject(user.id)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('paseo')
    .setAudience('paseo-web')
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret());
  const response = NextResponse.json({ user });
  response.cookies.set('paseo_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 43200,
  });
  return response;
}
export function checkMutation(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) {
    const allowed = new Set<string>([
      new URL(req.url).origin,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ]);
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
      } catch {}
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      try {
        allowed.add(new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`).origin);
      } catch {}
    }
    if (process.env.VERCEL_URL) {
      try {
        allowed.add(new URL(`https://${process.env.VERCEL_URL}`).origin);
      } catch {}
    }

    let host = '';
    try {
      host = new URL(origin).hostname;
    } catch {}
    const isAllowed =
      allowed.has(origin) ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1';

    if (!isAllowed) throw new ApiError(403, 'Origen de solicitud no permitido.');
  }
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new ApiError(415, 'Envía datos JSON.');
}
export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  checkMutation(req);
  const raw = await req.text();
  if (raw.length > 30000) throw new ApiError(413, 'La solicitud es demasiado grande.');
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch {
    throw new ApiError(400, 'El cuerpo debe ser un objeto JSON válido.');
  }
}
export function string(value: unknown, label: string, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new ApiError(400, `${label}: entre ${min} y ${max} caracteres.`);
  return value.trim();
}
export function passwordValue(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72)
    throw new ApiError(400, 'Contraseña: mínimo 8 caracteres y máximo 72 bytes.');
  return value;
}
export function uuid(value: unknown, label = 'Identificador') {
  const id = string(value, label, 36, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new ApiError(400, `${label} inválido.`);
  return id;
}
export function number(value: unknown, label: string, min = 0, max = 1000000, integer = false) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new ApiError(400, `${label} inválido.`);
  return value;
}
export function failure(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  console.error('[Paseo API]', error instanceof Error ? error.message : 'Error inesperado');
  return NextResponse.json(
    { error: 'No pudimos completar la operación. Intenta nuevamente.' },
    { status: 500 },
  );
}
export function checked<T>(result: {
  data: T;
  error: { message: string; code?: string } | null;
}): T {
  if (result.error) {
    if (result.error.code === 'P0001') throw new ApiError(409, result.error.message);
    if (result.error.code === '23505')
      throw new ApiError(409, 'Ya existe un registro con esos datos.');
    console.error('[Paseo DB]', result.error.code);
    throw new ApiError(
      503,
      'No pudimos completar la operación en la base de datos. Revisa la configuración e intenta de nuevo.',
    );
  }
  return result.data;
}
export async function ownsStore(user: User, id: string) {
  const store = checked(
    await db().from('paseo_stores').select('id,owner_id').eq('id', id).maybeSingle(),
  );
  if (!store) throw new ApiError(404, 'Establecimiento no encontrado.');
  if (user.role !== 'admin' && (user.role !== 'comercio' || store.owner_id !== user.id))
    throw new ApiError(403, 'Este establecimiento no pertenece a tu cuenta.');
}
const attempts = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max = 30) {
  const now = Date.now();
  if (attempts.size > 5000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const item = attempts.get(key);
  if (item && item.until > now) {
    if (item.count >= max)
      throw new ApiError(429, 'Demasiados intentos. Espera un minuto y vuelve a intentar.');
    item.count++;
  } else attempts.set(key, { count: 1, until: now + 60000 });
}
