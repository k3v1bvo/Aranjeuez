import Image from 'next/image';
export function PaseoAranjuezLogo({
  className = '',
  size = 'md',
  showSubtitle = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}) {
  const width = { sm: 60, md: 76, lg: 112 }[size];
  return (
    <span className={'paseo-brand ' + className}>
      <Image
        src="/aranjuez-isotipo-oficial.jpeg"
        alt="Isotipo oficial de Paseo Aranjuez"
        width={1600}
        height={800}
        style={{ width, height: 'auto', objectFit: 'contain' }}
        priority
      />
      <span>
        <strong>Paseo Aranjuez</strong>
        {showSubtitle && <small>Cochabamba · Bolivia</small>}
      </span>
    </span>
  );
}
