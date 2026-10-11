/**
 * documento.schema.ts — contrato Zod del documento InSoft `kind:"config"` que el visor consume.
 *
 * Tolerante a propósito: las claves que el visor no lee pasan (`.loose()`), así un documento viejo
 * sigue cargando. Lo que sí se exige es lo que el visor usa para pintar (summary, templates
 * conocidos, ids de catálogo que resuelven). El host que produce el documento (ISS) aplica su
 * propio schema estricto; este es el del consumidor.
 *
 * Módulo aparte del bundle: `config.ts` lo carga con `import()` solo al validar, así zod no entra
 * en `all.min.js`.
 */
import { z } from '../base/zod.js';

export const METODOS_DOC = ['get', 'post', 'put', 'patch', 'delete', 'query', 'options', 'head'] as const;
/** Templates de respuesta que `insoft-config.ts::buildResponses` sabe traducir. */
export const TEMPLATES_RESPUESTA = ['ok', 'auth', 'authForbidden', 'authNotFound', 'deleteEnvelope', 'raw'] as const;

const ZObjetoJson = z.record(z.string(), z.unknown());

export const ZDocServidor = z.object({ url: z.string().min(1), description: z.string().optional() }).loose();

export const ZDocNav = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  requiresSession: z.boolean().optional(),
}).loose();

export const ZDocViewer = z.object({
  ns: z.string().optional(),
  brand: z.object({ title: z.string().optional(), icon: z.string().optional() }).loose().optional(),
  auth: z.object({
    enabled: z.boolean().optional(),
    loginKind: z.string().optional(),
    loginPath: z.string().optional(),
    loginUrl: z.string().optional(),
    app: z.string().optional(),
    provider: z.string().optional(),
  }).loose().optional(),
  exports: z.record(z.string(), z.string()).optional(),
  nav: z.array(ZDocNav).optional(),
  servers: z.array(ZDocServidor).optional(),
}).loose();

export const ZDocTag = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  subgroups: z.array(z.object({ id: z.string().min(1), name: z.string().optional(), icon: z.string().optional() }).loose()).optional(),
}).loose();

export const ZDocRespuestas = z.object({
  template: z.enum(TEMPLATES_RESPUESTA),
  description: z.string().optional(),
  payload: z.string().optional(),
  schema: z.string().optional(),
  items: z.record(
    z.string().regex(/^\d{3}$/, 'el código de respuesta va en 3 dígitos'),
    z.object({ description: z.string().optional(), schema: ZObjetoJson.optional(), example: z.unknown().optional(), payload: z.string().optional() }).loose(),
  ).optional(),
}).loose();

export const ZDocOperacion = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  subgroup: z.string().optional(),
  security: z.enum(['bearer', 'Bearer', 'none']).optional(),
  doc: z.string().optional(),
  parameters: z.array(z.object({ name: z.string().min(1), in: z.enum(['path', 'query', 'header', 'cookie']) }).loose()).optional(),
  requestBody: z.object({ bodyKey: z.string().optional(), content: ZObjetoJson.optional(), schema: ZObjetoJson.optional() }).loose().optional(),
  responses: ZDocRespuestas.optional(),
  tryitConfirm: z.string().optional(),
  tryitAttachments: z.unknown().optional(),
}).loose();

export const ZDocCatalog = z.object({
  docs: z.record(z.string(), z.string()).optional(),
  payloads: ZObjetoJson.optional(),
  requestBodies: ZObjetoJson.optional(),
  schemas: z.record(z.string(), ZObjetoJson).optional(),
  tryitConfirm: ZObjetoJson.optional(),
  tryitAttachments: z.object({ templates: ZObjetoJson.optional() }).loose().optional(),
}).loose();

export const ZInsoftConfig = z.object({
  kind: z.literal('config'),
  version: z.number().optional(),
  info: z.object({ title: z.string().min(1), version: z.string().optional(), description: z.string().optional() }).loose().optional(),
  viewer: ZDocViewer.optional(),
  tags: z.array(ZDocTag).optional(),
  paths: z.record(z.string().startsWith('/', 'la ruta empieza por /'), z.partialRecord(z.enum(METODOS_DOC), ZDocOperacion)),
  catalog: ZDocCatalog.optional(),
}).loose().superRefine((d, ctx) => {
  // Integridad referencial: lo que un id nombra tiene que existir, o el visor pinta vacío sin avisar.
  const cat = d.catalog ?? {};
  const falta = (path: PropertyKey[], que: string, id: string) => ctx.addIssue({ code: 'custom', path, message: `«${id}» no existe en ${que}` });
  const tags = new Map((d.tags ?? []).map((t) => [t.name, new Set((t.subgroups ?? []).map((s) => s.id))]));
  (d.viewer?.nav ?? []).forEach((n, i) => (n.tags ?? []).forEach((t, j) => {
    if (d.tags && !tags.has(t)) falta(['viewer', 'nav', i, 'tags', j], 'tags[].name', t);
  }));
  for (const [ruta, ops] of Object.entries(d.paths)) {
    for (const [metodo, op] of Object.entries(ops ?? {})) {
      if (!op) continue;
      const p = (...resto: PropertyKey[]) => ['paths', ruta, metodo, ...resto];
      if (op.doc && !cat.docs?.[op.doc]) falta(p('doc'), 'catalog.docs', op.doc);
      if (op.requestBody?.bodyKey && !(op.requestBody.bodyKey in (cat.requestBodies ?? {}))) falta(p('requestBody', 'bodyKey'), 'catalog.requestBodies', op.requestBody.bodyKey);
      const r = op.responses;
      if (r?.payload && !(r.payload in (cat.payloads ?? {}))) falta(p('responses', 'payload'), 'catalog.payloads', r.payload);
      if (r?.template === 'deleteEnvelope' && r.schema && !cat.schemas?.[r.schema]) falta(p('responses', 'schema'), 'catalog.schemas', r.schema);
      for (const [codigo, item] of Object.entries(r?.items ?? {})) {
        if (item.payload && !(item.payload in (cat.payloads ?? {}))) falta(p('responses', 'items', codigo, 'payload'), 'catalog.payloads', item.payload);
      }
      if (op.tryitConfirm && !(op.tryitConfirm in (cat.tryitConfirm ?? {}))) falta(p('tryitConfirm'), 'catalog.tryitConfirm', op.tryitConfirm);
      if (typeof op.tryitAttachments === 'string' && !(op.tryitAttachments in (cat.tryitAttachments?.templates ?? {}))) {
        falta(p('tryitAttachments'), 'catalog.tryitAttachments.templates', op.tryitAttachments);
      }
      if (d.tags) {
        for (const [j, t] of (op.tags ?? []).entries()) {
          const subgrupos = tags.get(t);
          if (!subgrupos) falta(p('tags', j), 'tags[].name', t);
          else if (op.subgroup && subgrupos.size && !subgrupos.has(op.subgroup)) falta(p('subgroup'), `tags[«${t}»].subgroups`, op.subgroup);
        }
      }
    }
  }
});

export type TInsoftConfig = z.infer<typeof ZInsoftConfig>;

/** Resultado de validar: `errores` trae cada problema con su ruta (`paths › /x › get › doc: …`). */
export type TValidacionDocumento = { ok: boolean; errores: string[] };

export function validarDocumento(doc: unknown): TValidacionDocumento {
  const r = ZInsoftConfig.safeParse(doc);
  if (r.success) return { ok: true, errores: [] };
  return {
    ok: false,
    errores: r.error.issues.map((i) => `${i.path.length ? i.path.map(String).join(' › ') : '(raíz)'}: ${i.message}`),
  };
}
