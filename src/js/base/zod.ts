/**
 * zod.ts — zod empaquetado para el navegador (el build lo publica con zod dentro: el navegador no
 * resuelve `import "zod"`). Los mensajes de error salen en español; solo ese locale entra al bundle.
 */
import { z } from 'zod';
import es from 'zod/v4/locales/es.js';

z.config(es());

export { z };
