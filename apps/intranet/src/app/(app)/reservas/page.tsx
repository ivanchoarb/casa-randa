"use client";

import { useMemo, useState } from "react";
import { useTable, useUpdate } from "@refinedev/core";
import { computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";

interface Solicitud {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  entrada: string;
  salida: string;
  huespedes: number;
  plan_tarifa: CancellationPolicy;
  plan_pago: PaymentPlan;
  notas: string | null;
  estado: "pendiente" | "aprobada" | "rechazada" | "convertida";
  created_at: string;
}

const ESTADO_SOLICITUD_LABEL: Record<Solicitud["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  convertida: "Convertida en reserva",
};

const PLAN_TARIFA_LABEL: Record<CancellationPolicy, string> = {
  flex: "Flexible (+3%)",
  nr: "No reembolsable (−5%)",
};

const PLAN_PAGO_LABEL: Record<PaymentPlan, string> = {
  "30": "30% ahora, saldo antes de llegar",
  "100": "100% ahora",
};

function fechaHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PA", { dateStyle: "medium", timeStyle: "short" });
}

function SolicitudCard({ s }: { s: Solicitud }) {
  const { mutate: actualizar, mutation } = useUpdate<Solicitud>();
  const quote = computeQuote({ checkIn: s.entrada, checkOut: s.salida, pax: s.huespedes, cancellation: s.plan_tarifa, plan: s.plan_pago });

  // Solo cambia el estado — todavía no genera el link de pago
  // (PagueloFacil/Yappy) ni convierte la solicitud en Reserva, esa parte
  // de Flujo 1 (docs/logica-negocio-y-flujos.md) sigue sin construir.
  // "Aprobar" aquí es la señal para que el administrador siga el
  // contacto manualmente, no un paso automático todavía.
  function cambiarEstado(estado: Solicitud["estado"]) {
    actualizar({ resource: "solicitudes", id: s.id, values: { estado } });
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{s.nombre}</p>
          <p className="text-xs text-ink-2">
            {s.email}
            {s.telefono ? ` · ${s.telefono}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            s.estado === "pendiente"
              ? "bg-lamp-bg text-lamp"
              : s.estado === "rechazada"
                ? "bg-panel-2 text-ink-2"
                : "bg-good-bg text-good"
          }`}
        >
          {ESTADO_SOLICITUD_LABEL[s.estado]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-ink-2 uppercase">Fechas</p>
          <p>
            {s.entrada} → {s.salida}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-2 uppercase">Huéspedes</p>
          <p>{s.huespedes}</p>
        </div>
        <div>
          <p className="text-xs text-ink-2 uppercase">Cancelación</p>
          <p>{PLAN_TARIFA_LABEL[s.plan_tarifa]}</p>
        </div>
        <div>
          <p className="text-xs text-ink-2 uppercase">Pago</p>
          <p>{PLAN_PAGO_LABEL[s.plan_pago]}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-sm text-ink-2">
          Cotización estimada:{" "}
          <span className="font-semibold text-ink">
            {quote ? `$${quote.totalUsd.toLocaleString("es-PA")}` : "— (estadía por debajo del mínimo)"}
          </span>{" "}
          · recibida {fechaHora(s.created_at)}
        </p>
        {s.estado === "pendiente" && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => cambiarEstado("rechazada")}
              className="rounded-md border border-line px-3 py-1 text-sm disabled:opacity-60"
            >
              Rechazar
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => cambiarEstado("aprobada")}
              className="rounded-md bg-caoba px-3 py-1 text-sm font-semibold text-panel disabled:opacity-60"
            >
              Aprobar
            </button>
          </div>
        )}
      </div>
      {s.notas && <p className="mt-2 text-xs text-ink-2">Notas: {s.notas}</p>}
    </div>
  );
}

interface Reserva {
  id: string;
  canal: "airbnb" | "vrbo" | "directo";
  codigo_externo: string | null;
  huesped_nombre: string;
  entrada: string;
  salida: string;
  noches: number;
  bruto: number;
  neto: number;
  estado: "pendiente" | "confirmada" | "completada" | "cancelada";
}

const ESTADO_LABEL: Record<Reserva["estado"], string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

// Orden de las secciones — "pendiente" no tiene reservas reales hoy (las 69
// actuales son 47 completada / 11 confirmada / 11 cancelada, verificado en
// la base real 2026-09-12), pero si alguna vez aparece una no debe
// desaparecer en silencio: se agrega su sección igual, solo que no se
// muestra si no hay ninguna fila con ese estado.
const ORDEN_ESTADOS: Reserva["estado"][] = ["confirmada", "completada", "cancelada", "pendiente"];

function FilaReserva({ r }: { r: Reserva }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        {r.huesped_nombre}
        {r.codigo_externo && <span className="ml-1 text-xs text-ink-2">· {r.codigo_externo}</span>}
      </td>
      <td className="px-4 py-3 capitalize">{r.canal}</td>
      <td className="px-4 py-3">{r.entrada}</td>
      <td className="px-4 py-3">{r.salida}</td>
      <td className="px-4 py-3 text-right tabular-nums">{r.noches}</td>
      <td className="px-4 py-3 text-right tabular-nums">${r.neto.toFixed(2)}</td>
    </tr>
  );
}

function GrupoEstado({
  estado,
  filas,
  abierto,
  onToggle,
}: {
  estado: Reserva["estado"];
  filas: Reserva[];
  abierto: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold">
          {ESTADO_LABEL[estado]} <span className="font-normal text-ink-2">({filas.length})</span>
        </span>
        <span className={`text-ink-2 transition-transform ${abierto ? "rotate-180" : ""}`}>▾</span>
      </button>
      {abierto && (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                <th className="px-4 py-3 font-medium">Huésped</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
                <th className="px-4 py-3 font-medium">Salida</th>
                <th className="px-4 py-3 text-right font-medium">Noches</th>
                <th className="px-4 py-3 text-right font-medium">Neto</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((r) => (
                <FilaReserva key={r.id} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReservasPage() {
  // Primer módulo conectado de verdad a Refine (useTable → @refinedev/supabase
  // → tabla `reservas`) — el resto de páginas de la intranet todavía son
  // esqueletos. Ver docs/arquitectura-migracion.md, Fase 3.
  //
  // 2026-09-12: agrupado por estado en vez de una sola tabla larga, a
  // pedido de Ivan — cada grupo arranca contraído y se expande con un
  // click. Paginación en "off": con las secciones ya agrupadas por
  // estado, una paginación por página mezclada (20 filas de cualquier
  // estado) rompería los grupos — con 69 reservas reales hoy, traerlas
  // todas de una vez es liviano y evita ese problema.
  const { result, tableQuery } = useTable<Reserva>({
    resource: "reservas",
    sorters: { initial: [{ field: "entrada", order: "desc" }] },
    pagination: { mode: "off" },
  });

  // Solicitudes de reserva directa (Flujo 1, docs/logica-negocio-y-flujos.md)
  // enviadas desde "Solicitar estas fechas" en la página pública —
  // src/lib/supabase-client.ts + la policy "publico_crea_solicitud"
  // (0006_rls.sql) insertan directo en `solicitudes` sin pasar por esta
  // app. La cotización no se guarda: se recalcula aquí con la misma
  // computeQuote() del sitio, a partir de entrada/salida/huéspedes/
  // plan_tarifa/plan_pago, para no confiar en un total mandado por el
  // navegador ni duplicar la lógica de precio en dos lugares.
  const { result: solicitudesResult, tableQuery: solicitudesQuery } = useTable<Solicitud>({
    resource: "solicitudes",
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });
  const solicitudesPendientes = solicitudesResult.data.filter((s) => s.estado === "pendiente");
  const solicitudesResueltas = solicitudesResult.data.filter((s) => s.estado !== "pendiente");
  const [historialSolicitudesAbierto, setHistorialSolicitudesAbierto] = useState(false);

  const grupos = useMemo(() => {
    return ORDEN_ESTADOS.map((estado) => ({
      estado,
      filas: result.data.filter((r) => r.estado === estado),
    })).filter((g) => g.filas.length > 0);
  }, [result.data]);

  const [abiertos, setAbiertos] = useState<Set<Reserva["estado"]>>(new Set());
  function alternar(estado: Reserva["estado"]) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(estado)) siguiente.delete(estado);
      else siguiente.add(estado);
      return siguiente;
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Reservas</p>
      <h1 className="mt-1 text-2xl font-bold">Solicitudes y reservas</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">
          Solicitudes desde la página{" "}
          {!solicitudesQuery.isLoading && (
            <span className="text-sm font-normal text-ink-2">
              ({solicitudesPendientes.length} pendiente{solicitudesPendientes.length === 1 ? "" : "s"})
            </span>
          )}
        </h2>

        {solicitudesQuery.isLoading && <p className="mt-3 text-sm text-ink-2">Cargando…</p>}

        {!solicitudesQuery.isLoading && !solicitudesQuery.isError && solicitudesResult.data.length === 0 && (
          <p className="mt-3 text-sm text-ink-2">
            Todavía no ha llegado ninguna solicitud desde &ldquo;Solicitar estas fechas&rdquo; en la página pública.
          </p>
        )}

        {!solicitudesQuery.isLoading && solicitudesPendientes.length === 0 && solicitudesResult.data.length > 0 && (
          <p className="mt-3 text-sm text-ink-2">No hay solicitudes pendientes por revisar.</p>
        )}

        {solicitudesPendientes.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {solicitudesPendientes.map((s) => (
              <SolicitudCard key={s.id} s={s} />
            ))}
          </div>
        )}

        {solicitudesResueltas.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setHistorialSolicitudesAbierto((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 text-left"
            >
              <span className="font-semibold">
                Historial de solicitudes{" "}
                <span className="font-normal text-ink-2">({solicitudesResueltas.length})</span>
              </span>
              <span className={`text-ink-2 transition-transform ${historialSolicitudesAbierto ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {historialSolicitudesAbierto && (
              <div className="mt-2 flex flex-col gap-3">
                {solicitudesResueltas.map((s) => (
                  <SolicitudCard key={s.id} s={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <h2 className="mt-10 text-lg font-semibold">Reservas confirmadas</h2>

      {tableQuery.isLoading && <p className="mt-6 text-sm text-ink-2">Cargando…</p>}

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> a partir de{" "}
          <code>.env.example</code> (ver <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && result.data.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">Todavía no hay reservas registradas.</p>
      )}

      {!tableQuery.isLoading && grupos.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {grupos.map((g) => (
            <GrupoEstado
              key={g.estado}
              estado={g.estado}
              filas={g.filas}
              abierto={abiertos.has(g.estado)}
              onToggle={() => alternar(g.estado)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
