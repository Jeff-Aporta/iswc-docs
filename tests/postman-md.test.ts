/**
 * postman-md.test.ts — conversión síncrona de <iswc-code> a fences (sin DOM).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/js/postman-md.ts'), 'utf8');

// Caja negra: se prueba el convertidor publicado, no una copia de su lógica.
const { convertIsCodeToFences } = await import('../dist/cdn/js/postman-md.js');

test('postman-md.ts exporta el pipeline de conversión', () => {
  assert.match(src, /export async function issDocMdForPostman/);
  assert.match(src, /export function convertIsCodeToFences/);
  assert.match(src, /export async function convertDiagramsToPngImgs/);
  assert.match(src, /iswc-flowchart/);
  assert.match(src, /image\/png/);
});

test('convertIsCodeToFences: body hijo → fence', () => {
  const md = `Antes\n<iswc-code lang="http" readonly compact>\nGET /api/info\nAccept: application/json\n</iswc-code>\nDespués`;
  const out = convertIsCodeToFences(md);
  assert.match(out, /```http\nGET \/api\/info\nAccept: application\/json\n```/);
  assert.doesNotMatch(out, /<iswc-code/);
});

test('convertIsCodeToFences: atributo value con &#10;', () => {
  const md = `<iswc-code lang="json" value="{&#10;  &quot;ok&quot;: true&#10;}"></iswc-code>`;
  const out = convertIsCodeToFences(md);
  assert.match(out, /```json\n\{\n  "ok": true\n\}\n```/);
});
