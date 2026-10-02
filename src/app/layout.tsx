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
  title: "Tienda Táctica Cochabamba — Equipamiento Profesional Bolivia",
  description: "La tienda táctica #1 en Cochabamba, Bolivia. Equipamiento de combate, rescate y operaciones especiales: chalecos balísticos, mochilas tácticas, óptica de precisión, calzado y accesorios MIL-SPEC. Delivery y retiro en almacén.",
  keywords: ["táctico", "militar", "cochabamba", "bolivia", "equipamiento", "chalecos balísticos", "botas tácticas", "mochilas", "MOLLE", "fuerzas especiales", "seguridad"],
  openGraph: {
    title: "Tienda Táctica Cochabamba",
    description: "Equipamiento profesional para operadores, fuerzas de seguridad y entusiastas. Calidad MIL-SPEC en Bolivia.",
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
      <body className="antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
