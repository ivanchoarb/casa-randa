"use client";

import { useMemo, useState } from "react";
import { useTable } from "@refinedev/core";
import { usePermisos } from "@/lib/use-permisos";

interface Bloqueo {
  id: string;
  inicio: string;
  fin: string;
  fuente: "airbnb" | "vrbo" | "directo";
  // Solo en las filas que vienen de una reserva y no de un bloqueo del feed.
  reserva?: { huesped: string | null };
}

// Vista permisada de reservas: `canal` toma los mismos valores que
// `bloqueos_calendario.fuente` (airbnb | vrbo | directo).
interface ReservaCalendario {
  id: string;
  canal: Bloqueo["fuente"];
  entrada: string;
  salida: string;
  huesped_nombre: string | null;
}

interface ReservaProxima {
  id: string;
  entrada: string;
  salida: string;
  estado: string;
  huesped_nombre: string | null;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// El mensaje no incluye cantidad de huéspedes a propósito: `huespedes` en
// `reservas` solo trae el default del esquema (2) para toda reserva
// importada de Airbnb/Vrbo/CSV — ninguna fuente real de datos de este
// proyecto trae un conteo real todavía (mismo hallazgo que llevó a
// ocultar esa columna en Reservas, ver CLAUDE.md). Mandar "2 huéspedes"
// para cada una sería inventar un dato, no "si es posible" — confirmado
// contra la base real: las 10 reservas confirmadas próximas de hoy
// tienen las 10 el mismo valor por defecto.
function construirMensajeWhatsApp(reservas: ReservaProxima[]) {
  const lineas = ["Casa Randa — Próximas reservas confirmadas", ""];
  for (const r of reservas) {
    lineas.push(`*${r.huesped_nombre ?? "Huésped"}*`);
    lineas.push(`${r.entrada} → ${r.salida} (${noches(r.entrada, r.salida)} ${noches(r.entrada, r.salida) === 1 ? "noche" : "noches"})`);
    lineas.push("");
  }
  return lineas.join("\n").trim();
}

const FUENTE_STYLE: Record<Bloqueo["fuente"], string> = {
  airbnb: "bg-caoba/10 text-caoba",
  vrbo: "bg-lamp-bg text-lamp",
  directo: "bg-good-bg text-good",
};

const MES_FORMATO = new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric" });

function noches(inicio: string, fin: string) {
  const d1 = new Date(`${inicio}T12:00:00`);
  const d2 = new Date(`${fin}T12:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}

function agruparPorMes(bloqueos: Bloqueo[]) {
  const grupos = new Map<string, Bloqueo[]>();
  for (const b of bloqueos) {
    const fecha = new Date(`${b.inicio}T12:00:00`);
    const clave = MES_FORMATO.format(fecha);
    const grupo = grupos.get(clave) ?? [];
    grupo.push(b);
    grupos.set(clave, grupo);
  }
  return grupos;
}

export default function CalendarioPage() {
  const { can } = usePermisos();

  // Segundo módulo conectado a datos reales (después de Reservas) — ver
  // docs/arquitectura-migracion.md, Fase 3. Agrupa por mes igual que la
  // intranet de WordPress; el job que llena esta tabla desde iCal
  // (Fase 2) todavía no existe, así que hoy solo se ve lo que se cargue
  // a mano o por seed.
  const { result, tableQuery } = useTable<Bloqueo>({
    resource: "bloqueos_calendario",
    sorters: { initial: [{ field: "inicio", order: "asc" }] },
    pagination: { pageSize: 200 },
  });

  // 2026-09-14, hallazgo de auditoría manual de Iván: la lista mezclaba
  // bloqueos de meses ya pasados con los vigentes/futuros sin ningún
  // corte — nada indicaba que enero o marzo de 2026 ya habían pasado.
  // Mismo patrón de "Historial" colapsado que ya usa esta app (Operación,
  // Reservas → Historial de solicitudes): un bloqueo cuyo `fin` ya pasó
  // se archiva ahí, uno que todavía cubre hoy o el futuro (fin >= hoy)
  // se queda en la lista principal. `bloqueos_calendario` sigue trayendo
  // los 200 más próximos por `inicio` ascendente — de ahí para atrás en
  // el tiempo no hay bloqueos futuros que perder.
  const hoy = hoyISO();

  // 2026-10-03, a pedido de Ivan: este calendario solo dibujaba los bloqueos
  // del feed iCal, así que una reserva confirmada que el feed todavía no trae
  // (el de Airbnb llega hasta ~abril de 2027, y una reserva directa nunca
  // genera bloqueo — ver el defecto D2 en 0002_reservas.sql) no aparecía
  // aunque sí estuviera en Reservas y la web pública ya la tratara como
  // ocupada. Se leen las reservas vigentes de `reservas_acceso` (mismo gate
  // `reservas` que el botón de WhatsApp de abajo) y se agregan solo las que
  // ningún bloqueo del mismo canal cubre, para no duplicar fechas.
  const { result: reservasResult } = useTable<ReservaCalendario>({
    resource: "reservas_acceso",
    queryOptions: { enabled: can("reservas") },
    filters: {
      permanent: [
        { field: "estado", operator: "in", value: ["confirmada", "completada"] },
        { field: "salida", operator: "gte", value: hoy },
      ],
    },
    sorters: { initial: [{ field: "entrada", order: "asc" }] },
    pagination: { mode: "off" },
  });

  const { ocupaciones, deReservas } = useMemo(() => {
    const bloqueos = result.data ?? [];
    const deReservas: Bloqueo[] = (reservasResult.data ?? [])
      .filter((r) => !bloqueos.some((b) => b.fuente === r.canal && b.inicio < r.salida && b.fin > r.entrada))
      .map((r) => ({
        id: `reserva-${r.id}`,
        inicio: r.entrada,
        fin: r.salida,
        fuente: r.canal,
        reserva: { huesped: r.huesped_nombre },
      }));
    const ocupaciones = [...bloqueos, ...deReservas].sort((a, b) => a.inicio.localeCompare(b.inicio));
    return { ocupaciones, deReservas };
  }, [result.data, reservasResult.data]);

  const { vigentes, historial } = useMemo(() => {
    const vigentes: Bloqueo[] = [];
    const historial: Bloqueo[] = [];
    for (const b of ocupaciones) {
      (b.fin >= hoy ? vigentes : historial).push(b);
    }
    return { vigentes, historial };
  }, [ocupaciones, hoy]);
  const [historialAbierto, setHistorialAbierto] = useState(false);

  const grupos = agruparPorMes(vigentes);
  const gruposHistorial = agruparPorMes(historial);

  // 2026-09-13, a pedido de Ivan: lista de reservas confirmadas próximas
  // para compartir por WhatsApp. Se lee de `reservas_acceso` (no de la
  // tabla `reservas` cruda) — esa vista es la que de verdad expone
  // huesped_nombre/entrada/salida a quien tenga el permiso "reservas"
  // (Host y Empleado lo tienen por defecto junto con "calendario"; la
  // tabla cruda exige "contabilidad", que ninguno de los dos tiene). Sin
  // ese permiso no se pide el nombre del huésped — mismo criterio que el
  // resto de la app, nada de fila sin nombre a medias.
  const { result: proximasResult } = useTable<ReservaProxima>({
    resource: "reservas_acceso",
    queryOptions: { enabled: can("reservas") },
    filters: { permanent: [{ field: "estado", operator: "eq", value: "confirmada" }, { field: "entrada", operator: "gte", value: hoyISO() }] },
    sorters: { initial: [{ field: "entrada", order: "asc" }] },
    pagination: { mode: "off" },
  });

  const proximasConfirmadas = useMemo(() => proximasResult.data ?? [], [proximasResult.data]);
  const mensajeWhatsApp = useMemo(() => construirMensajeWhatsApp(proximasConfirmadas), [proximasConfirmadas]);
  const enlaceWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Disponibilidad</p>
      <h1 className="mt-1 text-2xl font-bold">Calendario y disponibilidad</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {tableQuery.isLoading ? "Cargando…" : `${vigentes.length} bloqueos y reservas vigentes`}
        </p>
        {can("reservas") && proximasConfirmadas.length > 0 && (
          <a
            href={enlaceWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-caoba px-3 py-1.5 text-xs font-semibold text-panel"
          >
            Enviar reservas próximas por WhatsApp
          </a>
        )}
      </div>
      {can("reservas") && proximasConfirmadas.length > 0 && (
        <p className="mt-1 text-xs text-ink-2">
          {proximasConfirmadas.length} reserva{proximasConfirmadas.length === 1 ? "" : "s"} confirmada
          {proximasConfirmadas.length === 1 ? "" : "s"} próxima{proximasConfirmadas.length === 1 ? "" : "s"} — no
          incluye cantidad de huéspedes, no hay una fuente real de ese dato todavía.
        </p>
      )}

      {deReservas.some((b) => b.fin >= hoy) && (
        <p className="mt-1 text-xs text-ink-2">
          Incluye {deReservas.filter((b) => b.fin >= hoy).length} reserva
          {deReservas.filter((b) => b.fin >= hoy).length === 1 ? "" : "s"} confirmada
          {deReservas.filter((b) => b.fin >= hoy).length === 1 ? "" : "s"} que el feed de iCal todavía no trae.
        </p>
      )}

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && ocupaciones.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">
          Sin bloqueos todavía. Los trae la sincronización de iCal (apps/intranet/src/app/api/sync/ical) o se
          cargan a mano mientras tanto.
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && ocupaciones.length > 0 && vigentes.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">
          No hay bloqueos vigentes — todos los que hay quedaron en el Historial, más abajo.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {Array.from(grupos.entries()).map(([mes, items]) => (
          <div key={mes}>
            <h2 className="text-sm font-semibold text-ink-2 capitalize">{mes}</h2>
            <div className="mt-3 space-y-2">
              {items.map((b) => (
                <FilaBloqueo key={b.id} b={b} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {historial.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setHistorialAbierto((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 text-left"
          >
            <span className="font-semibold">
              Historial <span className="font-normal text-ink-2">({historial.length})</span>
            </span>
            <span className={`text-ink-2 transition-transform ${historialAbierto ? "rotate-180" : ""}`}>▾</span>
          </button>
          {historialAbierto && (
            <div className="mt-4 space-y-8">
              {Array.from(gruposHistorial.entries()).map(([mes, items]) => (
                <div key={mes}>
                  <h2 className="text-sm font-semibold text-ink-2 capitalize">{mes}</h2>
                  <div className="mt-3 space-y-2">
                    {items.map((b) => (
                      <FilaBloqueo key={b.id} b={b} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilaBloqueo({ b }: { b: Bloqueo }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3">
      <div className="flex items-baseline gap-3 text-sm">
        <span className="font-semibold tabular-nums">{b.inicio}</span>
        <span className="text-ink-2">→</span>
        <span className="font-semibold tabular-nums">{b.fin}</span>
        <span className="text-ink-2">
          {noches(b.inicio, b.fin)} {noches(b.inicio, b.fin) === 1 ? "noche" : "noches"}
        </span>
        {b.reserva && (
          <span className="text-xs text-ink-2">
            Reserva{b.reserva.huesped ? ` · ${b.reserva.huesped}` : ""}
          </span>
        )}
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${FUENTE_STYLE[b.fuente]}`}>
        {b.fuente}
      </span>
    </div>
  );
}
