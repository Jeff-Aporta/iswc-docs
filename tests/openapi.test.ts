/**
 * openapi.test.ts — lectura de la spec.
 *
 * Se prueba contra `dist/cdn/` (el build), no contra `src/`: lo que rompe en
 * producción es el artefacto compilado, y así el aplanado de imports queda
 * cubierto de paso.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const {
  listOperations,
  groupOperationsByTag,
  sortGroupsBySpecOrder,
  operationRequiresBearer,
  resolveServerUrl,
  resolveParam,
  responseTone,
  extractJsonExample,
  opIdFromOperation,
  buildDocIndex,
} = await import('../dist/cdn/js/dominio/openapi.js');

const spec = {
  openapi: '3.0.3',
  servers: [{ url: 'https://api.example/{stage}', variables: { stage: { default: 'v1' } } }],
  tags: [
    { name: 'Zeta' },
    { name: 'Alfa', 'x-isa-subgroups': [{ id: 'b', name: 'B' }, { id: 'a', name: 'A' }] },
  ],
  components: {
    securitySchemes: { Bearer: { type: 'http', scheme: 'bearer' } },
    parameters: { Id: { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } },
  },
  paths: {
    '/a': {
      get: { tags: ['Alfa'], 'x-isa-subgroup': 'a', 'x-iss-doc-md': '# doc' },
      post: { tags: ['Alfa'], 'x-isa-subgroup': 'b', security: [{ Bearer: [] }] },
      // No es un método HTTP: no debe aparecer como operación.
      parameters: [],
    },
    '/z': { get: { tags: ['Zeta'], operationId: 'zeta' } },
  },
};

test('listOperations aplana path+method e ignora claves que no son métodos', () => {
  const ops = listOperations(spec);
  assert.equal(ops.length, 3);
  assert.deepEqual(
    ops.map((o) => `${o.method} ${o.path}`).sort(),
    ['get /a', 'get /z', 'post /a'],
  );
});

test('opIdFromOperation deriva un id estable cuando falta operationId', () => {
  assert.equal(opIdFromOperation({}, 'get', '/tercero/{id}/doc'), 'get_tercero_by_id_doc');
  assert.equal(opIdFromOperation({ operationId: 'propio' }, 'get', '/x'), 'propio');
});

test('los subgrupos respetan el orden declarado en el tag, no el de paths', () => {
  const alfa = groupOperationsByTag(spec).find((g) => g.name === 'Alfa');
  assert.deepEqual(alfa.subgroups.map((s) => s.id), ['b', 'a']);
});

test('un tag sin subgrupos declarados no inventa ninguno', () => {
  const zeta = groupOperationsByTag(spec).find((g) => g.name === 'Zeta');
  assert.deepEqual(zeta.subgroups, []);
});

test('sortGroupsBySpecOrder respeta el orden de spec.tags', () => {
  const orden = sortGroupsBySpecOrder(groupOperationsByTag(spec), spec).map((g) => g.name);
  assert.deepEqual(orden, ['Zeta', 'Alfa']);
});

test('operationRequiresBearer acepta el array estándar y las formas laxas de IS', () => {
  const post = listOperations(spec).find((o) => o.method === 'post');
  const get = listOperations(spec).find((o) => o.path === '/z');
  assert.equal(operationRequiresBearer(post, spec), true);
  assert.equal(operationRequiresBearer(get, spec), false);
  assert.equal(operationRequiresBearer({ security: 'bearer' }, spec), true);
  assert.equal(operationRequiresBearer({ security: 'none' }, spec), false);
  assert.equal(operationRequiresBearer({ security: false }, spec), false);
});

test('resolveServerUrl sustituye las variables por su default', () => {
  assert.equal(resolveServerUrl(spec), 'https://api.example/v1');
  assert.equal(resolveServerUrl({}), '');
});

test('resolveParam resuelve $ref contra components.parameters', () => {
  const p = resolveParam({ $ref: '#/components/parameters/Id' }, spec);
  assert.equal(p.name, 'id');
  assert.equal(p.in, 'path');
});

test('responseTone separa 401/403 del resto de 4xx', () => {
  assert.equal(responseTone(200), 'ok');
  assert.equal(responseTone(401), 'auth');
  assert.equal(responseTone(403), 'auth');
  assert.equal(responseTone(404), 'warn');
  assert.equal(responseTone(500), 'err');
  assert.equal(responseTone('default'), 'neutral');
});

test('extractJsonExample prefiere example, luego examples, luego schema.example', () => {
  assert.equal(extractJsonExample({ example: 1, examples: { a: { value: 2 } } }), 1);
  assert.equal(extractJsonExample({ examples: { a: { value: 2 } }, schema: { example: 3 } }), 2);
  assert.equal(extractJsonExample({ schema: { example: 3 } }), 3);
  assert.equal(extractJsonExample(undefined), undefined);
});

test('buildDocIndex indexa x-iss-doc-md por operationId', () => {
  const idx = buildDocIndex(spec);
  assert.equal(idx.get_a, '# doc');
  assert.equal(idx.zeta, undefined);
});
