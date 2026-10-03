import { protectPage } from '@/lib/paseo/server';
import { PanelNav } from '@/components/paseo/Shell';
export default async function Layout({ children }: { children: React.ReactNode }) {
  await protectPage(['comercio', 'admin']);
  return (
    <div className="panel-layout">
      <PanelNav role="comercio" />
      <div className="panel-content">{children}</div>
    </div>
  );
}
