"use client";

import { useUpdate, useTable } from "@refinedev/core";
import { useState } from "react";

type TipoTarea = "preparacion" | "turnover" | "limpieza_salida";
type EstadoTarea = "pendiente" | "en_proceso" | "completada" | "con_novedad";

interface TareaConReserva {
  id: string;
  reserva_id: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  fecha: string;
  responsable: string | null;
  checklist: Record<string, boolean> | null;
  notas: string | null;
  reservas: {
    huesped_nombre: string;
    canal: string;
    codigo_externo: string | null;
    entrada: string;
    salida: string;
    recibido: number;
  } | null;
}

// Etiquetas, checklist y responsables por tipo — verificados el 2026-09-11
// haciendo clic tarea por tarea en staging.randahome.com/intranet/operacion/.
// La única pieza no verificada directamente es el listado de responsables
// de "Preparar llegada": se infiere igual al de Check-out (Marquelda/Iván,
// ambas tareas de anfitrión, no de limpieza física) porque la sesión de
// staging expiró antes de poder confirmarlo con el mismo método.
const TIPO_LABEL: Record<TipoTarea, string> = {
  preparacion: "Preparar llegada",
  turnover: "Check-out",
  limpieza_salida: "Limpieza",
};

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completada: "Completada",
  con_novedad: "Con novedad",
};
const ESTADOS: EstadoTarea[] = ["pendiente", "en_proceso", "completada", "con_novedad"];

const RESPONSABLES: Record<TipoTarea, string[]> = {
  preparacion: ["Marquelda", "Iván"],
  turnover: ["Marquelda", "Iván"],
  limpieza_salida: ["Dayra"],
};

const CHECKLIST_ITEMS: Record<TipoTarea, { key: string; label: string }[]> = {
  preparacion: [
    { key: "pago_deposito", label: "Pago y depósito verificados" },
    { key: "datos_huesped", label: "Datos del huésped confirmados" },
    { key: "codigo_llaves", label: "Código o llaves preparados" },
    { key: "instrucciones", label: "Instrucciones de llegada enviadas" },
  ],
  turnover: [
    { key: "hora_salida", label: "Hora de salida confirmada" },
    { key: "llaves_recuperadas", label: "Llaves o código recuperados" },
    { key: "danos_revisados", label: "Daños y objetos olvidados revisados" },
    { key: "salida_registrada", label: "Salida registrada" },
  ],
  limpieza_salida: [
    { key: "habitaciones_banos", label: "Habitaciones y baños limpios" },
    { key: "sabanas_toallas", label: "Sábanas y toallas reemplazadas" },
    { key: "cocina_social", label: "Cocina y zonas sociales listas" },
    { key: "amenidades", label: "Amenidades repuestas" },
    { key: "fotos_finales", label: "Fotografías finales revisadas" },
    { key: "casa_lista", label: "Casa lista" },
  ],
};

const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function fechaCorta(iso: string) {
  const [, m, d] = iso.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[Number(m) - 1]}`;
}

const ORDEN_TIPO: Record<TipoTarea, number> = { preparacion: 0, turnover: 1, limpieza_salida: 2 };

function agruparPorReserva(tareas: TareaConReserva[]) {
  const grupos = new Map<string, TareaConReserva[]>();
  for (const t of tareas) {
    const grupo = grupos.get(t.reserva_id) ?? [];
    grupo.push(t);
    grupos.set(t.reserva_id, grupo);
  }
  for (const grupo of grupos.values()) grupo.sort((a, b) => ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo]);
  return Array.from(grupos.values());
}

function TareaPanel({ tarea }: { tarea: TareaConReserva }) {
  const { mutate: actualizar, mutation } = useUpdate<TareaConReserva>();
  const [estado, setEstado] = useState<EstadoTarea>(tarea.estado);
  const [responsable, setResponsable] = useState(tarea.responsable ?? "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(tarea.checklist ?? {});
  const [notas, setNotas] = useState(tarea.notas ?? "");

  const items = CHECKLIST_ITEMS[tarea.tipo];

  function guardar() {
    actualizar({
      resource: "tareas_operacion",
      id: tarea.id,
      values: {
        estado,
        responsable: responsable || null,
        checklist,
        notas: notas || null,
      },
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-line bg-ground p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="text-xs text-ink-2">
          Estado
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoTarea)}
            className="mt-1 block w-full rounded-md border border-line bg-panel px-2 py-1.5 text-sm text-ink"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Responsable
          <select
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            className="mt-1 block w-full rounded-md border border-line bg-panel px-2 py-1.5 text-sm text-ink"
          >
            <option value="">Sin asignar</option>
            {RESPONSABLES[tarea.tipo].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-md border border-line bg-panel px-3 py-1.5">
          <p className="text-xs text-ink-2 uppercase">Pago registrado</p>
          <p className="font-semibold tabular-nums">{money(tarea.reservas?.recibido ?? 0)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checklist[item.key] ?? false}
              onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
              className="rounded border-line"
            />
            {item.label}
          </label>
        ))}
      </div>

      <label className="mt-4 block text-xs text-ink-2">
        Notas o novedades
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
        />
      </label>

      <button
        type="button"
        onClick={guardar}
        disabled={mutation.isPending}
        className="mt-4 rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
      >
        {mutation.isPending ? "Guardando…" : `Guardar ${TIPO_LABEL[tarea.tipo].toLowerCase()}`}
      </button>
    </div>
  );
}

export default function OperacionPage() {
  // Tercer módulo conectado a datos reales — ver docs/arquitectura-migracion.md,
  // Fase 3. meta.select usa el embed de PostgREST para traer la reserva
  // de cada tarea en la misma consulta (@refinedev/supabase pasa
  // meta.select directo a .select() de supabase-js).
  const { result, tableQuery } = useTable<TareaConReserva>({
    resource: "tareas_operacion",
    meta: { select: "*, reservas(huesped_nombre, canal, codigo_externo, entrada, salida, recibido)" },
    sorters: { initial: [{ field: "fecha", order: "asc" }] },
    pagination: { pageSize: 300 },
  });

  const [reservaAbierta, setReservaAbierta] = useState<string | null>(null);
  const [tareaAbierta, setTareaAbierta] = useState<string | null>(null);

  const hoy = hoyISO();
  // Vigentes: la estadía todavía no terminó, o terminó hace poco (margen
  // para la limpieza de salida) — igual al recorte que ya se ve en
  // staging.randahome.com/intranet/operacion/ (comparado en vivo el
  // 2026-09-11: mismas 11 reservas, mismas 33 tareas). Sin esto, la
  // pantalla se llena de tareas de estadías de hace 1-2 años que a nadie
  // le sirve ver en el día a día.
  const desde = sumarDias(hoy, -3);
  const tareas = (result.data ?? []).filter((t) => (t.reservas?.salida ?? "9999-99-99") >= desde);

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
        Las tareas se crean automáticamente a partir de las reservas activas.
      </p>
      {!tableQuery.isLoading && !tableQuery.isError && (
        <p className="mt-1 text-sm text-ink-2">{tareas.length} tareas</p>
      )}

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
        <p className="mt-8 text-sm text-ink-2">Todavía no hay tareas de operación vigentes.</p>
      )}

      <div className="mt-6 space-y-2">
        {reservasAgrupadas.map((tareasReserva) => {
          const reserva = tareasReserva[0].reservas;
          const reservaId = tareasReserva[0].reserva_id;
          const listas = tareasReserva.filter((t) => t.estado === "completada").length;
          const conNovedadEnReserva = tareasReserva.some((t) => t.estado === "con_novedad");
          const abierta = reservaAbierta === reservaId;

          return (
            <div
              key={reservaId}
              className={`rounded-lg border bg-panel px-4 py-3 ${
                conNovedadEnReserva ? "border-l-4 border-l-caoba border-line" : "border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setReservaAbierta(abierta ? null : reservaId);
                  setTareaAbierta(null);
                }}
                className="flex w-full items-center justify-between text-left"
              >
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
              </button>

              {abierta && (
                <div className="mt-3 space-y-2">
                  {tareasReserva.map((t) => {
                    const tareaEstaAbierta = tareaAbierta === t.id;
                    return (
                      <div key={t.id}>
                        <button
                          type="button"
                          onClick={() => setTareaAbierta(tareaEstaAbierta ? null : t.id)}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left ${
                            tareaEstaAbierta ? "border-caoba" : "border-line"
                          } bg-panel`}
                        >
                          <span className="text-sm font-semibold">{TIPO_LABEL[t.tipo]}</span>
                          <span className="flex items-center gap-3">
                            <span className="text-xs text-ink-2">{fechaCorta(t.fecha)}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                t.estado === "completada"
                                  ? "bg-good-bg text-good"
                                  : t.estado === "con_novedad"
                                    ? "bg-lamp-bg text-lamp"
                                    : "bg-panel-2 text-ink-2"
                              }`}
                            >
                              {ESTADO_LABEL[t.estado]}
                            </span>
                          </span>
                        </button>
                        {tareaEstaAbierta && <TareaPanel tarea={t} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
