/**
 * El "código de reserva" que se le pide al huésped en /tienda y /check-in
 * solo tenía sentido para reservas directas — codigo_tienda se genera para
 * TODA reserva (0024_codigo_tienda_reservas.sql), pero a un huésped de
 * Airbnb/Vrbo nunca se lo mandamos nosotros: él solo conoce el código de
 * confirmación de su propia plataforma, que ya vive en codigo_externo
 * (columna que alimenta el importador de reservas, ver CLAUDE.md). Iván:
 * "debe aceptar código de la página web, Airbnb y Vrbo" — ambas columnas
 * cuentan como válidas ahora, en los dos flujos.
 *
 * Valida el formato (solo letras/números) antes de armar el filtro
 * `.or()` de PostgREST — evita que un carácter como una coma rompa la
 * sintaxis de ese filtro, no solo una validación cosmética.
 */
const FORMATO_CODIGO = /^[A-Z0-9]+$/;

export function normalizarCodigoReserva(crudo: unknown): string | null {
  if (typeof crudo !== "string") return null;
  const codigo = crudo.trim().toUpperCase();
  if (!codigo || !FORMATO_CODIGO.test(codigo)) return null;
  return codigo;
}

export function filtroCodigoReserva(codigo: string): string {
  return `codigo_tienda.eq.${codigo},codigo_externo.eq.${codigo}`;
}
