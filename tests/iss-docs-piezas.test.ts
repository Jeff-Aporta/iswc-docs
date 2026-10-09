/**
 * Piezas JSON ISWC Docs vs `iss-docs-piezas.ts`.
 * Si existe el repo PatyIA en el disco (dev), valida los ficheros reales.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { assertIssDocsPiezas } = await import('../dist/cdn/js/iss-docs-piezas.js');

const ISS = process.env.ISS_DOCS_DIR
  || join(ROOT, '..', '..', '..', 'PatyIA', 'api', 'src', 'utils', 'system', 'is-swagger');

test('assertIssDocsPiezas rechaza kind mezclado', () => {
  const errs = assertIssDocsPiezas({
    meta: { kind: 'config', version: 2, info: { title: 'x' } },
    paths: { kind: 'config', version: 2, paths: {} },
  });
  assert.ok(errs.some((m) => m.includes('meta.kind')));
  assert.ok(errs.some((m) => m.includes('paths.kind')));
});

test('piezas PatyIA is-swagger cumplen el contrato', (t) => {
  if (!existsSync(join(ISS, 'docs__meta.json'))) {
    t.skip('PatyIA/api no está al lado de iswc-docs');
    return;
  }
  const meta = JSON.parse(readFileSync(join(ISS, 'docs__meta.json'), 'utf8'));
  const paths = JSON.parse(readFileSync(join(ISS, 'docs__paths.json'), 'utf8'));
  const config = JSON.parse(readFileSync(join(ISS, 'docs__config.json'), 'utf8'));
  const errs = assertIssDocsPiezas({ meta, paths, config });
  assert.deepEqual(errs, [], errs.join('\n'));
});
