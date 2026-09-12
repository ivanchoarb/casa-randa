import { supabaseClient } from "@/lib/supabase-client";

type TipoTarea = "preparacion" | "turnover" | "limpieza_salida";

/**
 * "Se genera sola a partir de la Reserva" (docs/logica-negocio-y-flujos.md)
 * — fechas verificadas el 2026-09-11 haciendo clic tarea por tarea en
 * staging.randahome.com/intranet/operacion/: Preparar llegada cae el día
 * de entrada, Check-out y Limpieza caen los dos el día de salida (no uno
 * después del otro). Ahora hay un trigger de Postgres real que hace esto
 * mismo (supabase/migrations/0007_tareas_operacion_trigger.sql +
 * 0009_fix_tareas_operacion_fechas.sql, aplicados el 2026-09-11) — esta
 * función queda como respaldo idempotente para cuando el import de CSV
 * corre contra un entorno sin el trigger aplicado.
 */
function tareasParaReserva(reservaId: string, entrada: string, salida: string) {
  const tipos: { tipo: TipoTarea; fecha: string }[] = [
    { tipo: "preparacion", fecha: entrada },
    { tipo: "turnover", fecha: salida },
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
