"use client";

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

export default function ReservasPage() {
  // Primer módulo conectado de verdad a Refine (useTable → @refinedev/supabase
  // → tabla `reservas`) — el resto de páginas de la intranet todavía son
  // esqueletos. Ver docs/arquitectura-migracion.md, Fase 3.
  const { result, tableQuery, currentPage, setCurrentPage, pageCount } = useTable<Reserva>({
    resource: "reservas",
    sorters: { initial: [{ field: "entrada", order: "desc" }] },
    pagination: { pageSize: 20 },
  });

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

      {!tableQuery.isLoading && result.data.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                <th className="px-4 py-3 font-medium">Huésped</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
                <th className="px-4 py-3 font-medium">Salida</th>
                <th className="px-4 py-3 text-right font-medium">Noches</th>
                <th className="px-4 py-3 text-right font-medium">Neto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {r.huesped_nombre}
                    {r.codigo_externo && (
                      <span className="ml-1 text-xs text-ink-2">· {r.codigo_externo}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{r.canal}</td>
                  <td className="px-4 py-3">{r.entrada}</td>
                  <td className="px-4 py-3">{r.salida}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.noches}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${r.neto.toFixed(2)}</td>
                  <td className="px-4 py-3">{ESTADO_LABEL[r.estado]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-md border border-line px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-ink-2">
            Página {currentPage} de {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-md border border-line px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
