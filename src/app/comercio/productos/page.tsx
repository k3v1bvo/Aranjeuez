import { protectPage } from '@/lib/paseo/server';
import { ResourceManager } from '@/components/paseo/Manager';
export default async function Page() {
  await protectPage(['comercio', 'admin']);
  return <ResourceManager resource="productos" />;
}
