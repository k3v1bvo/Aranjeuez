/**
 * ImgBB Image Upload Service
 * Uses ImgBB API v1 with automatic key fallback.
 * Images are uploaded to ImgBB and the direct URLs are stored in Supabase.
 */

const IMGBB_API_KEYS = [
  process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'b049b0990069aec5dfec445cff31a63a',
  process.env.NEXT_PUBLIC_IMGBB_API_KEY_BACKUP || '471638ad84d836135f96a835dc638435',
];

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: number;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
}

/**
 * Uploads an image (File, Blob, or base64 string) to ImgBB
 * Tries the primary key, and falls back to backup key if needed.
 */
export async function uploadToImgBB(
  image: File | Blob | string,
  name?: string,
  expiration?: number
): Promise<UploadResult> {
  let lastError = 'No se pudo subir la imagen';

  for (const apiKey of IMGBB_API_KEYS) {
    if (!apiKey) continue;

    try {
      const formData = new FormData();
      formData.append('key', apiKey);

      if (typeof image === 'string') {
        // base64 or URL
        // If it starts with data:image/...;base64, strip the prefix if necessary or send clean base64
        const cleanBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;
        formData.append('image', cleanBase64);
      } else {
        formData.append('image', image);
      }

      if (name) {
        formData.append('name', name);
      }

      if (expiration && expiration >= 60 && expiration <= 15552000) {
        formData.append('expiration', expiration.toString());
      }

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const result: ImgBBResponse = await response.json();

      if (result.success && result.data) {
        return {
          success: true,
          url: result.data.url,
          displayUrl: result.data.display_url,
          thumbUrl: result.data.thumb?.url || result.data.display_url,
          deleteUrl: result.data.delete_url,
        };
      } else {
        lastError = `Error ImgBB: ${response.statusText || 'Respuesta no exitosa'}`;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : 'Error desconocido al subir imagen';
      console.warn(`[ImgBB] Error con key ${apiKey.substring(0, 6)}...:`, lastError);
    }
  }

  return {
    success: false,
    error: lastError,
  };
}
