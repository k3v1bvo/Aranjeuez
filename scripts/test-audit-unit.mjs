import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, Intl, Date };
  vm.runInNewContext(code, context);
  return context.exports;
}
const { levelFor, homeFor, ORDER_STEPS } = load('src/lib/paseo/model.ts');
for (const [points, level] of [
  [0, 'Bronce'],
  [199, 'Bronce'],
  [200, 'Plata'],
  [499, 'Plata'],
  [500, 'Oro'],
  [999, 'Oro'],
  [1000, 'Platino'],
])
  assert.equal(levelFor(points).name, level);
assert.equal(homeFor('empleado'), '/comercio');
assert.equal(homeFor('admin'), '/admin/overview');
assert.deepEqual(Array.from(ORDER_STEPS), [
  'pendiente',
  'en_preparacion',
  'listo_para_recoger',
  'entregado',
]);
const { speechText } = load('src/lib/paseo/speech.ts');
assert.equal(
  speechText('### Hola **María** 👋\nVisita [Café](https://example.test).'),
  'Hola María Visita Café.',
);
assert.equal(speechText('**Tus puntos:** 200 ⭐\n```js\nprivateCode()\n```'), 'Tus puntos: 200');
console.log('PASS: VIP boundaries, role landing pages, order lifecycle and readable speech text.');
