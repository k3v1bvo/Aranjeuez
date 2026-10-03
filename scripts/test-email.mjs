import { loadEnvFile } from "node:process";
import nodemailer from "nodemailer";

try {
  loadEnvFile(".env.local");
} catch (e) {}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER || "ayniprotocol@gmail.com";
const pass = (process.env.SMTP_PASSWORD || "ujccnzxebbpqzhaw").replace(/\s+/g, "");

console.log("Testing SMTP connection with:", { host, port, user });

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { rejectUnauthorized: false }
});

try {
  await transporter.verify();
  console.log("✅ SMTP TRANSPORTER VERIFIED SUCCESSFULLY!");
} catch (err) {
  console.error("❌ SMTP ERROR:", err.message);
}
