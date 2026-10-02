import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/paseo/supabase'

// GET /api/paseo/tiendas — listar tiendas (con filtros)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('q')
  const id = searchParams.get('id')

  let query = supabaseAdmin
    .from('paseo_stores')
    .select('*, products:paseo_products(id, name, price, image_url, is_featured, stock, is_active)')
    .eq('is_active', true)
    .order('name')

  if (id) query = query.eq('id', id)
  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ stores: data })
}

// POST /api/paseo/tiendas — crear tienda (admin)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('paseo_stores')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ store: data }, { status: 201 })
}

// PATCH /api/paseo/tiendas — actualizar tienda
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin
    .from('paseo_stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ store: data })
}
