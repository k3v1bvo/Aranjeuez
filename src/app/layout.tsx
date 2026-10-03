import type { Metadata } from "next";
import { Montserrat, Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "Paseo Aranjuez — Modernidad Andina & Ecosistema Digital",
  description: "Plataforma digital unificada de Paseo Aranjuez (Cochabamba, Bolivia). Click & Collect (PaseoYa), Jarvis IA y Fidelización con Paseo Points.",
  keywords: ["Paseo Aranjuez", "Cochabamba", "Bolivia", "Marketplace", "Jarvis IA", "Paseo Points", "Centro Comercial"],
  openGraph: {
    title: "Paseo Aranjuez — Modernidad Andina",
    description: "Ecosistema digital premium con alma cochabambina. PaseoYa, Jarvis IA y Paseo Points.",
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
    <html lang="es" data-scroll-behavior="smooth" className={`${montserrat.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased" style={{ background: "#030B1A", color: "#FFFFFF" }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
