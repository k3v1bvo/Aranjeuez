import { Orders } from '@/components/paseo/Orders';
import { protectPage } from '@/lib/paseo/server';
export default async function Page() {
  await protectPage(['cliente']);
  return (
    <div className="container">
      <Orders />
    </div>
  );
}
