import { AdminSection } from '@/components/paseo/Admin';
import { notFound, redirect } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (['drivers', 'shipping-zones'].includes(section)) redirect('/admin/stores');
  if (
    ![
      'overview',
      'sales',
      'stores',
      'products',
      'users',
      'rewards',
      'promotions',
      'events',
      'categories',
      'analytics',
      'audit',
      'alerts',
      'settings',
      'payments',
    ].includes(section)
  )
    notFound();
  return <AdminSection section={section} />;
}
