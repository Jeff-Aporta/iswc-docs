/**
 * zod.ts — zod empaquetado para el navegador (el build lo publica con zod dentro: el navegador no
 * resuelve `import "zod"`). Los mensajes de error salen en español; solo ese locale entra al bundle.
 */
import { z } from 'zod';
export { z };
