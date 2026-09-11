"use client";

import { useTable } from "@refinedev/core";

type TipoTarea = "preparacion" | "turnover" | "limpieza_salida";
type EstadoTarea = "pendiente" | "completada" | "con_novedad";

interface TareaConReserva {
  id: string;
  reserva_id: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  fecha: string;
  reservas: {
    huesped_nombre: string;
    canal: string;
    codigo_externo: string | null;
    entrada: string;
    salida: string;
  } | null;
}

const TIPO_LABEL: Record<TipoTarea, string> = {
  preparacion: "Preparación",
  turnover: "Turnover",
  limpieza_salida: "Limpieza de salida",
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function agruparPorReserva(tareas: TareaConReserva[]) {
  const grupos = new Map<string, TareaConReserva[]>();
  for (const t of tareas) {
    const grupo = grupos.get(t.reserva_id) ?? [];
    grupo.push(t);
    grupos.set(t.reserva_id, grupo);
  }
  return Array.from(grupos.values());
}

export default function OperacionPage() {
  // Tercer módulo conectado a datos reales — ver docs/arquitectura-migracion.md,
  // Fase 3. meta.select usa el embed de PostgREST para traer la reserva
  // de cada tarea en la misma consulta (@refinedev/supabase pasa
  // meta.select directo a .select() de supabase-js).
  const { result, tableQuery } = useTable<TareaConReserva>({
    resource: "tareas_operacion",
    meta: { select: "*, reservas(huesped_nombre, canal, codigo_externo, entrada, salida)" },
    sorters: { initial: [{ field: "fecha", order: "asc" }] },
    pagination: { pageSize: 300 },
  });

  const tareas = result.data ?? [];
  const hoy = hoyISO();
  const paraHoy = tareas.filter((t) => t.fecha === hoy).length;
  const pendientes = tareas.filter((t) => t.estado === "pendiente").length;
  const completadas = tareas.filter((t) => t.estado === "completada").length;
  const conNovedad = tareas.filter((t) => t.estado === "con_novedad").length;

  const reservasAgrupadas = agruparPorReserva(tareas);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Operación</p>
      <h1 className="mt-1 text-2xl font-bold">Check-in, check-out y limpieza</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Las tareas se crean automáticamente a partir de las reservas confirmadas — hoy no hay
        ninguna reserva creando tareas todavía, ver Reservas.
      </p>

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-medium text-ink-2 uppercase">Para hoy</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{paraHoy}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-medium text-ink-2 uppercase">Pendientes</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{pendientes}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-medium text-ink-2 uppercase">Completadas</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-good">{completadas}</p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-medium text-ink-2 uppercase">Con novedad</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-caoba">{conNovedad}</p>
          </div>
        </div>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && reservasAgrupadas.length === 0 && (
        <p className="mt-8 text-sm text-ink-2">Todavía no hay tareas de operación registradas.</p>
      )}

      <div className="mt-6 space-y-2">
        {reservasAgrupadas.map((tareasReserva) => {
          const reserva = tareasReserva[0].reservas;
          const listas = tareasReserva.filter((t) => t.estado === "completada").length;
          return (
            <div
              key={tareasReserva[0].reserva_id}
              className="rounded-lg border border-line bg-panel px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{reserva?.huesped_nombre ?? "—"}</p>
                  <p className="text-xs text-ink-2 capitalize">
                    {reserva?.canal}
                    {reserva?.codigo_externo ? ` · ${reserva.codigo_externo}` : ""} ·{" "}
                    {reserva?.entrada} → {reserva?.salida}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums text-ink-2">
                  {listas}/{tareasReserva.length} listas
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tareasReserva.map((t) => (
                  <span
                    key={t.id}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.estado === "completada"
                        ? "bg-good-bg text-good"
                        : t.estado === "con_novedad"
                          ? "bg-lamp-bg text-lamp"
                          : "bg-panel-2 text-ink-2"
                    }`}
                  >
                    {TIPO_LABEL[t.tipo]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
