/**
 * docs.test.ts — que los LLM.md no mientan.
 *
 * Los MD de este repo son contrato, no adorno: un agente los lee y actúa. Un
 * MD desactualizado es peor que no tenerlo, porque se obedece igual. Este
 * archivo caza el par de cosas que se desincronizan sin que nada se rompa:
 * componentes que existen y no están documentados, reglas que el código ya no
 * cumple, y patrones prohibidos que vuelven a aparecer.
 *
 * No comprueba redacción. Solo hechos verificables contra el código.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');
const SW = join(SRC, 'components', 'sw');

const leer = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const componentes = readdirSync(SW)
  .filter((f) => f.endsWith('.ts') && f !== '_shared.ts' && f !== 'all.ts')
  .map((f) => f.replace(/\.ts$/, ''));

/* ── Existencia y enlaces ───────────────────────────────────── */

const PAGINAS = [
  'LLM.md',
  'src/LLM.md',
  'src/js/LLM.md',
  'src/components/LLM.md',
  'src/components/sw/LLM.md',
  'src/cdn/LLM.md',
  'docs/LLM.md',
];

test('la jerarquía de LLM.md está completa', () => {
  const faltan = PAGINAS.filter((p) => !existsSync(join(ROOT, p)));
  assert.deepEqual(faltan, [], `faltan páginas de documentación: ${faltan.join(', ')}`);
});

test('los enlaces relativos entre LLM.md resuelven a un archivo real', () => {
  // Un enlace roto en un MD que se lee por CDN no da 404 visible: el agente
  // simplemente no encuentra la página y se inventa el contrato.
  const rotos = [];
  for (const pagina of PAGINAS) {
    const dir = join(ROOT, pagina, '..');
    for (const m of leer(pagina).matchAll(/\]\((\.[^)]+\.md)\)/g)) {
      const destino = join(dir, m[1]);
      if (!existsSync(destino)) rotos.push(`${pagina} → ${m[1]}`);
    }
  }
  assert.deepEqual(rotos, [], `enlaces rotos: ${rotos.join(', ')}`);
});

/* ── El catálogo refleja el código ──────────────────────────── */

test('el catálogo sw/LLM.md lista todos los componentes y ninguno de más', () => {
  const catalogo = leer('src/components/sw/LLM.md');
  const documentados = new Set(
    [...catalogo.matchAll(/^\| `<(sw-[a-z-]+)>`/gm)].map((m) => m[1]),
  );

  const sinDocumentar = componentes.filter((c) => !documentados.has(c));
  assert.deepEqual(sinDocumentar, [], `componentes fuera del catálogo: ${sinDocumentar.join(', ')}`);

  const fantasmas = [...documentados].filter((d) => !componentes.includes(d));
  assert.deepEqual(fantasmas, [], `el catálogo documenta tags que ya no existen: ${fantasmas.join(', ')}`);
});

test('la lista de componentes con #render() manual es exacta', () => {
  // Es la lista que decide quién tiene que llamar `adoptCss` y `precargarCss`
  // a mano. Si se queda corta, alguien se queda sin estilos; si sobra, la doc
  // manda hacer trabajo que la fábrica ya hace.
  const manualesReales = componentes
    .filter((c) => !/crearComponente</.test(readFileSync(join(SW, `${c}.ts`), 'utf8')))
    .sort();

  for (const pagina of ['src/components/LLM.md', 'src/components/sw/LLM.md']) {
    const texto = leer(pagina);
    const declarados = manualesReales.filter((c) => texto.includes(`\`${c}\``));
    assert.deepEqual(
      declarados,
      manualesReales,
      `${pagina} no nombra todos los componentes con render manual: ${manualesReales.join(', ')}`,
    );
  }
});

/* ── Reglas que el código debe seguir cumpliendo ────────────── */

test('el patrón de flicker ya descartado no vuelve al código', () => {
  // Conservar el `<link>` a través de `replaceChildren` fue el primer intento y
  // no bastaba: aplicar un `<link>` nunca es síncrono. Si reaparece, es una
  // regresión, y además contradice lo que dicen los MD.
  const ofensores = [];
  for (const f of readdirSync(SW).filter((f) => f.endsWith('.ts'))) {
    const src = readFileSync(join(SW, f), 'utf8');
    if (/querySelector\(\s*['"]link\[rel="stylesheet"\]['"]\s*\)/.test(src) && f !== '_shared.ts') {
      ofensores.push(f);
    }
    if (/replaceChildrenKeepCss/.test(src)) ofensores.push(`${f} (replaceChildrenKeepCss)`);
  }
  assert.deepEqual(ofensores, [], `vuelve el patrón de <link> preservado: ${ofensores.join(', ')}`);
});

test('_shared.ts no reimplementa formatos que ya trae el kit', () => {
  // `fecha()` con su propio Intl y `formatBytes()` con su tabla de unidades
  // vivieron aquí. El kit trae `<iswc-format-date>` y `<iswc-format-bytes>`, y
  // entran con all.min.js: dos formatos que podían divergir en silencio.
  const src = readFileSync(join(SW, '_shared.ts'), 'utf8');
  assert.ok(!/Intl\.(DateTimeFormat|NumberFormat)/.test(src), '_shared.ts vuelve a formatear a mano');
  assert.ok(!/export\s+(const|function)\s+(fecha|formatBytes|formatNumber)\b/.test(src),
    '_shared.ts vuelve a exportar un formateador propio');
});

test('la deuda documentada frente al kit sigue siendo la que dice el MD', () => {
  // La tabla de `src/LLM.md` admite tres barras de pestañas a mano. Si aparece
  // una cuarta, o si alguna se migra a `<iswc-tab-group>`, la tabla miente.
  const conTablist = componentes.filter((c) =>
    /role="tablist"/.test(readFileSync(join(SW, `${c}.ts`), 'utf8')),
  );
  assert.deepEqual(
    conTablist.sort(),
    ['sw-minidoc-code', 'sw-nav', 'sw-operation'],
    'cambió qué componentes pintan pestañas a mano: actualiza la tabla de deuda en src/LLM.md',
  );

  const deuda = leer('src/LLM.md');
  assert.match(deuda, /iswc-tab-group/, 'src/LLM.md ya no documenta la deuda de pestañas');
});

/* ── El inventario de tests se documenta solo ───────────────── */

test('la tabla de testing de LLM.md nombra cada archivo de tests', () => {
  const tabla = leer('LLM.md');
  const archivos = readdirSync(join(ROOT, 'tests')).filter((f) => f.endsWith('.test.ts'));
  const sinFila = archivos.filter((f) => !tabla.includes(f));
  assert.deepEqual(sinFila, [], `tests sin fila en la tabla de LLM.md: ${sinFila.join(', ')}`);
});

test('los tests corren contra dist/cdn, no contra el fuente', () => {
  // Lo que se vigila es contra QUE se prueba, no la extension: importar de
  // `src/` probaria codigo que nadie sirve y dejaria pasar fallos del build.
  // (Hasta el 1-sep-2026 este guardian exigia ademas que los tests fueran
  // `.mjs`, porque no habia forma de ejecutar TypeScript. Node 22 borra los
  // tipos al cargar, asi que esa parte dejo de tener sentido.)
  const archivos = readdirSync(join(ROOT, 'tests')).filter((f) => /\.test\.ts$/.test(f));
  assert.notDeepEqual(archivos, [], 'no se encontro ningun tests/*.test.ts');

  const desdeSrc = archivos.filter((f) => /from '\.\.\/src\//.test(leer(`tests/${f}`)));
  assert.deepEqual(desdeSrc, [], `tests que importan del fuente en vez de dist/cdn: ${desdeSrc.join(', ')}`);
});
