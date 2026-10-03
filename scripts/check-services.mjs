import { loadEnvFile } from 'node:process';
try {
  loadEnvFile('.env.local');
} catch {
  /* Environment may be provided by the runner. */
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  try {
    const res = await fetch(`${url}/rest/v1/paseo_settings?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    const result = await res.json();
    console.log(
      JSON.stringify({
        service: 'Supabase',
        project: new URL(url).hostname,
        status: res.status,
        code: result.code || null,
        schemaReady: res.ok,
      }),
    );
    if (!res.ok) {
      const meta = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/openapi+json',
        },
        signal: AbortSignal.timeout(15000),
      });
      const schema = await meta.json();
      console.log(
        JSON.stringify({
          exposedPaseoTables: Object.keys(schema.paths || {}).filter((p) =>
            p.startsWith('/paseo_'),
          ),
          metadataStatus: meta.status,
        }),
      );
    }
  } catch {
    console.log('Supabase: no se pudo conectar.');
  }
}
if (process.env.GEMINI_API_KEY) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(15000),
    });
    const result = await res.json();
    console.log(
      JSON.stringify({
        service: 'Gemini',
        status: res.status,
        configuredModelAvailable: (result.models || []).some(
          (m) => m.name === `models/${process.env.GEMINI_MODEL}`,
        ),
      }),
    );
  } catch {
    console.log('Gemini: no se pudo conectar.');
  }
}
