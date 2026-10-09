/**
 * tryit-body.ts — cuerpo JSON editable de «Probar».
 *
 * El texto inicial sale del ejemplo de la spec o de `x-iss-request-body`.
 * Sin ejemplo el editor queda vacío (`{ }`): un `$ref` sin resolver no debe
 * pintar el literal `null`.
 */

import { extractJsonExample, jsonPretty } from './openapi.js';

/* QUERY lleva cuerpo por definición: es su razón de ser frente a GET —filtrar con un JSON que no
   cabe en la query string—, así que «Probar» tiene que ofrecer el editor. */
export const BODY_HTTP_METHODS = new Set(['post', 'put', 'patch', 'query']);
export const EXT_REQUEST_BODY = 'x-iss-request-body';
export const EXT_REQUEST_BODY_EXAMPLES = 'x-iss-request-body-examples';

export type DocsBodyEjemplo = { id: string; label: string; icon?: string; example: unknown; };

export const opUsesRequestBody = (method: unknown): boolean =>
  BODY_HTTP_METHODS.has(String(method ?? '').toLowerCase());

export const shouldShowTryItBody = (op: DocsOp | undefined): boolean => opUsesRequestBody(op?.method);

const jsonMedia = (op: DocsOp | undefined): DocsMediaType | undefined =>
  op?.requestBody?.content?.['application/json'];

export function resolveTryItBodyExample(op: DocsOp | undefined): unknown {
  const fromSpec = extractJsonExample(jsonMedia(op));
  if (fromSpec !== undefined && fromSpec !== null) return fromSpec;

  const ext = (op?.[EXT_REQUEST_BODY] as Record<string, unknown> | undefined)?.example;
  if (ext !== undefined && ext !== null) return ext;

  return undefined;
}

/** Ejemplos con nombre: `x-iss-request-body-examples`, o los `examples` de la spec. */
export function resolveTryItBodyExamples(op: DocsOp | undefined): DocsBodyEjemplo[] {
  const ext = op?.[EXT_REQUEST_BODY_EXAMPLES];
  if (Array.isArray(ext) && ext.length) {
    return (ext as DocsBodyEjemplo[]).filter((i) => i && typeof i === 'object' && i.example !== undefined);
  }

  const examples = jsonMedia(op)?.examples;
  if (examples && typeof examples === 'object') {
    return Object.entries(examples)
      .filter(([, v]) => v && v.value !== undefined)
      .map(([id, v]) => ({ id, label: v.summary || id, example: v.value }));
  }
  return [];
}

export const formatBodyExample = (example: unknown): string =>
  example === undefined || example === null ? '{\n  \n}' : jsonPretty(example);

export const defaultTryItBodyText = (op: DocsOp | undefined): string =>
  formatBodyExample(resolveTryItBodyExample(op));

/** Valida el JSON del editor. `null` = correcto. */
export function validateBodyJson(text: string): string | null {
  const s = String(text ?? '').trim();
  if (!s) return null;
  try {
    JSON.parse(s);
    return null;
  } catch (e) {
    return `JSON inválido: ${(e as Error)?.message ?? e}`;
  }
}
