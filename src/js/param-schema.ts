/**
 * param-schema.ts — del `schema` de un parámetro a cómo se edita en pantalla.
 *
 * El saneado es por tipo declarado, no por `type="number"` del input nativo:
 * el kit usa `iswc-input`, y dejar que el navegador decida da comportamientos
 * distintos por locale (coma vs punto decimal).
 */

export const paramSchemaType = (schema: DocsSchema | undefined): string => schema?.type ?? '';

/** Recorta lo que el tipo no admite mientras se escribe (integer: solo dígitos). */
export function sanitizeParamInputValue(schema: DocsSchema | undefined, raw: unknown): string {
  const t = paramSchemaType(schema);
  const s = String(raw ?? '');
  if (t === 'integer') return s.replace(/\D/g, '');
  if (t === 'number') {
    let out = '';
    let punto = false;
    for (const ch of s) {
      if (ch >= '0' && ch <= '9') out += ch;
      else if (ch === '.' && !punto) {
        punto = true;
        out += ch;
      } else if (ch === '-' && !out) out += ch;
    }
    return out;
  }
  return s;
}

/** `inputmode` del teclado móvil. */
export function paramInputMode(schema: DocsSchema | undefined): 'numeric' | 'decimal' | 'text' {
  const t = paramSchemaType(schema);
  if (t === 'integer') return 'numeric';
  if (t === 'number') return 'decimal';
  return 'text';
}

/** Valores cerrados del parámetro, si los declara (pinta un `iswc-select`). */
export function paramEnum(schema: DocsSchema | undefined): string[] {
  const raw = schema?.enum;
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((v) => String(v));
}

/** Etiqueta corta del tipo: `array<string>`, `string(date-time)`, `integer`. */
export function paramTypeLabel(schema: DocsSchema | undefined): string {
  if (!schema) return '';
  const t = schema.type ?? '';
  if (t === 'array') return `array<${schema.items?.type ?? 'any'}>`;
  return schema.format ? `${t}(${schema.format})` : t;
}

/** Valor inicial: `example` → `default` → primer `enum` → vacío. */
export function paramInitialValue(param: DocsParam): string {
  if (param.example != null) return String(param.example);
  const schema = param.schema;
  if (schema?.default != null) return String(schema.default);
  const opciones = paramEnum(schema);
  return opciones[0] ?? '';
}
