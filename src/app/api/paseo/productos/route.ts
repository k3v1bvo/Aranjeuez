import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/paseo/supabase"

export async function GET(req: NextRequest) {
  try {
    const db = getDB()
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get("storeId")
    const search = searchParams.get("q")
    const featured = searchParams.get("featured")

    let query = db.from("paseo_products").select("*, store:paseo_stores(id,name,floor,sector,local_num)").order("name")
    if (storeId) query = query.eq("store_id", storeId)
    if (search) query = query.ilike("name", `%${search}%`)

    const { data, error } = await query
    if (error) {
      const { data: prodsOnly } = await db.from("paseo_products").select("*").order("name")
      return NextResponse.json({ products: prodsOnly || [] })
    }

    let list = data || []
    if (featured === "true" && list.length > 0) {
      const featuredItems = list.filter((p: any) => p.is_featured === true)
      if (featuredItems.length > 0) {
        list = featuredItems
      }
    }

    return NextResponse.json({ products: list })
  } catch (err: any) {
    return NextResponse.json({ products: [], error: err.message }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  const db = getDB()
  const body = await req.json()
  const { data, error } = await db.from("paseo_products").insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const db = getDB()
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await db.from("paseo_products").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function DELETE(req: NextRequest) {
  const db = getDB()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const { error } = await db.from("paseo_products").delete().eq("id", id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
