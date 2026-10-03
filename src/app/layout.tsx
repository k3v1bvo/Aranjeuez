import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/paseo/Providers';
import { Shell } from '@/components/paseo/Shell';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'Paseo Aranjuez — Centro Comercial & Empresarial | Cochabamba',
  description:
    'Aquí se combinan los negocios, el placer y el entretenimiento de manera perfecta. Descubre tiendas oficiales, terrazas gourmet, PaseoYa Click & Collect y Paseo Points.',
  keywords: [
    'Paseo Aranjuez',
    'Cochabamba',
    'Bolivia',
    'Centro Comercial',
    'Restaurantes',
    'El Cuarto',
    'PaseoYa',
    'Click & Collect',
    'Paseo Points',
    'Jarvis',
  ],
  openGraph: {
    title: 'Paseo Aranjuez — Descubre, Disfruta y Vuelve',
    description:
      'El centro comercial y empresarial líder de Cochabamba. Tiendas exclusivas, gastronomía de autor y servicios digitales.',
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
