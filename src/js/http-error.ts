/**
 * http-error.ts — mensajes legibles para respuestas HTTP fallidas.
 *
 * Un `401` a secas no le dice nada a quien está probando un endpoint. Aquí se
 * compone: etiqueta del estado, detalle que devolvió la API, URL y una pista
 * accionable según el contexto (login, PUT de config, lookup…).
 */

const STATUS_LABELS: Record<number, string> = {
  400: 'Solicitud incorrecta',
  401: 'No autorizado',
  403: 'Acceso prohibido',
  404: 'Ruta no encontrada',
  405: 'Método no permitido',
  408: 'Tiempo de espera agotado',
  409: 'Conflicto',
  413: 'Cuerpo demasiado grande',
  415: 'Tipo de contenido no soportado',
  422: 'Datos no válidos',
  429: 'Demasiadas peticiones',
  500: 'Error interno del servidor',
  502: 'Puerta de enlace incorrecta',
  503: 'Servicio no disponible',
  504: 'Tiempo de espera del servidor',
};

const LOGIN_HINTS: Record<number, string> = {
  401: 'Revisa correo y contraseña.',
  403: 'No tienes permiso para autenticarte en este servicio.',
  404: 'La ruta de login no existe. Verifica `auth.loginPath` en el documento IS.',
  405: 'El servidor no acepta POST en esa URL. Si el visor está en otro host que la API, define `auth.loginUrl`.',
  429: 'Espera unos segundos antes de reintentar.',
  502: 'El backend no pudo completar el login (servicio externo caído o mal configurado).',
  503: 'El servicio de autenticación no está disponible temporalmente.',
};

export type DocsHttpErrorOpts = { statusText?: string; data?: unknown; detail?: string; endpoint?: string; hint?: string; defaultHint?: string; context?: 'login' | string; };

/** Extrae el mensaje de error de las tres formas que usan las APIs InSoft. */
export function extractApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  if (typeof d.error === 'string' && d.error.trim()) return d.error.trim();
  if (typeof d.message === 'string' && d.message.trim()) return d.message.trim();
  const enc = d.encabezado as Record<string, unknown> | undefined;
  if (enc && typeof enc.mensaje === 'string' && enc.mensaje.trim()) return enc.mensaje.trim();
  return '';
}

export function formatHttpError(status: number, opts: DocsHttpErrorOpts = {}): string {
  const code = Number(status) || 0;
  const label = STATUS_LABELS[code] ?? 'Error HTTP';
  const statusText = opts.statusText ? ` ${String(opts.statusText).trim()}` : '';
  const lines = [`${label} (${code}${statusText}).`];

  const detail = opts.detail || extractApiError(opts.data);
  if (detail) lines.push(detail);
  if (opts.endpoint) lines.push(`URL: ${opts.endpoint}`);

  const hint = opts.hint ?? (opts.context === 'login' ? LOGIN_HINTS[code] : opts.defaultHint);
  if (hint) lines.push(hint);

  return lines.join('\n');
}

export function formatLoginError(res: Response, data: unknown, endpoint: string): string {
  const apiMsg = extractApiError(data);
  const d = data as Record<string, unknown> | undefined;
  if (apiMsg && (d?.ok === false || !res.ok)) {
    let msg = apiMsg;
    if (d?.retryAfterSeconds) msg += ` (reintenta en ${d.retryAfterSeconds} s)`;
    return msg;
  }
  // 200 sin token: el servidor respondió, pero no es una sesión utilizable.
  if (res.ok && !d?.token) {
    return formatHttpError(502, { detail: 'La respuesta no incluyó token JWT.', endpoint, context: 'login' });
  }
  return formatHttpError(res.status, { statusText: res.statusText, data, endpoint, context: 'login' });
}
