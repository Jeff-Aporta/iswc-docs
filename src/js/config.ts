/**
 * config.ts — de dónde sale la configuración del visor y cómo se carga la spec.
 *
 * Precedencia:
 *   1. Atributo/propiedad `doc` — JSON único quemado por el host (vía PatyIA / ISS).
 *   2. `conn.spec` / `?conn=` con `spec` — mismo documento vía payload conn.
 *   3. `paths.docs` / default `/docs?v=json` — un GET solo si no hay documento quemado.
 *   4. `?spec=<url>` / `config.specUrl` — demos OpenAPI sueltos.
 *
 * No existe `/system/swagger/config.json`.
 */

import { parseIsDocument } from './is-document.js';
import { normalizeConn, resolveConnConfig, resolveDocsJsonUrl } from './conn.js';
import type { DocsConn } from './conn.js';
import { isInsoftConfig, parseInsoftConfig } from './insoft-config.js';
import { clearJsonCache, fetchJsonCached } from './json-cache.js';
import { avisarLegado, GLOBAL_CONFIG_LEGADO, ID_CONFIG_LEGADO } from './legado.js';

export const DEFAULT_NS = 'ISA';

/** Normaliza a `https://host/…/api` (añade el `/api` si falta, sin query ni hash). */
export function normalizeApiBase(input: unknown): string {
  let s = String(input ?? '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return '';
  }
  let path = u.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/api')) path = path ? `${path}/api` : '/api';
  u.pathname = path;
  u.search = '';
  u.hash = '';
  return `${u.origin}${u.pathname}`;
}

/** apiBase del origen actual (`https://host/api`) cuando el host solo quema `doc`. */
function apiBaseDesdeOrigen(): string {
  if (typeof location === 'undefined') return '';
  try {
    return normalizeApiBase(location.origin);
  } catch {
    return '';
  }
}

/** `window.__DOCS_CONFIG__`, o el global legado si el host aún no se actualizó. */
function configDelHost(): DocsConfig | undefined {
  if (window.__DOCS_CONFIG__) return window.__DOCS_CONFIG__;
  const viejo = (window as unknown as Record<string, DocsConfig | undefined>)[GLOBAL_CONFIG_LEGADO];
  if (viejo) avisarLegado(`window.${GLOBAL_CONFIG_LEGADO}`, 'window.__DOCS_CONFIG__');
  return viejo;
}

function leerConfigEmbebida(): DocsConfig {
  if (typeof document === 'undefined') return {};
  let node = document.getElementById('docs-config');
  if (!node) {
    node = document.getElementById(ID_CONFIG_LEGADO);
    if (node) avisarLegado(`#${ID_CONFIG_LEGADO}`, '#docs-config');
  }
  if (!node?.textContent?.trim()) return {};
  try {
    const parsed = JSON.parse(node.textContent) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as DocsConfig) : {};
  } catch {
    return {};
  }
}

/**
 * Materializa un `spec` ya en memoria (sin red): InSoft `kind:"config"`, documento IS u OpenAPI.
 */
export function materializeEmbeddedSpec(config: DocsConfig, raw: unknown): { config: DocsConfig; spec: DocsSpec } | null {
  if (!raw || typeof raw !== 'object') return null;

  const desdeIs = parseIsDocument(raw);
  if (desdeIs) {
    const { spec: _omit, ...viewer } = desdeIs.config;
    return { config: { ...config, ...viewer }, spec: desdeIs.spec };
  }

  if (isInsoftConfig(raw)) {
    const built = parseInsoftConfig(raw, config.apiBase ?? '');
    return {
      config: { ...config, ...built.config, insoftSource: raw },
      spec: built.spec,
    };
  }

  const d = raw as DocsSpec;
  if (d?.paths || d?.openapi) {
    const { spec: _drop, ...viewer } = config;
    return { config: viewer, spec: d };
  }
  return null;
}

/**
 * Config base, antes de consultar la red.
 *
 * @param connDirecto  Conn del anfitrión (`conn=` / propiedad). Opcional.
 * @param docDirecto   Documento InSoft/OpenAPI quemado (`doc=` / propiedad). Preferido en ISS.
 */
export function resolveBootConfig(connDirecto?: DocsConn | null, docDirecto?: unknown): DocsConfig {
  const host = (typeof window !== 'undefined' ? configDelHost() : null) ?? {};
  const config: DocsConfig = { ...leerConfigEmbebida(), ...host };

  const sp = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
  const specParam = sp?.get('spec')?.trim();
  const api = sp?.get('api')?.trim();

  // `doc` gana: si llega documento quemado, `conn` (y su fetch) se ignoran.
  if (docDirecto !== undefined && docDirecto !== null) {
    config.spec = docDirecto as DocsConfig['spec'];
    delete config.specUrl;
    config.serverSelect = false;
    if (!config.apiBase) config.apiBase = apiBaseDesdeOrigen();
    if (specParam) config.specUrl = specParam;
    if (api) config.apiBase = normalizeApiBase(api);
    config.ns = config.ns || DEFAULT_NS;
    return config;
  }

  const conn = normalizeConn(connDirecto) ?? resolveConnConfig(typeof location !== 'undefined' ? location.search : null);

  if (conn) {
    config.apiBase = normalizeApiBase(conn.apiBase);
    if (conn.fixedServer) config.serverSelect = false;
    const brand = { ...(config.brand ?? {}) };
    if (conn.brand.title) brand.title = conn.brand.title;
    if (conn.brand.icon) brand.icon = conn.brand.icon;
    config.brand = brand;

    if (conn.spec !== undefined && conn.spec !== null) {
      config.spec = conn.spec as DocsConfig['spec'];
      delete config.specUrl;
    } else {
      const url = resolveDocsJsonUrl(config.apiBase, conn.paths);
      config.specUrl = url || undefined;
    }
  }

  if (specParam) config.specUrl = specParam;
  if (api) config.apiBase = normalizeApiBase(api);

  config.ns = config.ns || DEFAULT_NS;
  return config;
}

async function fetchJsonNetwork(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new Error(`No se pudo conectar con ${url}: ${(e as Error)?.message ?? e}`);
  }
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText || ''}`.trim());
  const text = await res.text();
  if (!text.trim()) throw new Error(`GET ${url} → respuesta vacía (${res.status})`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`GET ${url} → JSON inválido (${res.status}): ${preview}`);
  }
}

async function fetchJson(url: string, opts: { force?: boolean } = {}): Promise<unknown> {
  const { data } = await fetchJsonCached(url, fetchJsonNetwork, { force: opts.force });
  return data;
}

export async function loadViewerDocument(config: DocsConfig, opts: { force?: boolean } = {}): Promise<{ config: DocsConfig; spec: DocsSpec }> {
  const embebido = parseIsDocument(config);
  if (embebido) {
    const { spec: _omit, ...viewer } = embebido.config;
    return { config: { ...config, ...viewer }, spec: embebido.spec };
  }

  if (config.spec && typeof config.spec === 'object') {
    const materializado = materializeEmbeddedSpec(config, config.spec);
    if (materializado) return materializado;
    throw new Error('ISWC Docs: el `doc`/`spec` embebido no es documento InSoft, ni OpenAPI 3, ni documento IS.');
  }

  const url = String(config.specUrl ?? '').trim();
  if (!url) {
    throw new Error(
      'ISWC Docs: falta el documento. Quémalo en el atributo `doc` del componente, o deja el fallback `paths.docs` (default `/docs?v=json`).',
    );
  }

  if (opts.force) clearJsonCache(url);

  const data = await fetchJson(url, { force: opts.force });
  const materializado = materializeEmbeddedSpec({ ...config, specUrl: url }, data);
  if (materializado) {
    return { config: { ...materializado.config, specUrl: url }, spec: materializado.spec };
  }
  throw new Error(`El JSON de ${url} no es documento InSoft, ni OpenAPI 3, ni documento IS (sin \`paths\` ni \`openapi\`).`);
}

export async function loadSpec(config: DocsConfig): Promise<DocsSpec> {
  return (await loadViewerDocument(config)).spec;
}
