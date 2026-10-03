import { Profile } from '@/components/paseo/Account';
import { protectPage } from '@/lib/paseo/server';
export default async function Page() {
  await protectPage(['cliente', 'comercio', 'admin']);
  return <Profile />;
}
