import { protectPage } from '@/lib/paseo/server';
import { PanelNav } from '@/components/paseo/Shell';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await protectPage(['comercio', 'empleado', 'admin']);
  return (
    <div className="panel-layout">
      <PanelNav role={user.role === 'empleado' ? 'empleado' : 'comercio'} />
      <div className="panel-content">{children}</div>
    </div>
  );
}
