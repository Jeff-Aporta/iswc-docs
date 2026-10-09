/**
 * curl.ts — muestra de petición cURL para una operación.
 *
 * El panel derecho de `docs-minidoc` enseña la llamada antes de que nadie pulse «Probar»: es lo
 * primero que copia quien viene a integrar. Se construye desde la operación y el servidor
 * activo, sin tocar el DOM ni la red.
 *
 * No usa los valores que el usuario haya escrito en el formulario de pruebas: esto documenta la
 * forma de la llamada, no reproduce un intento concreto.
 */

import { extractJsonExample, resolveParams } from './openapi.js';

/** Comilla simple para shell POSIX: `'` se cierra, se escapa y se reabre. */
function comillar(valor: string): string {
  return `'${String(valor).replace(/'/g, `'\\''`)}'`;
}

/** Valor de muestra de un parámetro: el declarado, si no el default, si no el tipo. */
export function ejemploDeParam(p: DocsParam): string {
  const enSchema = p.schema as { example?: unknown; default?: unknown; type?: string; enum?: unknown[] } | undefined;
  const directo = (p as { example?: unknown }).example ?? enSchema?.example ?? enSchema?.default;
  if (directo !== undefined && directo !== null && directo !== '') return String(directo);
  const primerEnum = Array.isArray(enSchema?.enum) ? enSchema?.enum[0] : undefined;
  if (primerEnum !== undefined) return String(primerEnum);
  const tipo = String(enSchema?.type ?? 'string');
  if (tipo === 'integer' || tipo === 'number') return '0';
  if (tipo === 'boolean') return 'false';
  return `<${p.name}>`;
}

/** Sustituye `{param}` en la ruta por su valor de muestra. */
function rutaConValores(path: string, params: DocsParam[]): string {
  return path.replace(/\{([^}]+)\}/g, (m, nombre: string) => {
    const p = params.find((x) => x.name === nombre && x.in === 'path');
    return p ? encodeURIComponent(ejemploDeParam(p)) : m;
  });
}

export type MuestraCurl = {
  /** Comando completo, ya partido en líneas con `\` de continuación. */
  texto: string;
  /** Cada línea suelta, para pintarla con resaltado sin volver a partir el texto. */
  lineas: string[];
};

/**
 * Comando cURL de la operación contra `serverBase`.
 *
 * `requiereBearer` decide si aparece la cabecera `Authorization`; el token nunca se incrusta,
 * se deja el placeholder `<token>` — una muestra que se copia a un chat o a un ticket no debe
 * arrastrar credenciales de nadie.
 */
export function buildCurl(
  op: DocsOp | null | undefined,
  spec: DocsSpec | null | undefined,
  serverBase: string,
  requiereBearer = false,
  cuerpoOverride?: unknown,
): MuestraCurl {
  if (!op) return { texto: '', lineas: [] };

  const params = resolveParams(op, spec);
  const base = String(serverBase ?? '').replace(/\/+$/, '');
  const ruta = rutaConValores(op.path, params);

  const query = op.method === 'query'
    ? ''
    : params
      .filter((p) => p.in === 'query' && p.required)
      .map((p) => `${encodeURIComponent(String(p.name))}=${encodeURIComponent(ejemploDeParam(p))}`)
      .join('&');

  const url = `${base}${ruta}${query ? `?${query}` : ''}`;
  const metodo = op.method.toUpperCase();

  const lineas = [`curl --request ${metodo} \\`, `  --url ${comillar(url)}`];

  if (requiereBearer) lineas.push(`  --header ${comillar('Authorization: Bearer <token>')}`);

  for (const p of params.filter((x) => x.in === 'header' && x.required)) {
    lineas.push(`  --header ${comillar(`${p.name}: ${ejemploDeParam(p)}`)}`);
  }

  const cuerpo =
    cuerpoOverride !== undefined
      ? cuerpoOverride
      : extractJsonExample(op.requestBody?.content?.['application/json']);
  if (cuerpo !== undefined && cuerpo !== null) {
    lineas.push(`  --header ${comillar('Content-Type: application/json')}`);
    lineas.push(`  --data ${comillar(JSON.stringify(cuerpo, null, 2))}`);
  }

  // La `\` sobra en la última línea: pegada en una shell dejaría el prompt esperando más.
  for (let i = 0; i < lineas.length - 1; i++) {
    const linea = lineas[i] ?? '';
    if (!linea.endsWith('\\')) lineas[i] = `${linea} \\`;
  }

  return { texto: lineas.join('\n'), lineas };
}
