import { protectPage } from '@/lib/paseo/server';
import { PanelNav } from '@/components/paseo/Shell';
export default async function Layout({ children }: { children: React.ReactNode }) {
  await protectPage(['admin']);
  return (
    <div className="panel-layout">
      <PanelNav role="admin" />
      <div className="panel-content">{children}</div>
    </div>
  );
}
