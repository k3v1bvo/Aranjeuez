import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/paseo/Providers';
import { Shell } from '@/components/paseo/Shell';

export const metadata: Metadata = {
  title: 'Paseo Aranjuez — Modernidad Andina & Ecosistema Digital',
  description:
    'Plataforma digital unificada de Paseo Aranjuez (Cochabamba, Bolivia). Click & Collect (PaseoYa), Jarvis IA y Fidelización con Paseo Points.',
  keywords: [
    'Paseo Aranjuez',
    'Cochabamba',
    'Bolivia',
    'Marketplace',
    'Jarvis IA',
    'Paseo Points',
    'Centro Comercial',
  ],
  openGraph: {
    title: 'Paseo Aranjuez — Modernidad Andina',
    description:
      'Ecosistema digital premium con alma cochabambina. PaseoYa, Jarvis IA y Paseo Points.',
    locale: 'es_BO',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className="antialiased" style={{ background: '#030B1A', color: '#FFFFFF' }}>
        <Providers>
          <Shell demo={process.env.DEMO_MODE === 'true'}>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
