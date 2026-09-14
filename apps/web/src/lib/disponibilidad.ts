import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConflictoDisponibilidad {
  inicio: string;
  fin: string;
  fuente: "airbnb" | "vrbo" | "directo";
}

/**
 * Mismo criterio que la vista `reservas_fechas_ocupadas` de apps/intranet
 * (supabase/migrations/0017_disponibilidad_reservas_directas.sql), pero
 * consultado directo con el cliente de servicio en vez de esa vista —
 * la vista solo tiene grant para `authenticated` (sesiones de la intranet),
 * y este sitio público nunca tiene una sesión de Supabase. `bloqueos_calendario`
 * trae los bloqueos de Airbnb/Vrbo vía iCal; `reservas` con estado
 * confirmada/completada cubre las reservas directas, que nunca generan su
 * propio bloqueo (defecto D2, ver ese mismo comentario en la vista). Rangos
 * semiabiertos ([entrada, salida)) — el día de salida no cuenta como
 * ocupado, mismo criterio que toda fecha en este proyecto.
 *
 * 2026-09-14, hallazgo de auditoría (Codex, docs/auditoria-2026-09-14.md,
 * punto 1): antes esta función descartaba `error` y trataba `data: null`
 * (una consulta fallida, no una tabla vacía) igual que "sin conflictos" —
 * un timeout o error SQL real, exactamente el tipo de falla contra la que
 * este chequeo debería protegerse, se leía como "fechas libres". Ahora
 * lanza si cualquiera de las dos consultas falla, para que los que llaman
 * (`/api/disponibilidad`, `/api/solicitudes`) puedan negarse a confirmar
 * disponibilidad que no pudieron verificar de verdad, en vez de dejar
 * pasar una solicitud que se cruza con una reserva real.
 */
export async function buscarConflictos(
  db: SupabaseClient,
  entrada: string,
  salida: string,
): Promise<ConflictoDisponibilidad[]> {
  const [{ data: bloqueos, error: errorBloqueos }, { data: reservas, error: errorReservas }] = await Promise.all([
    db.from("bloqueos_calendario").select("inicio, fin, fuente").lt("inicio", salida).gt("fin", entrada),
    db
      .from("reservas")
      .select("entrada, salida, canal")
      .in("estado", ["confirmada", "completada"])
      .lt("entrada", salida)
      .gt("salida", entrada),
  ]);
  if (errorBloqueos || errorReservas) {
    throw new Error("No se pudo verificar la disponibilidad.");
  }

  const conflictos: ConflictoDisponibilidad[] = [];
  for (const b of bloqueos ?? []) conflictos.push({ inicio: b.inicio, fin: b.fin, fuente: b.fuente });
  for (const r of reservas ?? []) conflictos.push({ inicio: r.entrada, fin: r.salida, fuente: r.canal });
  return conflictos;
}
