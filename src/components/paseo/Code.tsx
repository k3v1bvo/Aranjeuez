'use client';
import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export function Code({
  type,
  token,
  label,
  manual,
}: {
  type: 'order' | 'user' | 'coupon';
  token: string;
  label: string;
  manual?: string;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then((qr) =>
        qr.toDataURL(JSON.stringify({ v: 1, type, token }), {
          width: 210,
          margin: 2,
          color: { dark: '#392c49', light: '#ffffff' },
        }),
      )
      .then((value) => {
        if (!cancelled) setUrl(value);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [type, token]);
  return (
    <div className="code-display">
      {url ? (
        <Image unoptimized src={url} alt={label} width={210} height={210} />
      ) : (
        <p role="status">{error ? 'Usa el código manual debajo.' : 'Preparando tu QR…'}</p>
      )}
      <strong>{label}</strong>
      <code>{manual || token}</code>
      <button
        className="text-button"
        onClick={() =>
          navigator.clipboard
            .writeText(manual || token)
            .then(() => toast.success('Código copiado'))
            .catch(() => toast.error('Selecciona y copia el código manualmente.'))
        }
      >
        <Copy size={14} /> Copiar código
      </button>
    </div>
  );
}
