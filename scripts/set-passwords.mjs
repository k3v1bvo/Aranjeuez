import { loadEnvFile } from "node:process";
import bcrypt from "bcryptjs";

try {
  loadEnvFile(".env.local");
} catch (e) {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const password = "PaseoDemo2026!";
  const hash = await bcrypt.hash(password, 12);

  const emails = [
    "admin@paseo.example",
    "admin@paseoaranjuez.bo",
    "comercio@paseo.example",
    "comercio2@paseo.example",
    "cliente@paseo.example",
    "cliente2@paseo.example"
  ];

  for (const email of emails) {
    const res = await fetch(`${url}/rest/v1/paseo_users?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ password: hash, is_active: true })
    });
    const result = await res.json();
    console.log(`Updated ${email}:`, result);
  }

  console.log(`\nTODAS LAS CONTRASEÑAS ACTUALIZADAS A: ${password}`);
}

run();
