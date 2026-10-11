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
  assert.match(md, /assertIssDocsPiezas/);
  assert.match(md, /iss-docs-piezas/);
  assert.match(md, /issDocsToMarkdown/);
  assert.match(md, /`meta`/);
  assert.match(md, /`paths`/);
  assert.match(md, /`config`/);
  assert.match(md, /`general`/);
  assert.match(md, /cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/iswc-docs/);
  assert.doesNotMatch(md, /Flicker al cambiar pestaña/);
});

test('interfaces de piezas JSON viajan al CDN (js, d.ts, ts)', () => {
  const js = join(CDN, 'js', 'dominio', 'iss-docs-piezas.js');
  const dts = join(CDN, 'js', 'dominio', 'iss-docs-piezas.d.ts');
  const ts = join(CDN, 'js', 'dominio', 'iss-docs-piezas.ts');
  assert.ok(existsSync(js), 'iss-docs-piezas.js');
  assert.ok(existsSync(dts), 'iss-docs-piezas.d.ts');
  assert.ok(existsSync(ts), 'iss-docs-piezas.ts para Deno');
  const tipos = readFileSync(dts, 'utf8');
  assert.match(tipos, /export (?:interface|type) IssDocsMetaFile/);
  assert.match(tipos, /export (?:interface|type) IssDocsPathsFile/);
  assert.match(tipos, /export (?:interface|type) IssDocsCatalogFile/);
  assert.match(tipos, /export (?:interface|type) IssDocsGeneralFile/);
  assert.match(tipos, /export type IssDocsPiezas/);
  assert.match(tipos, /export declare function assertIssDocsPiezas/);
});

test('tipos ambiente del visor y kit-tags en el CDN', () => {
  assert.ok(existsSync(join(CDN, 'types', 'docs.d.ts')));
  assert.match(readFileSync(join(CDN, 'types', 'docs.d.ts'), 'utf8'), /interface DocsSpec/);
  assert.ok(existsSync(join(CDN, 'js', 'kit-tags.d.ts')));
  assert.match(readFileSync(join(CDN, 'js', 'kit-tags.d.ts'), 'utf8'), /DOCS_KIT_TAGS/);
});

test('iss-docs-md.min.js es un ESM autónomo', async () => {
  const min = join(CDN, 'js', 'dominio', 'iss-docs-md.min.js');
  assert.ok(existsSync(min));
  const src = readFileSync(min, 'utf8');
  assert.doesNotMatch(src, /from\s*['"]\.\//);
  const { issDocsToMarkdown } = await import(pathToFileURL(min).href);
  const md = issDocsToMarkdown({
    kind: 'config',
    version: 2,
    info: { title: 'X' },
    paths: { '/z': { get: { summary: 'Z', tags: ['T'] } } },
  });
  assert.match(md, /`GET` `\/z`/);
});

test('el schema Zod del documento viaja al CDN aparte del bundle (zod no infla all.min.js)', () => {
  for (const f of ['js/dominio/documento.schema.js', 'js/dominio/documento.schema.d.ts', 'js/base/zod.js']) {
    assert.ok(existsSync(join(CDN, f)), f);
  }
  assert.match(readFileSync(join(CDN, 'js', 'dominio', 'documento.schema.d.ts'), 'utf8'), /export declare function validarDocumento/);
  const bundle = readFileSync(join(CDN, 'all.min.js'), 'utf8');
  assert.ok(bundle.length < 160_000, `all.min.js creció a ${bundle.length} bytes`);
  assert.doesNotMatch(bundle, /\$ZodObject/, 'zod entró en all.min.js');
});
