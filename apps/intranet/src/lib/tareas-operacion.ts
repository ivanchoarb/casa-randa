import { supabaseClient } from "@/lib/supabase-client";

type TipoTarea = "preparacion" | "turnover" | "limpieza_salida";

/**
 * "Se genera sola a partir de la Reserva" (docs/logica-negocio-y-flujos.md)
 * — no hay una forma verificada de saber la regla exacta del sistema
 * WordPress real (no hay acceso al código PHP), así que esto es una
 * interpretación razonable, no una réplica exacta: preparación el día
 * antes de la llegada, turnover el día de la llegada, limpieza de salida
 * el día de la salida. Idealmente esto sería un trigger de Postgres (ver
 * supabase/migrations/0007_tareas_operacion_trigger.sql, escrito pero NO
 * aplicado — no hay acceso de DDL directo a la base desde aquí, solo a la
 * REST API). Mientras tanto se llama a mano desde los puntos donde una
 * reserva pasa a confirmada/completada (el import de CSV) y desde un
 * backfill de una sola vez para las reservas que ya existían.
 */
function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function tareasParaReserva(reservaId: string, entrada: string, salida: string) {
  const tipos: { tipo: TipoTarea; fecha: string }[] = [
    { tipo: "preparacion", fecha: sumarDias(entrada, -1) },
    { tipo: "turnover", fecha: entrada },
    { tipo: "limpieza_salida", fecha: salida },
  ];
  return tipos.map((t) => ({ reserva_id: reservaId, tipo: t.tipo, fecha: t.fecha }));
}

/**
 * Crea las 3 tareas de una reserva si todavía no tiene ninguna — idempotente,
 * se puede llamar varias veces (p. ej. cada vez que se reimporta un CSV)
 * sin duplicar filas. No hay una constraint única (reserva_id, tipo) en la
 * base para apoyarse en un upsert, así que se verifica a mano primero.
 */
export async function asegurarTareasDeReserva(reservaId: string, entrada: string, salida: string) {
  const { data: existentes, error: errBusqueda } = await supabaseClient
    .from("tareas_operacion")
    .select("id")
    .eq("reserva_id", reservaId)
    .limit(1);
  if (errBusqueda) throw new Error(`Error al revisar tareas existentes: ${errBusqueda.message}`);
  if (existentes && existentes.length > 0) return { creadas: 0 };

  const { error } = await supabaseClient
    .from("tareas_operacion")
    .insert(tareasParaReserva(reservaId, entrada, salida));
  if (error) throw new Error(`Error al crear tareas de operación: ${error.message}`);
  return { creadas: 3 };
}
