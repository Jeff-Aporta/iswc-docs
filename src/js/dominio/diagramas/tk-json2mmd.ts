// @ts-nocheck — portado literal desde el .mjs de documentales.
/**
 * tk-json2mmd.mjs — traduce a Mermaid los diagramas que llegan de la API en
 * formato JSON estructurado.
 *
 * En tks-system conviven dos formas de guardar un diagrama:
 *
 *   1. `kind: "diagram"`  — ya trae `payload.source` en Mermaid. No hay nada
 *      que traducir; solo se limpia.
 *   2. `kind: "sequence"` — trae `payload.sequence` como objeto
 *      (`actors` / `groups` / `messages`), que es lo que dibuja el componente
 *      `<iswc-sequence-diagram>` del kit. Ese objeto NO es Mermaid, así que en
 *      un `.md` no se puede pintar: hay que traducirlo. De eso va este módulo.
 *
 * Decisiones de traducción, y por qué:
 *
 * - **Las etiquetas se limpian de marcado propio del visor.** Los `label`
 *   traen plantillas `{{iconify: {...}}}` para pintar iconos en el
 *   componente; en Mermaid eso es ruido ilegible. Se quitan.
 * - **`;` y `|` se sustituyen por coma.** En Mermaid el `;` termina la
 *   sentencia AUNQUE vaya entre comillas, y el `|` es separador de actor:
 *   una etiqueta con `data:audio/webm;codecs=opus` rompe el diagrama entero
 *   con `Parse error ... got NEWLINE`. No hay escape posible.
 * - **Los `desc` largos van como `Note over`**, no en la flecha: la flecha es
 *   la acción, la nota es la explicación. Metidos en el `label` producen un
 *   diagrama ilegible de tan ancho.
 * - **Los `groups` se traducen a `rect`** con su color, que es lo más cercano
 *   en Mermaid a las bandas de color del componente original.
 */

/** Marcado del visor que no significa nada fuera de él. */
const limpiarEtiqueta = (s) => String(s ?? '')
  .replace(/\{\{iconify:\s*\{[^}]*\}\s*\}\}/g, '')   // {{iconify: {icon: "...", color: "..."}}}
  .replace(/\*\*(.+?)\*\*/g, '$1')                    // negrita markdown
  .replace(/`([^`]+)`/g, '$1')                        // código en línea
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Texto seguro para Mermaid.
 * `;` corta la sentencia y `|` separa actores — ninguno se puede escapar, así
 * que se sustituyen. `"` rompe las etiquetas entrecomilladas.
 */
const textoSeguro = (s) => limpiarEtiqueta(s)
  .replace(/[;|]/g, ',')
  .replace(/"/g, "'")
  .replace(/\r?\n/g, ' ');

/** Id de actor válido: Mermaid no admite guiones ni espacios en el id. */
const idSeguro = (s) => String(s ?? '').replace(/[^A-Za-z0-9_]/g, '_') || 'A';

/** Flecha según el tipo de mensaje del componente. */
const flecha = (kind) => (kind === 'async' ? '-->>' : '->>');

/**
 * `payload.sequence` (objeto de `<iswc-sequence-diagram>`) -> `sequenceDiagram`.
 * Devuelve '' si el objeto no tiene lo mínimo para dibujar algo.
 */
export function sequence2mmd(seq) {
  if (!seq || !Array.isArray(seq.actors) || !Array.isArray(seq.messages)) return '';
  if (!seq.actors.length || !seq.messages.length) return '';

  const lineas = ['sequenceDiagram', '    autonumber'];

  for (const a of seq.actors) {
    const palabra = a.kind === 'actor' ? 'actor' : 'participant';
    const etiqueta = textoSeguro(a.label) || idSeguro(a.id);
    lineas.push(`    ${palabra} ${idSeguro(a.id)} as ${etiqueta}`);
  }
  lineas.push('');

  const grupos = new Map((seq.groups || []).map((g) => [g.id, g]));
  let grupoAbierto = null;

  const cerrarGrupo = () => {
    if (grupoAbierto) {
      lineas.push('    end');
      grupoAbierto = null;
    }
  };

  for (const m of seq.messages) {
    if (m.group !== grupoAbierto) {
      cerrarGrupo();
      const g = grupos.get(m.group);
      if (g) {
        // `hue` del componente -> color HSL, para conservar la banda de color.
        const color = typeof g.hue === 'number' ? `hsl(${g.hue}, 70%, 94%)` : 'rgb(245,247,255)';
        lineas.push(`    rect ${color}`);
        lineas.push(`    Note over ${idSeguro(seq.actors[0].id)}: ${textoSeguro(g.name)}`);
        grupoAbierto = m.group;
      }
    }

    const de = idSeguro(m.from);
    const a = idSeguro(m.to);
    const etiqueta = textoSeguro(m.label) || 'paso';
    // `self` en el componente = mensaje de un actor a sí mismo.
    lineas.push(`    ${de}${flecha(m.kind)}${m.kind === 'self' ? de : a}: ${etiqueta}`);

    const desc = textoSeguro(m.desc);
    if (desc) {
      const sobre = de === a || m.kind === 'self' ? de : `${de},${a}`;
      lineas.push(`    Note over ${sobre}: ${desc}`);
    }
  }
  cerrarGrupo();

  return lineas.join('\n');
}

/**
 * Cualquier bloque de diagrama -> fuente Mermaid.
 * `diagram` ya viene en Mermaid; `sequence` se traduce. Cualquier otro, ''.
 */
export function bloqueDiagrama2mmd(bloque) {
  const p = bloque?.payload || {};
  if (bloque?.kind === 'diagram') {
    const src = String(p.source || '').replace(/\r\n/g, '\n').trim();
    return src;
  }
  if (bloque?.kind === 'sequence') return sequence2mmd(p.sequence);
  return '';
}
