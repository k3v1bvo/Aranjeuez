import { NextRequest, NextResponse } from 'next/server';
import { uploadToImgBB } from '@/lib/imgbb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | string | null;
    const name = formData.get('name') as string | null;
    const expirationStr = formData.get('expiration') as string | null;
    const expiration = expirationStr ? parseInt(expirationStr, 10) : undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo o imagen' },
        { status: 400 }
      );
    }

    const result = await uploadToImgBB(file, name || undefined, expiration);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Error al subir la imagen a ImgBB' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      displayUrl: result.displayUrl,
      thumbUrl: result.thumbUrl,
      deleteUrl: result.deleteUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
