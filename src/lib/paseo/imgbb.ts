/**
 * Helper para subir imágenes a ImgBB y guardar únicamente el enlace en Supabase.
 * Key: b049b0990069aec5dfec445cff31a63a
 */

export const IMGBB_API_KEY =
  process.env.IMGBB_API_KEY ||
  process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
  'b049b0990069aec5dfec445cff31a63a';

export async function uploadImageToImgBB(
  imageSource: File | Blob | string,
  name?: string
): Promise<string> {
  const apiKey = IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('Falta configurar la API Key de ImgBB');
  }

  const formData = new FormData();
  if (typeof imageSource === 'string') {
    // Si viene base64 con data:image/...;base64,
    const cleanBase64 = imageSource.replace(/^data:image\/[a-z]+;base64,/, '');
    formData.append('image', cleanBase64);
  } else {
    formData.append('image', imageSource);
  }

  if (name) {
    formData.append('name', name);
  }

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Error al subir imagen a ImgBB');
  }

  // Devolver únicamente el enlace directo a la imagen
  return json.data.url || json.data.display_url;
}
