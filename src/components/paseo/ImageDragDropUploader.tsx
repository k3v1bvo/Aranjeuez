'use client';
import { useId, useState } from 'react';
export function ImageDragDropUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file || busy) return;
    setError('');
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError('Selecciona JPG, PNG o WEBP de hasta 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'No se pudo subir la imagen.');
      onChange(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de carga.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="image-upload span-all"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files[0]);
      }}
    >
      <label htmlFor={id}>
        {busy ? 'Subiendo imagen…' : 'Arrastra una imagen o selecciona un archivo'}
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      {value && (
        <a href={value} target="_blank" rel="noreferrer">
          Ver imagen guardada
        </a>
      )}
      <small>JPG, PNG o WEBP · Hasta 5 MB</small>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
