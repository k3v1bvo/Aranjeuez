import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/paseo/supabase'

// GET /api/paseo/productos
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('storeId')
  const search = searchParams.get('q')
  const featured = searchParams.get('featured')

  let query = supabaseAdmin
    .from('paseo_products')
    .select('*, store:paseo_stores(id, name, floor, sector, local_num)')
    .eq('is_active', true)
    .order('name')

  if (storeId) query = query.eq('store_id', storeId)
  if (search) query = query.ilike('name', `%${search}%`)
  if (featured === 'true') query = query.eq('is_featured', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products: data })
}

// POST /api/paseo/productos
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('paseo_products')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}

// PATCH /api/paseo/productos
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin
    .from('paseo_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

// DELETE /api/paseo/productos
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin
    .from('paseo_products')
    .update({ is_active: false })
    .eq('id', id!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
