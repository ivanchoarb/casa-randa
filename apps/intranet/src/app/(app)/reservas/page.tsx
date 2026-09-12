"use client";

import { useMemo, useState } from "react";
import { useTable } from "@refinedev/core";

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
