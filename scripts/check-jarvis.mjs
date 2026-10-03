import assert from 'node:assert/strict';
const base = process.env.PASEO_TEST_URL || 'http://localhost:3000';
for (const question of [
  'Busco un regalo por menos de Bs. 150.',
  '¿Qué promociones y eventos hay?',
  '¿Dónde queda Conecta y qué horario tiene?',
  '¿Existe la tienda Unicornio Galáctico?',
]) {
  const response = await fetch(base + '/api/paseo/jarvis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  console.log(
    JSON.stringify({
      question,
      status: response.status,
      reply: result.reply,
      error: result.error,
      model: result.model,
      products: result.products?.map((p) => p.name),
      stores: result.stores?.map((s) => s.name),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(result.source, 'gemini');
  assert(result.reply.length > 20);
}
