import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/paseo/supabase"
import { registerUser, loginUser } from "@/lib/paseo/auth"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, email, password, name, phone, role, birthday } = body
  if (action === "register") {
    if (!email || !password || !name) return NextResponse.json({ error: "Email, password y nombre requeridos" }, { status: 400 })
    const { user, error } = await registerUser({ email, password, name, phone, role, birthday })
    if (error) return NextResponse.json({ error }, { status: 400 })
    const result = await loginUser(email, password)
    const res = NextResponse.json({ user: result.user, success: true })
    res.cookies.set("paseo_token", result.token!, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 })
    return res
  }
  if (action === "login") {
    if (!email || !password) return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 })
    const { user, token, error } = await loginUser(email, password)
    if (error) return NextResponse.json({ error }, { status: 401 })
    const res = NextResponse.json({ user, success: true })
    res.cookies.set("paseo_token", token!, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 })
    return res
  }
  if (action === "logout") {
    const res = NextResponse.json({ success: true })
    res.cookies.delete("paseo_token")
    return res
  }
  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("paseo_token")?.value
  if (!token) return NextResponse.json({ user: null })
  const { getUserFromToken } = await import("@/lib/paseo/auth")
  const user = await getUserFromToken(token)
  return NextResponse.json({ user })
}
