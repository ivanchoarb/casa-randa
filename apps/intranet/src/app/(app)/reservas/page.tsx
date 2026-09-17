"use client";

import { usePermisos } from "@/lib/use-permisos";
import { supabaseClient } from "@/lib/supabase-client";
import * as XLSX from "xlsx";
import { useMemo, useState } from "react";
import { useDelete, useTable, useUpdate } from "@refinedev/core";
import { computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";

interface Solicitud {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  pais: string | null;
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

// 2026-09-14, a pedido de Iván (auditoría manual): antes solo se podía
// aprobar/rechazar una solicitud, nunca corregir sus datos ni borrarla —
// mismo patrón de edición en línea que PlanCompraItem en Análisis
// (plan_compras). Editar/eliminar aquí es sobre la solicitud en sí (la
// fila en `solicitudes` que crea "Solicitar estas fechas" en la web
// pública) — todavía no existe una Reserva real generada desde la web
// (eso sigue siendo Flujo 1 sin terminar, ver el comentario de
// cambiarEstado más abajo), así que "reserva hecha por la página web" hoy
// significa esto.
function SolicitudCard({ s }: { s: Solicitud }) {
  const { mutate: actualizar, mutation } = useUpdate<Solicitud>();
  const { mutate: eliminar, mutation: eliminando } = useDelete<Solicitud>();
  const [editando, setEditando] = useState(false);
  const quote = computeQuote({ checkIn: s.entrada, checkOut: s.salida, pax: s.huespedes, cancellation: s.plan_tarifa, plan: s.plan_pago });

  const [nombre, setNombre] = useState(s.nombre);
  const [apellido, setApellido] = useState(s.apellido ?? "");
  const [email, setEmail] = useState(s.email);
  const [telefono, setTelefono] = useState(s.telefono ?? "");
  const [pais, setPais] = useState(s.pais ?? "");
  const [entrada, setEntrada] = useState(s.entrada);
  const [salida, setSalida] = useState(s.salida);
  const [huespedes, setHuespedes] = useState(s.huespedes.toString());
  const [planTarifa, setPlanTarifa] = useState(s.plan_tarifa);
  const [planPago, setPlanPago] = useState(s.plan_pago);
  const [notas, setNotas] = useState(s.notas ?? "");

  // Solo cambia el estado — todavía no genera el link de pago
  // (PagueloFacil/Yappy) ni convierte la solicitud en Reserva, esa parte
  // de Flujo 1 (docs/logica-negocio-y-flujos.md) sigue sin construir.
  // "Aprobar" aquí es la señal para que el administrador siga el
  // contacto manualmente, no un paso automático todavía.
  function cambiarEstado(estado: Solicitud["estado"]) {
    actualizar({ resource: "solicitudes", id: s.id, values: { estado } });
  }

  function guardar() {
    actualizar(
      {
        resource: "solicitudes",
        id: s.id,
        values: {
          nombre,
          apellido: apellido.trim() || null,
          email,
          telefono: telefono.trim() || null,
          pais: pais.trim() || null,
          entrada,
          salida,
          huespedes: Number(huespedes),
          plan_tarifa: planTarifa,
          plan_pago: planPago,
          notas: notas.trim() || null,
        },
      },
      { onSuccess: () => setEditando(false) },
    );
  }

  function eliminarSolicitud() {
    if (!window.confirm(`¿Eliminar la solicitud de ${s.nombre} (${s.entrada} → ${s.salida})?`)) return;
    eliminar({ resource: "solicitudes", id: s.id });
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {s.nombre} {s.apellido}
          </p>
          <p className="text-xs text-ink-2">
            {s.email}
            {s.telefono ? ` · ${s.telefono}` : ""}
            {s.pais ? ` · ${s.pais}` : ""}
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
        <div className="flex gap-2">
          {s.estado === "pendiente" && (
            <>
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
            </>
          )}
          <button
            type="button"
            onClick={() => setEditando(!editando)}
            className="rounded-md border border-line px-3 py-1 text-sm"
          >
            {editando ? "Cancelar" : "Editar"}
          </button>
          <button
            type="button"
            disabled={eliminando.isPending}
            onClick={eliminarSolicitud}
            className="rounded-md border border-line px-3 py-1 text-sm text-caoba disabled:opacity-60"
          >
            Eliminar
          </button>
        </div>
      </div>
      {s.notas && !editando && <p className="mt-2 text-xs text-ink-2">Notas: {s.notas}</p>}

      {editando && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <label className="text-xs text-ink-2">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Apellido
            <input value={apellido} onChange={(e) => setApellido(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Teléfono
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            País
            <input value={pais} onChange={(e) => setPais(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Huéspedes
            <input
              type="number"
              min={1}
              value={huespedes}
              onChange={(e) => setHuespedes(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            Entrada
            <input type="date" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Salida
            <input type="date" value={salida} onChange={(e) => setSalida(e.target.value)} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <label className="text-xs text-ink-2">
            Cancelación
            <select
              value={planTarifa}
              onChange={(e) => setPlanTarifa(e.target.value as CancellationPolicy)}
              className={`${inputClass} mt-1 block w-full`}
            >
              <option value="flex">Flexible (+3%)</option>
              <option value="nr">No reembolsable (−5%)</option>
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Pago
            <select value={planPago} onChange={(e) => setPlanPago(e.target.value as PaymentPlan)} className={`${inputClass} mt-1 block w-full`}>
              <option value="30">30% ahora, saldo antes de llegar</option>
              <option value="100">100% ahora</option>
            </select>
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Notas
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputClass} mt-1 block w-full`} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={guardar}
              className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
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
  const { can } = usePermisos();
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
      {can("contabilidad") && <td className="px-4 py-3 text-right tabular-nums">${(r.neto ?? 0).toFixed(2)}</td>}
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
  const { can } = usePermisos();
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
                {can("contabilidad") && <th className="px-4 py-3 text-right font-medium">Neto</th>}
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
  const { can } = usePermisos();
  const [exportando, setExportando] = useState(false);
  const [errorExportar, setErrorExportar] = useState("");
  async function descargarReservas() {
    setExportando(true); setErrorExportar("");
    try {
      const filas = [];
      // Explicit ranges avoid the REST API default row limit.
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabaseClient.from("reservas_acceso")
          .select("id,huesped_nombre,canal,codigo_externo,entrada,salida,noches,estado")
          .order("entrada", { ascending: false }).order("id").range(offset, offset + 499);
        if (error) throw error;
        filas.push(...(data ?? []));
        if (!data || data.length < 500) break;
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.map(r => ({
        Huésped: r.huesped_nombre, Canal: r.canal, Código: r.codigo_externo,
        Entrada: r.entrada, Salida: r.salida, Noches: r.noches, Estado: r.estado,
      }))), "Reservas");
      XLSX.writeFile(wb, "casa-randa-reservas.xlsx");
    } catch { setErrorExportar("No se pudieron descargar las reservas. Intenta de nuevo."); }
    finally { setExportando(false); }
  }
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
    queryOptions: { enabled: can("reservas") || can("reservas_exportar") },
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
    queryOptions: { enabled: can("solicitudes") },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });
  const solicitudesPendientes = solicitudesResult.data.filter((s) => s.estado === "pendiente");
  const solicitudesResueltas = solicitudesResult.data.filter((s) => s.estado !== "pendiente");
  const [historialSolicitudesAbierto, setHistorialSolicitudesAbierto] = useState(false);

  // 2026-09-18, a pedido de Ivan: las confirmadas siempre de la fecha de
  // llegada más próxima a la más lejana, sin importar cómo esté ordenada
  // la tabla completa (hoy `entrada desc`, pensado para completada/
  // cancelada — la más reciente primero tiene más sentido ahí). Se ordena
  // aquí, por grupo, en vez de cambiar el sorter global de useTable, para
  // no voltear también el orden de esos otros estados sin que lo pidiera.
  const grupos = useMemo(() => {
    return ORDEN_ESTADOS.map((estado) => {
      const filas = result.data.filter((r) => r.estado === estado);
      if (estado === "confirmada") {
        filas.sort((a, b) => a.entrada.localeCompare(b.entrada));
      }
      return { estado, filas };
    }).filter((g) => g.filas.length > 0);
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

      {can("reservas_exportar") && <button onClick={() => void descargarReservas()} disabled={exportando} className="mt-4 rounded-md border border-line px-4 py-2 text-sm disabled:opacity-50">{exportando ? "Descargando…" : "Descargar reservas"}</button>}
      {errorExportar && <p role="alert" className="mt-2 text-caoba">{errorExportar}</p>}
      {can("solicitudes") && <section className="mt-6">
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
      </section>}

      {(can("reservas") || can("reservas_exportar")) && <><h2 className="mt-10 text-lg font-semibold">Reservas confirmadas</h2>

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
      </>}
    </div>
  );
}
