import { redirect } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  redirect(
    path[0] === 'products'
      ? '/comercio/productos'
      : path[0] === 'qr-terminal'
        ? '/comercio/scanner'
        : '/comercio',
  );
}
