/**
 * CDN público: interfaces + LLM.md + convertidor empaquetado.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CDN = join(ROOT, 'dist', 'cdn');

test('dist/cdn/LLM.md es el contrato público de agentes', () => {
  const md = readFileSync(join(CDN, 'LLM.md'), 'utf8');
  assert.match(md, /assertIssSwaggerPiezas/);
  assert.match(md, /iss-swagger-doc/);
  assert.match(md, /issSwaggerToMarkdown/);
  assert.match(md, /`meta`/);
  assert.match(md, /`paths`/);
  assert.match(md, /`config`/);
  assert.match(md, /`general`/);
  assert.match(md, /cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/isc-swagger/);
  assert.doesNotMatch(md, /Flicker al cambiar pestaña/);
});

test('interfaces de piezas JSON viajan al CDN (js, d.ts, ts)', () => {
  const js = join(CDN, 'js', 'iss-swagger-doc.js');
  const dts = join(CDN, 'js', 'iss-swagger-doc.d.ts');
  const ts = join(CDN, 'js', 'iss-swagger-doc.ts');
  assert.ok(existsSync(js), 'iss-swagger-doc.js');
  assert.ok(existsSync(dts), 'iss-swagger-doc.d.ts');
  assert.ok(existsSync(ts), 'iss-swagger-doc.ts para Deno');
  const tipos = readFileSync(dts, 'utf8');
  assert.match(tipos, /export (?:interface|type) IssSwaggerMetaFile/);
  assert.match(tipos, /export (?:interface|type) IssSwaggerPathsFile/);
  assert.match(tipos, /export (?:interface|type) IssSwaggerCatalogFile/);
  assert.match(tipos, /export (?:interface|type) IssSwaggerGeneralFile/);
  assert.match(tipos, /export type IssSwaggerPiezas/);
  assert.match(tipos, /export declare function assertIssSwaggerPiezas/);
});

test('tipos ambiente del visor y kit-tags en el CDN', () => {
  assert.ok(existsSync(join(CDN, 'types', 'swagger.d.ts')));
  assert.match(readFileSync(join(CDN, 'types', 'swagger.d.ts'), 'utf8'), /interface SwSpec/);
  assert.ok(existsSync(join(CDN, 'js', 'kit-tags.d.ts')));
  assert.match(readFileSync(join(CDN, 'js', 'kit-tags.d.ts'), 'utf8'), /SW_KIT_TAGS/);
});

test('iss-swagger-md.min.js es un ESM autónomo', async () => {
  const min = join(CDN, 'js', 'iss-swagger-md.min.js');
  assert.ok(existsSync(min));
  const src = readFileSync(min, 'utf8');
  assert.doesNotMatch(src, /from\s*['"]\.\//);
  const { issSwaggerToMarkdown } = await import(pathToFileURL(min).href);
  const md = issSwaggerToMarkdown({
    kind: 'config',
    version: 2,
    info: { title: 'X' },
    paths: { '/z': { get: { summary: 'Z', tags: ['T'] } } },
  });
  assert.match(md, /`GET` `\/z`/);
});
