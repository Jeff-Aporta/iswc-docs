/**
 * export.ts — descargas del visor: IS-Swagger (config InSoft), OpenAPI 3 y Postman.
 *
 * Todo se genera en el navegador desde la spec / config ya cargada. No hay endpoint
 * de exportación: el visor es 100 % front y una descarga que dependiera del host
 * dejaría de funcionar al abrir el HTML suelto.
 *
 * Postman: la description de cada request usa `x-iss-doc-md` convertido —
 * diagramas `is-*` → PNG transparente en `<img src="data:…">`, `<iswc-code>` → fences.
 */

import { listOperations, resolveServerUrl, jsonPretty } from './openapi.js';
import { buildIsDocument } from './is-document.js';
import { issDocMdForPostman, opDocMd } from './postman-md.js';

export type SwFormatoExport = { id: string; label: string; icon: string; filename: string; build(): string | Promise<string>; };

const slug = (s: unknown): string =>
  String(s ?? 'documento')
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-|-$/g, '') || 'documento';

/** OpenAPI 3.0 portable a partir del SwSpec interno del visor. */
export function toOpenApi30(spec: SwSpec): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: spec.info?.title ?? 'API',
      version: spec.info?.version ?? '1.0.0',
      ...(spec.info?.description ? { description: spec.info.description } : {}),
    },
    ...(spec.servers?.length ? { servers: spec.servers } : {}),
    ...(spec.tags?.length ? { tags: spec.tags } : {}),
    paths: spec.paths ?? {},
    ...(spec.components ? { components: spec.components } : {}),
  };
}

/* ── Postman ────────────────────────────────────────────────── */

/**
 * OpenAPI 3 → Postman Collection v2.1.
 *
 * Los `{param}` de OpenAPI se traducen a `:param` (la sintaxis de Postman) y
 * cada segmento va también en `path[]`, que es lo que Postman usa realmente
 * para construir la petición; `raw` solo se muestra en la barra de la app.
 *
 * La description de cada item es el markdown InSoft ya convertido para Postman
 * (PNG de diagramas + fences de código).
 */
export async function toPostmanCollection(spec: SwSpec, nombre?: string): Promise<Record<string, unknown>> {
  const base = resolveServerUrl(spec) || '{{baseUrl}}';
  const porTag = new Map<string, Record<string, unknown>[]>();

  for (const op of listOperations(spec)) {
    const tag = op.tags?.[0] ?? 'General';
    if (!porTag.has(tag)) porTag.set(tag, []);

    const query = (op.parameters ?? [])
      .filter((p) => p.in === 'query')
      .map((p) => ({
        key: p.name,
        value: p.example != null ? String(p.example) : '',
        description: p.description ?? '',
        disabled: !p.required,
      }));

    const headers = (op.parameters ?? [])
      .filter((p) => p.in === 'header')
      .map((p) => ({
        key: p.name,
        value: p.example != null ? String(p.example) : '',
        description: p.description ?? '',
      }));

    const jsonBody = op.requestBody?.content?.['application/json'];
    const ejemplo = jsonBody?.example ?? jsonBody?.schema?.example;
    if (jsonBody) headers.push({ key: 'Content-Type', value: 'application/json', description: '' });

    const segmentos = op.path.split('/').filter(Boolean).map((s) => s.replace(/^\{(.+)\}$/, ':$1'));
    const docMd = opDocMd(op as unknown as Record<string, unknown>);
    const description = docMd ? await issDocMdForPostman(docMd) : (op.description ?? op.summary ?? '');

    porTag.get(tag)!.push({
      name: op.summary || `${op.method.toUpperCase()} ${op.path}`,
      request: {
        method: op.method.toUpperCase(),
        header: headers,
        url: {
          raw: `${base}${op.path.replace(/\{(\w+)\}/g, ':$1')}`,
          host: [base],
          path: segmentos,
          query,
        },
        description,
        ...(jsonBody
          ? { body: { mode: 'raw', raw: jsonPretty(ejemplo ?? {}), options: { raw: { language: 'json' } } } }
          : {}),
      },
      response: [],
    });
  }

  return {
    info: {
      name: nombre || spec.info?.title || 'API',
      _postman_id: `is-swagger-${Date.now()}`,
      description: spec.info?.description ?? '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [...porTag.entries()].map(([name, item]) => ({ name, item })),
    variable: [{ key: 'baseUrl', value: base }],
  };
}

/* ── Formatos ofrecidos ─────────────────────────────────────── */

export function buildExportFormats(spec: SwSpec | null, config: SwConfig): SwFormatoExport[] {
  if (!spec) return [];
  const nombre = slug(config.exports?.openApiDownloadName || spec.info?.title);
  const isName = slug(config.exports?.isDownloadName || `${nombre}-is-swagger`);
  const postmanName = slug(config.exports?.postmanDownloadName || `${nombre}-postman`);
  const openApiName = slug(config.exports?.openApiDownloadName || `${nombre}-openapi`);
  const insoft = (config as SwConfig & { insoftSource?: unknown }).insoftSource;

  const formatos: SwFormatoExport[] = [
    {
      id: 'is-swagger',
      label: 'IS-Swagger (config)',
      icon: 'mdi:file-cog-outline',
      filename: `${isName}.json`,
      build: () => jsonPretty(insoft ?? buildIsDocument(config, spec)),
    },
    {
      id: 'openapi',
      label: 'OpenAPI 3',
      icon: 'mdi:api',
      filename: `${openApiName}.openapi.json`,
      build: () => jsonPretty(toOpenApi30(spec)),
    },
    {
      id: 'postman',
      label: 'Colección Postman',
      icon: 'mdi:send-outline',
      filename: `${postmanName}.postman_collection.json`,
      build: async () => jsonPretty(await toPostmanCollection(spec, spec.info?.title)),
    },
  ];
  return formatos;
}

/* ── Descarga ───────────────────────────────────────────────── */

export function descargarTexto(filename: string, contenido: string, mime = 'application/json'): void {
  const blob = new Blob([contenido], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Sin revocar, el blob queda retenido hasta recargar la página.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
