import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToImgBB } from '@/lib/paseo/imgbb';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const name = (formData.get('name') as string) || undefined;

      if (!file) {
        return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 });
      }

      imageUrl = await uploadImageToImgBB(file, name);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ error: 'Falta el campo de imagen base64' }, { status: 400 });
      }
      imageUrl = await uploadImageToImgBB(body.image, body.name);
    } else {
      return NextResponse.json(
        { error: 'Tipo de contenido no soportado. Usa multipart/form-data o application/json' },
        { status: 415 }
      );
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: 'Imagen subida correctamente a ImgBB. Enlace listo para guardar en Supabase.',
    });
  } catch (error: any) {
    console.error('Error en /api/upload:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la subida de imagen' },
      { status: 500 }
    );
  }
}
