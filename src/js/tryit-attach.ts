/**
 * tryit-attach.ts — adjuntos del «Probar».
 *
 * Quién muestra el picker: la operación lo declara (multipart, binario,
 * `tryitAttachments`, o schema con dataUrl/base64). El input no filtra MIME.
 */

import { resolveSchema } from './openapi.js';

export const EXT_TRYIT_ATTACHMENTS = 'x-iss-tryit-attachments';

type DocsTplCampo = { field?: string };

function contentOf(op: DocsOp | undefined): Record<string, DocsMediaType> {
  return (op?.requestBody?.content ?? {}) as Record<string, DocsMediaType>;
}

function schemaTieneArchivo(schema: DocsSchema | undefined, spec: DocsSpec | null | undefined, profundidad = 0): boolean {
  const s = resolveSchema(schema, spec, profundidad);
  if (!s || profundidad > 6) return false;
  const fmt = String(s.format ?? '');
  if (fmt === 'binary' || fmt === 'byte') return true;
  const props = s.properties ?? {};
  if ('dataUrl' in props || 'base64' in props) return true;
  for (const v of Object.values(props)) {
    if (schemaTieneArchivo(v, spec, profundidad + 1)) return true;
  }
  return schemaTieneArchivo(s.items, spec, profundidad + 1);
}

function plantillaAdjuntos(op: DocsOp | undefined, spec: DocsSpec | null | undefined): Record<string, unknown> | null {
  const raw = op?.tryitAttachments;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  const catalogo = spec?.[EXT_TRYIT_ATTACHMENTS] as { templates?: Record<string, unknown> } | undefined;
  if (typeof raw === 'string' && catalogo?.templates?.[raw] && typeof catalogo.templates[raw] === 'object') {
    return catalogo.templates[raw] as Record<string, unknown>;
  }
  return null;
}

/** Campos JSON donde caen los data URL. Sin partir por tipo de archivo. */
export function attachmentFieldNames(op: DocsOp | undefined, spec: DocsSpec | null | undefined): string[] {
  const tpl = plantillaAdjuntos(op, spec);
  const campos: string[] = [];
  if (tpl) {
    for (const v of Object.values(tpl)) {
      const field = (v as DocsTplCampo | undefined)?.field;
      if (typeof field === 'string' && field.trim()) campos.push(field.trim());
    }
  }
  return campos.length ? [...new Set(campos)] : ['archivos'];
}

export function opPrefersMultipart(op: DocsOp | undefined): boolean {
  return Object.keys(contentOf(op)).some((ct) => /multipart|octet-stream/i.test(ct));
}

export function opAllowsAttachments(op: DocsOp | undefined, spec: DocsSpec | null | undefined = null): boolean {
  if (!op) return false;
  if (op.tryitAttachments != null && op.tryitAttachments !== false) return true;
  if (opPrefersMultipart(op)) return true;
  for (const media of Object.values(contentOf(op))) {
    if (schemaTieneArchivo(media?.schema, spec)) return true;
  }
  return false;
}

function bytesABase64(bytes: Uint8Array): string {
  let bin = '';
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) bin += String.fromCharCode(...bytes.subarray(i, i + trozo));
  return btoa(bin);
}

async function leerComoDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || 'application/octet-stream';
  return `data:${mime};base64,${bytesABase64(bytes)}`;
}

function schemaJson(op: DocsOp | undefined, spec: DocsSpec | null | undefined): DocsSchema | undefined {
  return resolveSchema(contentOf(op)['application/json']?.schema, spec);
}

function parseCuerpo(texto: string): Record<string, unknown> {
  const s = texto.trim();
  if (!s) return {};
  try {
    const v = JSON.parse(s) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function packTryItBody(
  op: DocsOp | undefined,
  spec: DocsSpec | null | undefined,
  jsonText: string,
  files: File[],
): Promise<{ body: string | FormData; multipart: boolean }> {
  const texto = jsonText.trim() || '{}';
  if (!files.length) return { body: texto, multipart: false };

  if (opPrefersMultipart(op)) {
    const fd = new FormData();
    for (const f of files) fd.append('files', f, f.name);
    if (texto && texto !== '{}') fd.append('body', texto);
    return { body: fd, multipart: true };
  }

  const urls = await Promise.all(files.map(leerComoDataUrl));
  const obj = parseCuerpo(texto);
  for (const field of attachmentFieldNames(op, spec)) obj[field] = urls;

  const schema = schemaJson(op, spec);
  const props = schema?.properties ?? {};
  if (files.length === 1) {
    const f = files[0]!;
    const dataUrl = urls[0]!;
    if ('dataUrl' in props) obj.dataUrl = dataUrl;
    if ('base64' in props) obj.base64 = dataUrl.replace(/^data:[^;]+;base64,/i, '');
    if ('filename' in props) obj.filename = f.name;
    if ('mime' in props) obj.mime = f.type || 'application/octet-stream';
  }

  return { body: JSON.stringify(obj, null, 2), multipart: false };
}
