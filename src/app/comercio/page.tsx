import { Orders } from '@/components/paseo/Orders';
import { Dashboard } from '@/components/paseo/Admin';
export default function Page() {
  return (
    <>
      <Dashboard compact />
      <Orders commerce />
    </>
  );
}
