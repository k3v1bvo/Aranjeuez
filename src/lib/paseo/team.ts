import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, body, checked, db, passwordValue, requireUser, string, uuid } from './server';

const TEAM_FIELDS = 'id,name,email,phone,role,avatar_url,is_active,created_at';
export async function operationalStores(req: NextRequest) {
  const user = await requireUser(req, ['admin', 'comercio', 'empleado']);
  let query = db().from('paseo_stores').select('*').eq('is_active', true);
  if (user.role === 'comercio') query = query.eq('owner_id', user.id);
  if (user.role === 'empleado') {
    if (!user.avatar_url?.startsWith('store:')) return NextResponse.json({ rows: [] });
    query = query.eq('id', uuid(user.avatar_url.slice(6)));
  }
  return NextResponse.json({ rows: checked(await query.order('name')) });
}
export async function employees(req: NextRequest) {
  const user = await requireUser(req, ['comercio', 'admin']);
  const client = db();
  if (req.method === 'GET') {
    let query = client.from('paseo_stores').select('*').order('name');
    if (user.role === 'comercio') query = query.eq('owner_id', user.id);
    const stores = checked(await query) || [];
    const rows = stores.length
      ? checked(
          await client
            .from('paseo_users')
            .select(TEAM_FIELDS)
            .eq('role', 'empleado')
            .in(
              'avatar_url',
              stores.map((s) => `store:${s.id}`),
            )
            .order('name'),
        )
      : [];
    return NextResponse.json({ rows, stores });
  }
  if (!['POST', 'PATCH'].includes(req.method)) throw new ApiError(405, 'Método no permitido.');
  const data = await body(req);
  const fields: Record<string, unknown> = {};
  if (req.method === 'POST') {
    fields.email = string(data.email, 'Correo', 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fields.email)))
      throw new ApiError(400, 'Correo inválido.');
    if (data.action === 'create') {
      fields.name = string(data.name, 'Nombre', 2, 80);
      fields.phone = data.phone ? string(data.phone, 'Teléfono', 5, 25) : null;
      fields.password = await bcrypt.hash(passwordValue(data.password), 12);
    } else if (data.action !== 'link') throw new ApiError(400, 'Acción inválida.');
  } else {
    if (!['release', 'status'].includes(String(data.action)))
      throw new ApiError(400, 'Acción inválida.');
    if (data.action === 'status' && typeof data.is_active !== 'boolean')
      throw new ApiError(400, 'Estado inválido.');
    fields.is_active = data.is_active;
  }
  const id = checked(
    await client.rpc('paseo_manage_employee', {
      p_actor: user.id,
      p_store: uuid(data.store_id),
      p_id: req.method === 'PATCH' ? uuid(data.id) : null,
      p_action: data.action,
      p_fields: fields,
    }),
  );
  return NextResponse.json({
    row: checked(await client.from('paseo_users').select(TEAM_FIELDS).eq('id', id).single()),
  });
}
