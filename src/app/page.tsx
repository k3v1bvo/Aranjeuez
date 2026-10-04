import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { session } from '@/lib/paseo/server';
import { homeFor } from '@/lib/paseo/model';
import { PaseoModernidadLanding } from '@/components/paseo/PaseoModernidadLanding';

export default async function HomePage() {
  const user = await session((await cookies()).get('paseo_token')?.value);
  if (user && user.role !== 'cliente') redirect(homeFor(user.role));
  return <PaseoModernidadLanding />;
}
