import { Points } from '@/components/paseo/Points';
import { protectPage } from '@/lib/paseo/server';
export default async function Page() {
  await protectPage(['cliente']);
  return <Points />;
}
