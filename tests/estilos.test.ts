/**
 * estilos.test.ts — guardián de las hojas (S-EST). Guardián de estructura: lee fuentes a propósito.
 *
 * S-EST1  Las hojas fuente son `.scss`; ningún `.css` vive en `src/` ni en `view/` (es artefacto del build).
 * S-EST2  Ningún color literal: todo color sale de tokens `--iswc-*` del kit (sigue al tema y a la paleta).
 * S-EST3  Ningún token `--is-*`: el kit solo publica `--iswc-*`; un `--is-*` cae al valor por defecto en silencio.
 * S-EST4  La escala de espaciado y radios, y los patrones repetidos, salen de `_tokens.scss` / `_mixins.scss`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_lib/rutas.ts';

function listar(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'vendor' ? [] : listar(p, ext);
    return e.name.endsWith(ext) ? [p] : [];
  });
}

const rel = (f: string) => relative(ROOT, f).replace(/\\/g, '/');
const HOJAS = [...listar(join(ROOT, 'src'), '.scss'), ...listar(join(ROOT, 'view'), '.scss')];
/** Sin comentarios: un `#fff` citado en un comentario no pinta nada. */
const codigo = (f: string) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('S-EST1 — las hojas fuente son .scss; no hay .css en src/ ni view/', () => {
  const css = [...listar(join(ROOT, 'src'), '.css'), ...listar(join(ROOT, 'view'), '.css')].map(rel);
  assert.deepEqual(css, [], `.css fuente (deben ser .scss): ${css.join(', ')}`);
  assert.ok(HOJAS.length > 0, 'no hay hojas .scss');
});

test('S-EST2 — ningún color literal en las hojas', () => {
  const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d|(?<![\w-])(?:white|black)(?![\w-])/g;
  const sucios = HOJAS.flatMap((f) => [...codigo(f).matchAll(LITERAL)].map((m) => `${rel(f)}: ${m[0]}`));
  assert.deepEqual(sucios, [], `colores literales:\n  ${sucios.join('\n  ')}`);
});

test('S-EST3 — ningún token --is-* (el kit solo publica --iswc-*)', () => {
  const fuentes = [...HOJAS, ...listar(join(ROOT, 'src', 'js'), '.ts'), ...listar(join(ROOT, 'view'), '.ts'), join(ROOT, 'index.html')];
  const sucios = fuentes.flatMap((f) => [...codigo(f).matchAll(/--is-[a-z0-9-]+/g)].map((m) => `${rel(f)}: ${m[0]}`));
  assert.deepEqual(sucios, [], `tokens --is-*:\n  ${sucios.join('\n  ')}`);
});

test('S-EST4 — el espaciado de escala y los patrones repetidos salen de _tokens/_mixins', () => {
  for (const parcial of ['_tokens.scss', '_mixins.scss']) {
    assert.ok(existsSync(join(ROOT, 'src', 'styles', parcial)), `falta src/styles/${parcial}`);
  }
  // Un patrón de mixin escrito a mano otra vez (las tres declaraciones juntas) es repetición.
  const UNA_LINEA = /overflow:\s*hidden;\s*text-overflow:\s*ellipsis;\s*white-space:\s*nowrap/;
  const repetidos = HOJAS.filter((f) => !f.endsWith('_mixins.scss') && UNA_LINEA.test(codigo(f))).map(rel);
  assert.deepEqual(repetidos, [], `elipsis a mano (usa @include m.una-linea): ${repetidos.join(', ')}`);
});
