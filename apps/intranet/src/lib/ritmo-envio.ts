// Ritmo de envío de las campañas de correo. El servidor SMTP (Dongee,
// MagicSpam) rechazó con "You have sent too much mail" tras ~55 correos a
// 3 s de distancia (2026-10-01), y esa cuenta también manda cotizaciones y
// activaciones, así que el límite es GLOBAL (todas las campañas juntas), no
// por campaña. Dongee no publica su límite real: estos valores son
// conservadores y se pueden cambiar con variables de entorno.
export const ESPACIADO_SEGUNDOS = Number(process.env.ENVIO_ESPACIADO_SEGUNDOS) || 20;
export const TOPE_POR_HORA = Number(process.env.ENVIO_TOPE_HORA) || 15;

const HORA_MS = 3_600_000;

export type EsperaEnvio = { motivo: "espaciado" | "tope_hora"; esperarSegundos: number };

/**
 * `envios`: fechas ISO de los correos enviados (cualquier campaña, cualquier
 * orden). Devuelve null si se puede enviar ya, o por qué hay que esperar y
 * cuántos segundos.
 */
export function esperaNecesaria(
  envios: string[],
  ahora: number,
  espaciado = ESPACIADO_SEGUNDOS,
  tope = TOPE_POR_HORA,
): EsperaEnvio | null {
  const enLaHora = envios
    .map((e) => Date.parse(e))
    .filter((t) => Number.isFinite(t) && ahora - t < HORA_MS)
    .sort((a, b) => b - a); // del más reciente al más antiguo
  if (enLaHora.length >= tope) {
    // El cupo se libera cuando el envío número `tope` (contando desde el más reciente) cumple una hora.
    return { motivo: "tope_hora", esperarSegundos: Math.ceil((enLaHora[tope - 1] + HORA_MS - ahora) / 1000) };
  }
  if (enLaHora.length > 0 && ahora - enLaHora[0] < espaciado * 1000) {
    return { motivo: "espaciado", esperarSegundos: Math.ceil((enLaHora[0] + espaciado * 1000 - ahora) / 1000) };
  }
  return null;
}

/** ¿El error del SMTP es "intenta más tarde" (no culpa de la dirección del destinatario)? */
export function esErrorTransitorio(e: unknown): boolean {
  const { responseCode, code } = (e ?? {}) as { responseCode?: number; code?: string };
  const msg = e instanceof Error ? e.message : String(e);
  // Errores de red (conexión rechazada/cortada/sin respuesta) tampoco son culpa de la dirección del destinatario.
  if (typeof code === "string" && /^(ECONNREFUSED|ECONNRESET|ETIMEDOUT|ESOCKET|ECONNECTION|EAI_AGAIN)$/.test(code)) return true;
  return (typeof responseCode === "number" && responseCode >= 400 && responseCode < 500) || /too much mail|try again later|rate limit|throttl|too many|ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(msg);
}
