import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "Paseo Aranjuez • Ecosistema Digital",
  description: "Plataforma digital integrada de Paseo Aranjuez Cochabamba: Marketplace PaseoYa con retiros rápidos por QR, Club de Puntos y Asistente Virtual IA.",
  keywords: ["Paseo Aranjuez", "Cochabamba", "Bolivia", "Marketplace", "Paseo Points", "PaseoYa", "Centro Comercial"],
  openGraph: {
    title: "Paseo Aranjuez • Ecosistema Digital",
    description: "Compra, acumula puntos y accede a un asistente inteligente en Paseo Aranjuez.",
    locale: "es_BO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased" style={{ background: "#0b0a16", color: "#f3f4f6" }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}