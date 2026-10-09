/**
 * pines.test.ts — guardián de pines congelados (S-PIN).
 *
 * S-PIN1  Todo recurso del kit iswc que el proyecto carga apunta a UN solo SHA de 40 hex.
 * S-PIN2  Ninguna referencia de CDN a un repo de Jeff-Aporta usa una ref mutable
 *         (@main, @master, @latest, SHA corto o rama en raw/githack).
 * S-PIN3  Las herramientas vendorizadas del kit llevan el mismo SHA que el pin del kit.
 *
 * Las URL canónicas del sitio (github.io) no son pines: identifican la página, no cargan código.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = join(import.meta.dirname!, '..');
const RAICES = ['index.html', 'src', 'docs', 'demo', 'view'];
const SALTAR = new Set(['node_modules', 'vendor', 'dist', '.git']);
const EXT = /\.(html|ts|js|mjs|json|css|scss|md)$/;

function archivos(): string[] {
  const out: string[] = [];
  const walk = (p: string) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const q = join(p, e.name);
      if (e.isDirectory()) { if (!SALTAR.has(e.name)) walk(q); } else if (EXT.test(e.name)) out.push(q);
    }
  };
  for (const r of RAICES) {
    const p = join(RAIZ, r);
    if (!existsSync(p)) continue;
    if (EXT.test(r)) out.push(p); else walk(p);
  }
  return out;
}

const TEXTOS = archivos().map((f) => ({ f: relative(RAIZ, f).replace(/\\/g, '/'), t: readFileSync(f, 'utf8') }));

test('S-PIN1 — el kit iswc se carga desde un único SHA de 40 hex', () => {
  const shas = new Set<string>();
  for (const { t } of TEXTOS) for (const m of t.matchAll(/is-webcomponents@([0-9a-f]{40})/g)) shas.add(m[1]!);
  assert.equal(shas.size, 1, `pines heterogéneos del kit: ${[...shas].join(', ')}`);
});

test('S-PIN2 — ninguna referencia de CDN a Jeff-Aporta usa una ref mutable', () => {
  const MUTABLE = [
    /cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/[\w.-]+@(?![0-9a-f]{40}\b)[\w.-]+/g,
    /cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/[\w.-]+\/(?!@)/g,
    /raw\.(?:githubusercontent|githack)\.com\/Jeff-Aporta\/[\w.-]+\/(?:main|master)\//g,
  ];
  const sucios: string[] = [];
  for (const { f, t } of TEXTOS) {
    for (const re of MUTABLE) for (const m of t.matchAll(re)) sucios.push(`${f}: ${m[0]}`);
  }
  assert.deepEqual(sucios, [], `refs mutables:\n  ${sucios.join('\n  ')}`);
});

test('S-PIN3 — las tools vendorizadas del kit van al mismo SHA que el pin', () => {
  const dir = join(RAIZ, 'src', 'vendor', 'is-webcomponents', 'tools');
  const pin = TEXTOS.map(({ t }) => t.match(/is-webcomponents@([0-9a-f]{40})/)?.[1]).find(Boolean);
  for (const f of readdirSync(dir)) {
    const cabecera = readFileSync(join(dir, f), 'utf8').split('\n')[0] ?? '';
    const sha = cabecera.match(/is-webcomponents@([0-9a-f]{40})/)?.[1];
    assert.equal(sha, pin, `${f} vendorizado de ${sha ?? '¿?'}; el pin del kit es ${pin}`);
  }
});
