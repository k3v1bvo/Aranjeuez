import { ProductDetail } from '@/components/paseo/Catalog';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}
