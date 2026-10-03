import { loadEnvFile } from 'node:process';
try {
  loadEnvFile('.env.local');
} catch {
  /* Environment can be supplied by the runner. */
}
const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
if (!key) throw new Error('Falta GEMINI_API_KEY.');
if (process.argv.includes('--models')) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': key },
  });
  const data = await response.json();
  console.log(
    JSON.stringify(
      (data.models || [])
        .filter(
          (m) => /flash/.test(m.name) && m.supportedGenerationMethods?.includes('generateContent'),
        )
        .map((m) => m.name),
    ),
  );
  process.exit();
}
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: 'Responde JSON con {"reply":"respuesta","productIds":[],"storeIds":[]}.' }],
      },
      contents: [{ role: 'user', parts: [{ text: 'Responde en español: conexión correcta.' }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(30000),
  },
);
const result = await response.json();
console.log(
  JSON.stringify({
    model,
    httpStatus: response.status,
    errorStatus: result.error?.status || null,
    message: result.error?.message?.replaceAll(key, '[redacted]').slice(0, 2000) || null,
    generated: !!result.candidates?.length,
  }),
);
if (!response.ok) process.exitCode = 1;
