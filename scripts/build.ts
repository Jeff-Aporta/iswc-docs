/**
 * build.ts — compila `src/js/**` y `view/**` a JavaScript plano en `dist/cdn/` (patrón ISW).
 *
 * Sin bundler en runtime: cada `.ts` se transpila por separado (esbuild quita tipos y minifica) y
 * el árbol se espeja:
 *
 *   src/js/<ruta>.ts            → dist/cdn/js/<ruta>.js
 *   view/<vista>/<ruta>.ts      → dist/cdn/view/<vista>/<ruta>.js
 *   <ruta>.scss  (sass)         → dist/cdn/<misma ruta>.css   (staging en `.tmp-scss/`, como ISW)
 *
 * Las hojas quedan hermanas de su módulo: es el contrato de `adoptCss(shadow, import.meta.url)`.
 *
 * Excepciones, todas explícitas:
 *   - `boot.ts`, `hojas.ts`: scripts planos (IIFE) en la raíz de `dist/cdn/`; corren síncronos en
 *     `<head>` antes que ningún módulo.
 *   - `js/base/zod.ts`: se empaqueta con zod dentro (el navegador no resuelve `import "zod"`).
 *   - `js/components/docs/all.ts`: barril → `dist/cdn/all.min.js` (bundle de compatibilidad).
 *   - `js/dominio/iss-docs-md.ts`: además, `iss-docs-md.min.js` en un solo ESM para hosts Deno/Workers.
 *   - Las vistas importan `../../../src/js/...` en fuente; en `dist` esa ruta es `../../../js/...`.
 *     Y al revés: el shell (`src/js/...`) llega a `view/` con un `../` más que en `dist`.
 *
 * `.d.ts` de todo lo publicado (tsc a `.tmp-dts/` y se espeja igual que los `.js`).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import esbuild from 'esbuild';
import * as sass from 'sass';

const ROOT = join(import.meta.dirname!, '..');
const SRC = join(ROOT, 'src');
const JS = join(SRC, 'js');
const VIEW = join(ROOT, 'view');
const OUT = join(ROOT, 'dist', 'cdn');
const STAGING = join(ROOT, '.tmp-scss');
const DTS = join(ROOT, '.tmp-dts');

const BARRIL = join(JS, 'components', 'docs', 'all.ts');
const ZOD = join(JS, 'base', 'zod.ts');
const MD = join(JS, 'dominio', 'iss-docs-md.ts');
const PLANOS = new Set(['boot.ts', 'hojas.ts']);
/** Fuentes que no se publican como módulo (barriles y tipos). */
const NO_MODULO = (f: string) => f === BARRIL || f.endsWith('.d.ts') || f.endsWith('.test.ts') || f.includes(`${sep}tests${sep}`) || f.includes(`${sep}stagehand${sep}`);

/** Sello del build (UTC al segundo): caduca la geometría persistida (`js/core/version.ts`). */
const SELLO = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const DEFINE = { __DOCS_BUILD__: JSON.stringify(SELLO) };

const listar = (dir: string, ext: string): string[] =>
  !existsSync(dir) ? [] : readdirSync(dir, { withFileTypes: true }).flatMap((e): string[] => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name.startsWith('.') || e.name === 'node_modules' ? [] : listar(p, ext);
    return e.name.endsWith(ext) ? [p] : [];
  });

/** Ruta publicada de una fuente (`src/js/x.ts` → `dist/cdn/js/x.js`, `view/a/x.ts` → `dist/cdn/view/a/x.js`). */
function destino(fuente: string, ext?: string): string {
  const rel = fuente.startsWith(VIEW) ? join('view', relative(VIEW, fuente)) : relative(SRC, fuente);
  const salida = join(OUT, ext ? rel.replace(/\.[^.]+$/, ext) : rel);
  mkdirSync(dirname(salida), { recursive: true });
  return salida;
}

/** En una vista, `../../../src/js/` (fuente) es `../../../js/` (publicado). */
const reescribirVista = (codigo: string): string => codigo.replace(/(['"`])((?:\.\.\/)+)src\/js\//g, '$1$2js/');
/** Desde `src/js/`, la raíz del repo está un nivel más arriba que `dist/cdn/` desde `js/`: `../../../../view/` → `../../../view/`. */
const reescribirSrc = (codigo: string): string => codigo.replace(/(['"`])\.\.\/((?:\.\.\/)+)view\//g, '$1$2view/');
const reescribir = (fuente: string, codigo: string): string => (fuente.startsWith(VIEW) ? reescribirVista(codigo) : reescribirSrc(codigo));

/** SCSS → `.tmp-scss/<ruta>.css` (expandido; esbuild minifica después). */
function compilarScss(): string[] {
  rmSync(STAGING, { recursive: true, force: true });
  const salidas: string[] = [];
  for (const scss of [...listar(SRC, '.scss'), ...listar(VIEW, '.scss')]) {
    if (basename(scss).startsWith('_')) continue; // parciales: solo se importan
    const css = sass.compile(scss, {
      style: 'expanded',
      loadPaths: [dirname(scss), join(SRC, 'styles'), SRC, VIEW],
    }).css;
    const staged = join(STAGING, relative(ROOT, scss)).replace(/\.scss$/, '.css');
    mkdirSync(dirname(staged), { recursive: true });
    writeFileSync(staged, css);
    salidas.push(staged);
  }
  return salidas;
}

/** Fuente real de una hoja en staging: `.tmp-scss/src/js/x.css` → `src/js/x.css`. */
const fuenteDeStaging = (staged: string) => join(ROOT, relative(STAGING, staged));

async function compilar() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const ts = [...listar(JS, '.ts'), ...listar(VIEW, '.ts')].filter((f) => !NO_MODULO(f));
  const planos = ts.filter((f) => dirname(f) === JS && PLANOS.has(basename(f)));
  const modulos = ts.filter((f) => !planos.includes(f));

  for (const f of modulos) {
    const r = await esbuild.build({
      entryPoints: [f],
      bundle: f === ZOD,
      write: false,
      format: 'esm',
      target: 'es2022',
      minify: true,
      define: DEFINE,
      loader: { '.ts': 'ts' },
    });
    const codigo = r.outputFiles![0]!.text;
    writeFileSync(destino(f, '.js'), reescribir(f, codigo));
  }

  for (const f of planos) {
    const r = await esbuild.transform(readFileSync(f, 'utf8'), { loader: 'ts', target: 'es2019', format: 'iife', legalComments: 'none' });
    writeFileSync(join(OUT, basename(f).replace(/\.ts$/, '.js')), r.code);
  }

  // Hojas: SCSS compilado + `.css` que aún no se haya migrado (los hermanos de componentes y estilos).
  const scss = compilarScss();
  const cssSueltos = [...listar(join(JS, 'components'), '.css'), ...listar(VIEW, '.css')];
  for (const [entrada, fuente] of [...scss.map((s) => [s, fuenteDeStaging(s)] as const), ...cssSueltos.map((c) => [c, c] as const)]) {
    const r = await esbuild.build({ entryPoints: [entrada], bundle: false, write: false, minify: true, loader: { '.css': 'css' } });
    writeFileSync(destino(fuente.replace(/\.scss$/, '.css')), r.outputFiles![0]!.text);
  }

  // `all.min.js`: todos los componentes en un módulo (compatibilidad). El barril fija la raíz de hojas.
  const bundle = await esbuild.build({ entryPoints: [BARRIL], bundle: true, write: false, format: 'esm', target: 'es2022', minify: true, define: DEFINE });
  writeFileSync(join(OUT, 'all.min.js'), bundle.outputFiles![0]!.text);

  const md = await esbuild.build({ entryPoints: [MD], bundle: true, write: false, format: 'esm', target: 'es2022', minify: true });
  writeFileSync(destino(MD, '.min.js'), md.outputFiles![0]!.text);

  // Contrato público para agentes y hosts Deno.
  copyFileSync(join(SRC, 'cdn', 'LLM.md'), join(OUT, 'LLM.md'));
  mkdirSync(join(OUT, 'types'), { recursive: true });
  copyFileSync(join(SRC, 'types', 'docs.d.ts'), join(OUT, 'types', 'docs.d.ts'));
  copyFileSync(join(JS, 'dominio', 'iss-docs-piezas.ts'), destino(join(JS, 'dominio', 'iss-docs-piezas.ts')));

  await declaraciones();
  const docs = await compilarDocs();
  return { modulos: modulos.length, planos: planos.length, hojas: scss.length + cssSueltos.length, docs };
}

/** `.d.ts` de todo lo publicado: tsc a `.tmp-dts/` y se espeja como los `.js`. */
async function declaraciones() {
  rmSync(DTS, { recursive: true, force: true });
  const tsc = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'npm:typescript@5.9.3/tsc', '-p', 'tsconfig.cdn.json'],
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!tsc.success) throw new Error('tsc -p tsconfig.cdn.json falló');
  for (const d of listar(DTS, '.d.ts')) {
    const rel = relative(DTS, d);
    const fuente = join(ROOT, rel.replace(/\.d\.ts$/, '.ts'));
    if (!rel.startsWith(`src${sep}js`) && !rel.startsWith('view')) continue;
    const salida = destino(fuente, '.d.ts');
    const texto = readFileSync(d, 'utf8');
    writeFileSync(salida, reescribir(fuente, texto));
  }
  rmSync(DTS, { recursive: true, force: true });
}

/**
 * Transpila los scripts de `docs/` dejando el `.js` al lado del `.ts` (sitio estático que consume
 * `dist/cdn/` como cualquier host). `preview-boot` corre como `<script>` clásico.
 */
async function compilarDocs() {
  const DOCS = join(ROOT, 'docs');
  const CLASICOS = new Set(['preview-boot.ts']);
  const fuentes = listar(DOCS, '.ts').filter((f) => !f.endsWith('.d.ts'));
  for (const f of fuentes) {
    const r = await esbuild.transform(readFileSync(f, 'utf8'), {
      loader: 'ts',
      target: 'es2022',
      format: CLASICOS.has(basename(f)) ? 'iife' : 'esm',
      legalComments: 'none',
    });
    writeFileSync(f.replace(/\.ts$/, '.js'), r.code);
  }
  return fuentes.length;
}

const r = await compilar();
console.log(`dist/cdn: ${r.modulos} módulos + ${r.hojas} hojas + ${r.planos} scripts planos + all.min.js · docs: ${r.docs} scripts · build ${SELLO}`);

if (!Deno.args.includes('--watch')) await esbuild.stop();
else {
  const { watch } = await import('node:fs');
  let pendiente: ReturnType<typeof setTimeout> | undefined;
  for (const dir of [SRC, VIEW]) {
    watch(dir, { recursive: true }, (_e, archivo) => {
      if (!archivo || !/\.(ts|scss|css|md)$/.test(archivo)) return;
      clearTimeout(pendiente);
      pendiente = setTimeout(async () => {
        try {
          const x = await compilar();
          console.log(`[watch] ${archivo} → ${x.modulos} módulos + ${x.hojas} hojas`);
        } catch (e) {
          console.error('[watch]', e instanceof Error ? e.message : e);
        }
      }, 80);
    });
  }
  console.log('[watch] esperando cambios en src/ y view/…');
}
