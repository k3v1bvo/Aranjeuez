import { AdminSection } from '@/components/paseo/Admin';
import { notFound, redirect } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section: requested } = await params;
  const aliases: Record<string, string> = {
    tiendas: 'stores',
    productos: 'products',
    usuarios: 'users',
    recompensas: 'rewards',
    promociones: 'promotions',
    eventos: 'events',
    categorias: 'categories',
    auditoria: 'audit',
  };
  if (aliases[requested]) redirect('/admin/' + aliases[requested]);
  const section = requested;
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
      'qrs',
    ].includes(section)
  )
    notFound();
  return <AdminSection section={section} />;
}
