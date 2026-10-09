/**
 * iss-swagger-md.test.ts — JSON → markdown para LLM.md
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { issSwaggerToMarkdown, issDocToLlmMarkdown, buildIssSwaggerLlmViewHtml } = await import('../dist/cdn/js/iss-swagger-md.js');

test('issDocToLlmMarkdown quita flowchart y deja fence de is-code', () => {
  const md = issDocToLlmMarkdown('Hola <iswc-flowchart>x</iswc-flowchart> y <iswc-code lang="http" value="GET /x"></iswc-code>');
  assert.match(md, /visor HTML/);
  assert.match(md, /```http/);
  assert.doesNotMatch(md, /iswc-flowchart/);
});

test('issSwaggerToMarkdown lista método y ruta', () => {
  const md = issSwaggerToMarkdown({
    kind: 'config',
    version: 2,
    info: { title: 'Demo API', version: '1.0' },
    paths: {
      '/ping': { get: { summary: 'Salud · Ping', tags: ['Sistema'], doc: 'ping' } },
    },
    catalog: { docs: { ping: '## Salud · Ping\n\nVida del proceso.' } },
  });
  assert.match(md, /^# Demo API/m);
  assert.match(md, /`GET` `\/ping`/);
  assert.match(md, /Vida del proceso/);
});

test('buildIssSwaggerLlmViewHtml carga is-md-render y fetch LLM.md', () => {
  const html = buildIssSwaggerLlmViewHtml({
    kitCdn: 'https://cdn.example/dist/cdn',
    llmMdHref: '/api/LLM.md',
    title: 'Demo',
  });
  assert.match(html, /iswc-md-render/);
  assert.match(html, /loader\.min\.js/);
  assert.match(html, /\/api\/LLM\.md/);
});

test('PatyIA is-swagger produce markdown no vacío', (t) => {
  const dir = join(ROOT, '..', '..', '..', 'PatyIA', 'api', 'src', 'utils', 'system', 'is-swagger');
  if (!existsSync(join(dir, 'swagger__paths.json'))) {
    t.skip('PatyIA no está al lado');
    return;
  }
  const md = issSwaggerToMarkdown({
    meta: JSON.parse(readFileSync(join(dir, 'swagger__meta.json'), 'utf8')),
    paths: JSON.parse(readFileSync(join(dir, 'swagger__paths.json'), 'utf8')),
    config: JSON.parse(readFileSync(join(dir, 'swagger__config.json'), 'utf8')),
  });
  assert.match(md, /^# /);
  assert.match(md, /`QUERY`|`GET`|`POST`/);
});
