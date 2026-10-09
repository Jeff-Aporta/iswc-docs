/**
 * nomenclatura.test.ts — guardián del renombre isc-swagger → iswc-docs (S-NOM).
 *
 * S-NOM1  El código y las docs del proyecto hablan de `docs`/`docs-*`; los nombres `sw-*`, `Sw*`,
 *         `SW_*` y `swagger` solo sobreviven en la capa de legado (`src/js/legado.ts`) o como
 *         referencia a algo ajeno: el producto Swagger UI, rutas y carpetas de otros sistemas.
 * S-NOM2  Los nombres de archivo no llevan `sw-` ni `swagger`.
 *
 * Es un guardián de estructura (lee fuentes a propósito): vigila nombres, no comportamiento.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const RAIZ = join(import.meta.dirname!, '..');
const RAICES = ['src', 'docs', 'tests', 'scripts', 'index.html', 'LLM.md'];
const SALTAR = new Set(['vendor', 'fixtures', 'node_modules', '.git']);
const EXT = /\.(ts|js|mjs|css|scss|html|md|json)$/;

/** Referencias legítimas a algo que no es este visor. */
const AJENO = [
  /Swagger UI/g, // el producto con el que se compara
  /\/system\/swagger\/[\w{},-]+(\.json)?/g, // ruta del ISS que ya no existe (las docs la citan para decir que no se usa)
  /system['"], ['"]is-swagger/g, // carpeta del API de PatyIA
  /jeffaporta:swagger-[\w-]+/g, // claves de sesión viejas que auth.ts migra
  /\bis-swagger\b/g, // el visor React anterior (historia)
  /app: ['"]swagger['"]/g, // id de app que espera el login del orquestador (contrato ajeno)
];

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
  return out.filter((f) => !f.endsWith('legado.ts') && !f.endsWith('nomenclatura.test.ts'));
}

test('S-NOM1 — sin nombres sw-/Sw/SW_/swagger fuera del legado y de lo ajeno', () => {
  const VIEJO = /(?<!\w)(?:--)?sw[-:]\w|\bsw[A-Z]\w*|\bSw[A-Z]\w*|\bSW_\w+|[sS]wagger|SWAGGER/g;
  const sucios: string[] = [];
  for (const f of archivos()) {
    let t = readFileSync(f, 'utf8');
    for (const re of AJENO) t = t.replace(re, '');
    for (const m of t.matchAll(VIEJO)) sucios.push(`${relative(RAIZ, f).replace(/\\/g, '/')}: ${m[0]}`);
  }
  assert.deepEqual(sucios, [], `nomenclatura vieja:\n  ${sucios.slice(0, 40).join('\n  ')}`);
});

test('S-NOM2 — ningún archivo se llama sw-* ni *swagger*', () => {
  const malos = archivos().map((f) => basename(f)).filter((n) => /^sw-|swagger/i.test(n));
  assert.deepEqual(malos, []);
});
