/**
 * insoft-config.test.ts — `parseInsoftConfig` y la ruta `?conn=` contra el ISS real.
 *
 * El servidor devuelve `{kind: "config", version, info, viewer, protocol, tags,
 * paths, docs, catalog}`. Lo transformamos en `{config, spec}` para que el resto
 * del visor lo consuma sin saber que el origen no era OpenAPI.
 *
 * El test principal carga el fixture real capturado del staging:
 *   `tests/fixtures/insoft-config.sample.json`
 * para no depender de la red en CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SAMPLE = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'insoft-config.sample.json'), 'utf8'));

const { parseInsoftConfig, isInsoftConfig } = await import('../dist/cdn/js/dominio/insoft-config.js');

test('isInsoftConfig detecta el documento del ISS por kind+paths', () => {
  assert.equal(isInsoftConfig({ kind: 'config', version: 1, paths: {} }), true);
  assert.equal(isInsoftConfig({ openapi: '3.0.3', paths: {} }), false);
  assert.equal(isInsoftConfig(null), false);
  assert.equal(isInsoftConfig({ kind: 'iswc.docs', spec: {} }), false);
});

test('parseInsoftConfig arma spec sin el campo openapi (la UI no enseña OpenAPI)', () => {
  const { config, spec } = parseInsoftConfig(SAMPLE, 'https://ayudascp-ia-staging.azurewebsites.net/api');
  assert.equal(spec.openapi, undefined, 'el spec sintetizado no declara OpenAPI');
  assert.equal(spec.info!.title, 'API PatyIA');
  assert.equal(spec.info!.version, '1.0.0');
  assert.equal(spec.servers![0]!.url, 'https://ayudascp-ia-staging.azurewebsites.net/api');
});

test('los tags convierten `subgroups` a la extensión x-isa-subgroups', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const sistema = spec.tags!.find((t) => t.name === 'Sistema');
  assert.ok(sistema, 'tag Sistema presente');
  assert.ok(Array.isArray(sistema['x-isa-subgroups']), 'subgroups movido a x-isa-subgroups');
  assert.equal(sistema.subgroups, undefined);
  assert.equal(sistema['x-isa-subgroups'][0]!.id, 'configuracion');
});

test('las operaciones exponen x-iss-doc-md desde catalog.docs', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const op = spec.paths!['/sistema/cfg']?.get;
  assert.ok(op, 'GET /sistema/cfg debe existir');
  assert.ok(op['x-iss-doc-md'], 'markdown inyectado desde catalog.docs');
  assert.match(String(op['x-iss-doc-md']), /SYS_VALUES/);
});

test('x-iss-doc-md quita backticks sobre-escapados del catalog IS', () => {
  const raw = structuredClone(SAMPLE);
  raw.catalog.docs['sistema-cfg'] = '## Doc\n\n\\`\\`\\`http\nGET /api/x\n\\`\\`\\`\n';
  const { spec } = parseInsoftConfig(raw, 'https://h/api');
  const md = String(spec.paths!['/sistema/cfg']!.get['x-iss-doc-md']);
  assert.match(md, /```http\nGET \/api\/x\n```/);
  assert.equal(md.includes('\\`'), false, 'no debe quedar barra delante del backtick');
});

test('el template "ok" genera respuestas 200 con el envelope InSoft', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const op = spec.paths!['/sistema/cfg']!.get;
  const r200 = op.responses['200'];
  assert.ok(r200, 'debe haber respuesta 200');
  assert.match(r200.description, /SYS_VALUES.runtime/);
  assert.ok(r200.content['application/json']!.schema, 'schema del envelope');
  assert.ok(r200.content['application/json']!.example, 'example resuelto desde catalog.payloads');
});

test('el template "authForbidden" añade 401 y 403 además del 200', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const put = spec.paths!['/sistema/cfg']!.put;
  assert.ok(put.security, 'security debe estar declarado');
  assert.deepEqual(put.security, [{ Bearer: [] }]);
  assert.ok(put.responses['200'], '200');
  assert.ok(put.responses['401'], '401');
  assert.ok(put.responses['403'], '403');
});

test('requestBody.bodyKey resuelve el ejemplo desde catalog.requestBodies', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const put = spec.paths!['/sistema/cfg']!.put;
  assert.ok(put.requestBody, 'PUT con body');
  assert.ok(put.requestBody.content['application/json']!.schema, 'schema inline del body');
});

test('QUERY con parameters in:query los mueve al body, no a la URL', () => {
  const { spec } = parseInsoftConfig({
    kind: 'config',
    version: 2,
    info: { title: 'RAG', version: '1' },
    paths: {
      '/metricas': {
        query: {
          summary: 'Tiempos',
          parameters: [{ name: 'dias', in: 'query', schema: { type: 'integer', default: 30 } }],
        },
      },
    },
    catalog: { docs: {} },
  }, 'https://h');
  const op: any = spec.paths!['/metricas']!.query;
  assert.ok(op, 'debe seguir siendo método query, no get');
  assert.equal((op.parameters ?? []).some((p) => p.in === 'query'), false);
  assert.equal(op.requestBody.content['application/json']!.example.dias, 30);
});

test('QUERY con requestBody OpenAPI (content) no pierde el schema', () => {
  const { spec } = parseInsoftConfig({
    kind: 'config',
    version: 2,
    info: { title: 'RAG', version: '1' },
    paths: {
      '/metricas': {
        query: {
          summary: 'Tiempos',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { dias: { type: 'integer' } } },
                example: { dias: 30 },
              },
            },
          },
        },
      },
    },
    catalog: { docs: {} },
  }, 'https://h');
  const media: any = spec.paths!['/metricas']!.query.requestBody.content['application/json'];
  assert.equal(media.example.dias, 30);
  assert.ok(media.schema.properties.dias, 'el visor pintaba body vacío y dias como ?dias=');
});

test('el viewer del ISS se traduce a DocsConfig del visor', () => {
  const { config } = parseInsoftConfig(SAMPLE, 'https://h/api');
  assert.equal(config.brand.title, 'ISS PatyIA');
  assert.equal(config.brand.icon, 'mdi:robot-happy-outline');
  assert.equal(config.apiBase, 'https://h/api');
  assert.equal(config.serverSelect, false);
  assert.equal(config.auth.enabled, true);
  assert.equal(config.auth.loginKind, 'portal');
  assert.equal(config.auth.loginPath, '/api/auth/portal-login');
});

test('la spec sintetizada es válida para los módulos puros del visor', async () => {
  const { config, spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const { groupOperationsByTag } = await import('../dist/cdn/js/dominio/openapi.js');
  const grupos = groupOperationsByTag(spec);
  // El fixture real tiene ~30 paths; el cálculo real varía, pero los grupos
  // deben existir y contener operaciones.
  assert.ok(grupos.length >= 2, `se esperaban ≥2 grupos, hay ${grupos.length}`);
  const totalOps = grupos.reduce((n, g) => n + g.operations.length, 0);
  assert.ok(totalOps > 0, 'al menos una operación agrupada');
  // Cada operación tiene method y path (el visor los necesita sí o sí).
  for (const g of grupos) {
    for (const op of g.operations) {
      assert.ok(op.method, `${op.path} sin method`);
      assert.ok(op.path, 'sin path');
    }
  }
});

test('conn.spec InSoft del fixture termina con un spec listo (sin red a config.json)', async () => {
  const { readFileSync } = await import('node:fs');
  const sample = JSON.parse(readFileSync(new URL('./fixtures/insoft-config.sample.json', import.meta.url), 'utf8'));
  const cfgMod = await import('../dist/cdn/js/core/config.js');

  (globalThis as any).fetch = async () => {
    throw new Error('no debe haber fetch a /system/swagger/config.json');
  };

  const boot = cfgMod.resolveBootConfig({
    apiBase: 'https://ayudascp-ia-staging.azurewebsites.net/api',
    title: 'ISS PatyIA',
    icon: 'mdi:robot-happy-outline',
    fixedServer: true,
    spec: sample,
  });
  assert.equal(boot.apiBase, 'https://ayudascp-ia-staging.azurewebsites.net/api', 'apiBase del conn');

  const { spec, config } = await cfgMod.loadViewerDocument(boot);
  assert.ok(spec.paths && Object.keys(spec.paths).length > 0, 'spec materializada del JSON quemado');
  assert.equal(config.brand.title, 'ISS PatyIA');
  assert.equal(spec.openapi, undefined, 'la spec InSoft no lleva openapi');
});
/* ── servers: los declara el documento, el visor no quema hosts ─────────── */

test('viewer.servers del documento son los servers del spec', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://otro/api');
  assert.deepEqual(spec.servers, SAMPLE.viewer.servers);
});

test('sin viewer.servers queda solo el apiBase activo', () => {
  const raw = structuredClone(SAMPLE);
  delete raw.viewer.servers;
  const { spec } = parseInsoftConfig(raw, 'https://h/api/');
  assert.deepEqual(spec.servers, [{ url: 'https://h/api', description: 'Activo' }]);
});

test('el template raw sigue traduciendo items (SSE y HTML)', () => {
  const { spec } = parseInsoftConfig(SAMPLE, 'https://h/api');
  const post: any = spec.paths!['/conversacion']!.post;
  assert.match(post.responses['200'].description, /text\/event-stream/);
  assert.ok(post.responses['401'], '401 declarado en items');
  assert.match((spec.paths!['/docs']!.get as any).responses['200'].description, /text\/html/);
});

/* ── validarDocumento: el contrato Zod del consumidor ───────────────────── */

const { validarDocumento } = await import('../dist/cdn/js/dominio/documento.schema.js');

test('validarDocumento acepta el documento vigente', () => {
  assert.deepEqual(validarDocumento(SAMPLE), { ok: true, errores: [] });
});

test('validarDocumento tolera claves que el visor no lee (documentos viejos)', () => {
  const raw = structuredClone(SAMPLE);
  raw.protocol = { serverUrl: '/api' };
  raw.viewer.app = 'doc-viewer';
  assert.equal(validarDocumento(raw).ok, true);
});

test('validarDocumento señala cada problema con su ruta', () => {
  const raw = structuredClone(SAMPLE);
  raw.paths['/sistema/cfg'].get.doc = 'no-existe';
  raw.paths['/sistema/cfg'].put.responses.template = 'sse';
  raw.paths['/docs'].get.summary = '';
  const { ok, errores } = validarDocumento(raw);
  assert.equal(ok, false);
  const todo = errores.join('\n');
  assert.match(todo, /paths › \/sistema\/cfg › put › responses › template/);
  assert.match(todo, /paths › \/docs › get › summary/);
});

test('validarDocumento cruza las referencias al catálogo', () => {
  const raw = structuredClone(SAMPLE);
  raw.paths['/sistema/cfg'].get.doc = 'no-existe';
  raw.paths['/sistema/cfg'].get.subgroup = 'otro';
  raw.viewer.nav[0].tags = ['Fantasma'];
  const todo = validarDocumento(raw).errores.join('\n');
  assert.match(todo, /paths › \/sistema\/cfg › get › doc: «no-existe» no existe en catalog\.docs/);
  assert.match(todo, /paths › \/sistema\/cfg › get › subgroup/);
  assert.match(todo, /viewer › nav › 0 › tags › 0/);
});

test('un documento InSoft sin paths no se traga: el error trae la ruta', async () => {
  const cfgMod = await import('../dist/cdn/js/core/config.js');
  await assert.rejects(
    cfgMod.loadViewerDocument({ apiBase: 'https://h/api', spec: { kind: 'config', version: 1, info: { title: 'X' } } }),
    /no es válido:[\s\S]*paths/,
  );
});
