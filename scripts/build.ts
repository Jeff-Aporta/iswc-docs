/**
 * build.ts — compila `src/**` a JavaScript plano en `dist/cdn/`.
 *
 * Sin bundler y sin Babel: cada `.ts` se transpila por separado (esbuild solo le quita los
 * tipos y minifica) y **se conserva la estructura de carpetas de `src/`**. Antes se aplanaba
 * todo a un único directorio y los `import` se reescribían; con el árbol espejo los
 * especificadores del fuente (`./sw-nav.js`, `../../js/config.js`) ya son correctos tal cual,
 * así que no hay reescritura que pueda equivocarse.
 *
 * Los `.css` hermanos se copian al mismo directorio que su módulo. Ese es el contrato de
 * `adoptCss(shadow, import.meta.url)`: `components/sw/sw-operation.js` resuelve su hoja en
 * `components/sw/sw-operation.css` sin que nadie la declare. Por eso el CSS nunca vive dentro
 * del `.ts` — se minifica aparte, se cachea aparte y se edita como CSS.
 *
 * Salida:
 *
 *   dist/cdn/
 *     all.min.js              bundle único de los componentes (lo que se consume por CDN)
 *     boot.js, hojas.js       scripts planos, síncronos en <head>
 *     components/sw/*.js|css  cada componente con su hoja al lado
 *     LLM.md                  contrato público para agentes
 *     js/*.js                 dominio (config, conn, openapi, …)
 *     js/*.d.ts               interfaces públicas (piezas JSON, convertidor, kit-tags)
 *     js/iss-swagger-doc.ts   mismo contrato, importable en Deno con tipos
 *     js/iss-swagger-md.min.js convertidor markdown en un solo ESM
 *     types/swagger.d.ts      tipos ambiente del visor
 */
import { readdirSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import esbuild from 'esbuild';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist', 'cdn');

/**
 * Ficheros con esa extensión bajo `dir`, recursivo.
 *
 * `docs/` vive fuera de `src/`, así que no hace falta excluirla: el sitio
 * documental es HTML+JS plano que consume `dist/cdn/` como cualquier otro
 * consumidor, no fuente que se compile.
 */
const listar = (dir: string, ext: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e): string[] => {
  const p = join(dir, e.name);
  if (e.isDirectory()) return listar(p, ext);
  return e.name.endsWith(ext) ? [p] : [];
});

const BARRIL = join(SRC, 'components', 'sw', 'all.ts');

/**
 * Sello del build, en UTC y al segundo.
 *
 * Lo consume `js/version.ts` y sirve para caducar la geometría guardada en `localStorage`: un
 * ancho de panel escrito por una versión anterior no debe sobrevivir a un cambio de layout, y
 * mucho menos a la corrección del fallo que lo escribió mal.
 */
/** Los unicos scripts de `src/js/` que no son modulos. */
const PLANOS = new Set(['boot.ts', 'hojas.ts']);

const SELLO = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const DEFINE = { __SW_BUILD__: JSON.stringify(SELLO) };

function fuentes() {
  const ts = [
    ...listar(join(SRC, 'components'), '.ts'),
    ...listar(join(SRC, 'js'), '.ts'),
  ].filter((a) => a !== BARRIL);
  const css = [
    ...listar(join(SRC, 'components'), '.css'),
  ];
  return { ts, css };
}

/** Ruta de salida espejo de la de entrada, creando el directorio si hace falta. */
function destino(archivo: string, ext?: string): string {
  const rel = relative(SRC, archivo);
  const salida = join(OUT, ext ? rel.replace(/\.[^.]+$/, ext) : rel);
  mkdirSync(dirname(salida), { recursive: true });
  return salida;
}

async function compilar() {
  const { ts, css } = fuentes();

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  for (const archivo of ts) {
    const resultado = await esbuild.build({
      entryPoints: [archivo],
      bundle: false,
      write: false,
      format: 'esm',
      target: 'es2022',
      minify: true,
      define: DEFINE,
      loader: { '.ts': 'ts' },
    });
    writeFileSync(destino(archivo, '.js'), resultado.outputFiles![0]!.text);
  }

  // El CSS no se transpila: se minifica y se copia junto a su módulo.
  for (const archivo of css) {
    const resultado = await esbuild.build({
      entryPoints: [archivo],
      bundle: false,
      write: false,
      minify: true,
      loader: { '.css': 'css' },
    });
    writeFileSync(destino(archivo), resultado.outputFiles![0]!.text);
  }

  // `all.min.js` — bundle único con todos los componentes del visor, en la raíz del CDN para
  // que la URL que se publica sea corta y estable. El CSS no se inlinea: el barril fija
  // `setCssBase('./components/sw/')` para que las hojas se sigan pidiendo de su carpeta.
  if (existsSync(BARRIL)) {
    const bundle = await esbuild.build({
      entryPoints: [BARRIL],
      bundle: true,
      write: false,
      format: 'esm',
      target: 'es2022',
      minify: true,
      define: DEFINE,
      loader: { '.ts': 'ts' },
    });
    writeFileSync(join(OUT, 'all.min.js'), bundle.outputFiles![0]!.text);
  }

  // `boot.ts` (tema) y `hojas.ts` (cache de CSS) son scripts planos: corren
  // sincronos en <head>, antes de que exista ningun modulo. Van a la raiz para
  // poder cargarlos con una sola linea.
  //
  // Se transpilan en vez de copiarse porque el fuente es TypeScript como todo
  // lo demas, pero la salida tiene que seguir siendo un script clasico: si
  // esbuild los envolviera como modulo, el navegador los diferiria y llegarian
  // tarde, que es justo lo que estos dos ficheros existen para evitar.
  const planos = listar(join(SRC, 'js'), '.ts').filter((f) => PLANOS.has(basename(f)));
  for (const archivo of planos) {
    const salida = await esbuild.transform(readFileSync(archivo, 'utf8'), {
      loader: 'ts',
      target: 'es2019',
      format: 'iife',
      legalComments: 'none',
    });
    writeFileSync(join(OUT, basename(archivo).replace(/\.ts$/, '.js')), salida.code);
  }

  const llm = join(SRC, 'cdn', 'LLM.md');
  if (existsSync(llm)) copyFileSync(llm, join(OUT, 'LLM.md'));

  mkdirSync(join(OUT, 'types'), { recursive: true });
  mkdirSync(join(OUT, 'js'), { recursive: true });
  copyFileSync(join(SRC, 'types', 'swagger.d.ts'), join(OUT, 'types', 'swagger.d.ts'));
  copyFileSync(join(SRC, 'js', 'iss-swagger-doc.ts'), join(OUT, 'js', 'iss-swagger-doc.ts'));

  // Declaraciones `.d.ts` de todo lo publicado: tsc por especificador npm (sin node_modules a mano).
  const tsc = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'npm:typescript@5.9.3/tsc', '-p', 'tsconfig.cdn.json'],
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!tsc.success) throw new Error('tsc -p tsconfig.cdn.json falló');

  const mdBundle = await esbuild.build({
    entryPoints: [join(SRC, 'js', 'iss-swagger-md.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2022',
    minify: true,
  });
  writeFileSync(join(OUT, 'js', 'iss-swagger-md.min.js'), mdBundle.outputFiles![0]!.text);

  const docs = await compilarDocs();

  return { ts: ts.length, css: css.length, planos: planos.length, docs };
}

/**
 * Transpila los scripts de `docs/` dejando el `.js` al lado del `.ts`.
 *
 * `docs/` no es fuente que se empaquete: es un sitio estatico que se sirve tal
 * cual y consume `dist/cdn/` como cualquier otro consumidor. Pero desde que
 * todo el proyecto es TypeScript, sus scripts tambien lo son, y el navegador
 * necesita el `.js`. Por eso la salida va *junto* al fuente y no a `dist/`: las
 * paginas siguen pidiendo `./manifest.js` y no hay que tocar ni una URL.
 *
 * Como `dist/`, los `.js` generados se versionan — el sitio se publica desde el
 * repositorio— y no se editan a mano: el fuente es el `.ts` hermano.
 */
async function compilarDocs() {
  const DOCS = join(ROOT, 'docs');
  if (!existsSync(DOCS)) return 0;

  // `preview-boot` corre como <script> clasico dentro del iframe, antes del
  // primer pintado, igual que `boot.ts` en la pagina principal. Los demas son
  // modulos ES y se importan entre ellos.
  const CLASICOS = new Set(['preview-boot.ts']);

  const fuentes = listar(DOCS, '.ts').filter((f) => !f.endsWith('.d.ts'));
  for (const archivo of fuentes) {
    const salida = await esbuild.transform(readFileSync(archivo, 'utf8'), {
      loader: 'ts',
      target: 'es2022',
      format: CLASICOS.has(basename(archivo)) ? 'iife' : 'esm',
      legalComments: 'none',
    });
    writeFileSync(archivo.replace(/\.ts$/, '.js'), salida.code);
  }
  return fuentes.length;
}

const { ts, css, planos, docs } = await compilar();
console.log(
  `dist/cdn: ${ts} módulos + ${css} hojas + ${planos} scripts planos + all.min.js`
  + ` · docs: ${docs} scripts · build ${SELLO}`,
);

if (!Deno.args.includes('--watch')) await esbuild.stop();
else {
  const { watch } = await import('node:fs');
  let pendiente: ReturnType<typeof setTimeout> | undefined;
  watch(SRC, { recursive: true }, (_e, archivo) => {
    if (!archivo || !/\.(ts|css|js|md)$/.test(archivo)) return;
    clearTimeout(pendiente);
    pendiente = setTimeout(async () => {
      try {
        const r = await compilar();
        console.log(`[watch] ${relative(SRC, join(SRC, archivo))} → ${r.ts} módulos + ${r.css} hojas`);
      } catch (e) {
        console.error('[watch]', e instanceof Error ? e.message : e);
      }
    }, 80);
  });
  console.log('[watch] esperando cambios en src/…');
}
