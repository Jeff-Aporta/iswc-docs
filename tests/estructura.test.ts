/**
 * estructura.test.ts — guardianes de las reglas del proyecto.
 *
 * Todos cazan el mismo tipo de fallo: **dos fuentes que deberían decir lo
 * mismo se separan sin que nada se rompa**. El build sigue verde, el navegador
 * pinta, y el componente se queda sin CSS o fuera de la galería.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SW = join(ROOT, 'src', 'components', 'docs');
const DIST = join(ROOT, 'dist', 'cdn');
const DIST_SW = join(DIST, 'components', 'docs');
const DOCS = join(ROOT, 'docs');

const componentes = readdirSync(SW)
  .filter((f) => f.endsWith('.ts') && f !== '_shared.ts' && f !== 'all.ts')
  .map((f) => basename(f, '.ts'));

test('cada componente tiene su .css hermano', () => {
  // El error que este proyecto no repite: CSS embebido en el .ts. Sin el
  // hermano, `adoptCss` pide un 404 y el componente se pinta sin estilos.
  for (const c of componentes) {
    assert.ok(existsSync(join(SW, `${c}.css`)), `falta src/components/docs/${c}.css`);
  }
});

test('ningún .ts lleva CSS embebido', () => {
  for (const c of [...componentes, '_shared']) {
    const src = readFileSync(join(SW, `${c}.ts`), 'utf8');
    assert.ok(
      !/\/\*\s*css\s*\*\/\s*`/.test(src),
      `${c}.ts tiene un bloque \`/* css */\`: el CSS va en el .css hermano`,
    );
    assert.ok(
      !/(const|let)\s+\w*[cC]ss\w*\s*(:\s*string\s*)?=\s*`/.test(src),
      `${c}.ts declara CSS en una constante: el CSS va en el .css hermano`,
    );
  }
});

test('cada componente adopta su CSS y declara el nombre de su hoja', () => {
  // El nombre explícito es lo que hace que el bundle `sw.all.js` funcione: sin
  // él, `import.meta.url` vale lo mismo para todos los módulos del bundle y la
  // hoja derivada (`sw.all.css`) no existe. Componente sin estilos, sin error.
  for (const c of componentes) {
    const src = readFileSync(join(SW, `${c}.ts`), 'utf8');
    const esManual = !src.includes('crearComponente<');

    if (esManual) {
      assert.ok(
        src.includes(`adoptCss(this.#root, import.meta.url, '${c}')`),
        `${c}.ts no adopta su hoja nombrándola '${c}'`,
      );
    } else {
      assert.ok(
        src.includes('crearComponente<') && src.includes(`  '${c}',`),
        `${c}.ts no pasa '${c}' como nombre de hoja a crearComponente`,
      );
    }
  }
});

test('el build deja .js y .css hermanos en dist/cdn/components/sw', () => {
  for (const c of componentes) {
    assert.ok(existsSync(join(DIST_SW, `${c}.js`)), `falta dist/cdn/components/docs/${c}.js`);
    assert.ok(existsSync(join(DIST_SW, `${c}.css`)), `falta dist/cdn/components/docs/${c}.css`);
  }
});

test('todo import relativo de dist/cdn resuelve a un archivo real', () => {
  // El dist es espejo de src/, así que los import con carpetas (`../../js/x.js`) son
  // correctos — antes se aplanaba y había que reescribirlos. Lo que importa ahora es que
  // apunten a algo que exista: un 404 impide que el módulo entero se ejecute, y no se ve
  // hasta que el navegador pide el archivo.
  const rotos = [];
  const recorrer = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { recorrer(p); continue; }
      if (!e.name.endsWith('.js')) continue;
      const src = readFileSync(p, 'utf8');
      for (const m of src.matchAll(/(?:from|import)"(\.[^"]*)"/g)) {
        if (!existsSync(join(dirname(p), m[1]))) rotos.push(`${relative(DIST, p)} → ${m[1]}`);
      }
    }
  };
  recorrer(DIST);
  assert.deepEqual(rotos, [], `imports rotos en dist/cdn: ${rotos.join(', ')}`);
});

test('index.html carga el bundle que trae todos los componentes del shell', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  // Un custom element que no se importa no hace upgrade: el tag queda en el DOM sin shadow y
  // la vista sale vacía, sin ningún error en consola. Antes se listaban los 16 módulos aquí;
  // ahora entra el bundle, y de que el bundle los traiga todos se encarga el test del barril.
  assert.ok(html.includes('dist/cdn/all.min.js'), 'index.html no carga dist/cdn/all.min.js');
  assert.ok(
    !/dist\/cdn\/docs-[a-z-]+\.js/.test(html),
    'index.html vuelve a listar módulos sueltos: con el bundle sobran y se cargarían dos veces',
  );
});

test('el barril all.ts incluye todos los componentes', () => {
  const src = readFileSync(join(SW, 'all.ts'), 'utf8');
  for (const c of componentes) {
    assert.ok(src.includes(`./${c}.js`), `all.ts no importa ${c}.js`);
  }
});

test('cada componente tiene entrada en el manifest y su página en disco', async () => {
  const { default: manifest, componentes: enManifest, paginas } = await import('../docs/manifest.js');
  const tags = new Set(enManifest.map((m) => m.tag));

  for (const c of componentes) {
    assert.ok(tags.has(c), `${c} no está en docs/manifest.js`);
  }
  // Las páginas de prosa no son componentes: no deben colarse en `componentes`.
  const fantasmas = [...tags].filter((t) => !componentes.includes(t));
  assert.deepEqual(fantasmas, [], `el manifest lista componentes que no existen: ${fantasmas.join(', ')}`);

  // Toda entrada —prosa o componente— tiene que apuntar a un archivo real.
  for (const entrada of manifest) {
    assert.ok(existsSync(join(DOCS, entrada.page)), `falta docs/${entrada.page}`);
  }
  // Y el índice necesita una portada: es la entrada por defecto del shell.
  assert.ok(paginas.some((p) => p.tag === 'inicio'), 'el manifest no declara la portada `inicio`');
});

test('las páginas de docs resuelven dist/cdn con la profundidad correcta', () => {
  // `docs/previews/` y `docs/paginas/` → dos niveles hasta la raíz. Con más o
  // con menos, el import apunta a un directorio inexistente y la página sale
  // en blanco sin ningún error visible.
  for (const sub of ['previews', 'paginas']) {
    const dir = join(DOCS, sub);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const m of src.matchAll(/(?:from|import|src=|href=)\s*['"]((?:\.\.\/)+(?:dist|src|demo)\/[^'"]*)['"]/g)) {
        assert.ok(
          m[1]!.startsWith('../../'),
          `${sub}/${f}: ruta con profundidad incorrecta → ${m[1]}`,
        );
        assert.ok(
          !m[1]!.startsWith('../../../'),
          `${sub}/${f}: sobra un nivel → ${m[1]}`,
        );
      }
    }
  }
});
