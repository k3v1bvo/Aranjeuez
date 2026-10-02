'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { uploadToImgBB } from '@/lib/imgbb';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
}

export function ImageUploader({
  value,
  onChange,
  label = 'Subir Imagen',
  className = '',
  aspectRatio = 'square',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = {
    square: 'aspect-square max-w-[240px]',
    video: 'aspect-video max-w-md',
    banner: 'aspect-[3/1] w-full',
  }[aspectRatio];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo seleccionado no es una imagen válida.');
      return;
    }

    if (file.size > 32 * 1024 * 1024) {
      toast.error('La imagen supera el límite máximo de 32 MB permitido por ImgBB.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Subiendo imagen a ImgBB...');

    try {
      const result = await uploadToImgBB(file, file.name);
      if (result.success && result.url) {
        onChange(result.url);
        toast.success('¡Imagen subida exitosamente a ImgBB!', { id: toastId });
      } else {
        toast.error(result.error || 'Error al subir la imagen', { id: toastId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      toast.error(`Fallo de subida: ${msg}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-semibold text-tactical-300 uppercase tracking-wider">{label}</label>}

      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-white/[0.1] bg-tactical-800 ${aspectClass} group`}>
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="absolute inset-0 bg-tactical-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-tactical-800 text-tactical-200 hover:text-white hover:bg-tactical-700 transition"
              title="Cambiar imagen"
            >
              <UploadCloud size={16} />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-lg bg-red-alert/20 text-red-alert hover:bg-red-alert/40 transition"
              title="Eliminar imagen"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-tactical-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-green-tactical">
            <CheckCircle size={10} /> ImgBB
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-amber-accent bg-amber-accent/5'
              : 'border-white/[0.08] hover:border-white/[0.2] bg-white/[0.01]'
          } ${aspectClass}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-amber-accent animate-spin" />
              <span className="text-xs text-tactical-400">Subiendo a ImgBB...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-tactical-400">
                <ImageIcon size={20} />
              </div>
              <div className="text-xs text-tactical-300 font-medium">
                Arrastra o haz clic para subir
              </div>
              <div className="text-[11px] text-tactical-500">
                JPG, PNG, WEBP (hasta 32 MB)
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
