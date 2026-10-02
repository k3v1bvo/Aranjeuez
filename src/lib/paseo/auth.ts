import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { getDB } from "./supabase"
import type { PaseoUser } from "./types"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "paseo-aranjuez-secret-2024"
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(user: Pick<PaseoUser, "id" | "email" | "role">): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string): Promise<PaseoUser | null> {
  const payload = await verifyToken(token)
  if (!payload) return null
  const db = getDB()
  const { data } = await db
    .from("paseo_users")
    .select("*")
    .eq("id", payload.id)
    .single()
  return data || null
}

export async function registerUser(data: {
  email: string; password: string; name: string
  phone?: string; role?: string; birthday?: string
}): Promise<{ user: PaseoUser | null; error: string | null }> {
  const db = getDB()
  const { data: existing } = await db.from("paseo_users").select("id").eq("email", data.email).single()
  if (existing) return { user: null, error: "Este email ya está registrado" }
  const hashed = await hashPassword(data.password)
  const { data: user, error } = await db
    .from("paseo_users")
    .insert({ email: data.email, password: hashed, name: data.name, phone: data.phone, role: data.role || "cliente", birthday: data.birthday })
    .select().single()
  if (error) return { user: null, error: error.message }
  return { user, error: null }
}

export async function loginUser(email: string, password: string): Promise<{
  user: PaseoUser | null; token: string | null; error: string | null
}> {
  const db = getDB()
  const { data: user } = await db.from("paseo_users").select("*").eq("email", email).single()
  if (!user) return { user: null, token: null, error: "Email o contraseña incorrectos" }
  const valid = await verifyPassword(password, user.password)
  if (!valid) return { user: null, token: null, error: "Email o contraseña incorrectos" }
  const token = await createToken(user)
  return { user, token, error: null }
}
