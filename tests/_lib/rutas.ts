/**
 * Rutas de los componentes para los guardianes de estructura.
 *
 * Fuente única: `src/js/kit-tags.ts` (el mismo registro que usa el loader). Un test no vuelve a
 * listar carpetas ni a adivinar dónde vive un componente.
 */
import { join } from 'node:path';
import { DOCS_TAGS, rutaComponente, VIEW_TAGS } from '../../src/js/kit-tags.ts';

export const ROOT = join(import.meta.dirname!, '..', '..');
export const DIST = join(ROOT, 'dist', 'cdn');
export const BASE_COMPONENTE = join(ROOT, 'src', 'js', 'base', 'componente.ts');
export const BARRIL = join(ROOT, 'src', 'js', 'components', 'docs', 'all.ts');

/** Todos los componentes propios, transversales y de vista. */
export const COMPONENTES: string[] = [...DOCS_TAGS, ...Object.values(VIEW_TAGS).flat()];

/** Carpeta fuente (`src/js/components/docs` o `view/<vista>/components`). */
function carpetaFuente(tag: string): string {
  const pub = rutaComponente(tag);
  if (!pub) throw new Error(`${tag} no está registrado en kit-tags.ts`);
  return pub.startsWith('view/') ? pub : join('src', pub);
}

/** Archivo fuente: `ext` = 'ts' | 'scss' | 'json' | 'md'. */
export const fuente = (tag: string, ext: string): string => join(ROOT, carpetaFuente(tag), `${tag}.${ext}`);

/** Artefacto publicado en `dist/cdn`: `ext` = 'js' | 'css' | 'd.ts'. */
export const publicado = (tag: string, ext: string): string => join(DIST, rutaComponente(tag)!, `${tag}.${ext}`);
