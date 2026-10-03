import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/paseo/Providers';
import { Shell } from '@/components/paseo/Shell';
export const metadata: Metadata = {
  title: 'Paseo Aranjuez · Descubre, disfruta y vuelve',
  description: 'PaseoYa, Paseo Points y Jarvis: tus compras, beneficios y planes en el Paseo.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Shell demo={process.env.DEMO_MODE === 'true'}>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
