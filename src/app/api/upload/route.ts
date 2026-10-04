import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToImgBB } from '@/lib/paseo/imgbb';
import { ApiError, checkOrigin, failure, rateLimit, requireUser } from '@/lib/paseo/server';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req, ['admin', 'comercio']);
    checkOrigin(req);
    rateLimit('upload:' + user.id, 10);
    if (Number(req.headers.get('content-length')) > 6 * 1024 * 1024)
      throw new ApiError(413, 'Máximo 5 MB por imagen.');
    if (!req.headers.get('content-type')?.includes('multipart/form-data'))
      throw new ApiError(415, 'Envía un archivo de imagen.');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024)
      throw new ApiError(400, 'Selecciona una imagen de hasta 5 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = Buffer.from(bytes.slice(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    const webp =
      Buffer.from(bytes.slice(0, 4)).toString() === 'RIFF' &&
      Buffer.from(bytes.slice(8, 12)).toString() === 'WEBP';
    if (
      !(jpeg && file.type === 'image/jpeg') &&
      !(png && file.type === 'image/png') &&
      !(webp && file.type === 'image/webp')
    )
      throw new ApiError(400, 'Formatos permitidos: JPG, PNG y WEBP.');
    return NextResponse.json({ success: true, url: await uploadImageToImgBB(file) });
  } catch (error) {
    return failure(error);
  }
}
