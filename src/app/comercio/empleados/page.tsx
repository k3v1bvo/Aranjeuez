import { protectPage } from '@/lib/paseo/server';
import { MerchantEmployees } from '@/components/paseo/MerchantEmployees';
export default async function Page() {
  await protectPage(['comercio', 'admin']);
  return <MerchantEmployees />;
}
