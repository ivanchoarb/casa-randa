"use client";

import { useCreate, useTable } from "@refinedev/core";
import { useState } from "react";

type CategoriaCapex =
  | "mejora"
  | "reparacion"
  | "mantenimiento_preventivo"
  | "compra_equipo"
  | "decoracion";
type PrioridadCapex = "alta" | "media" | "baja";
type EstadoCapex = "programada" | "cotizada" | "aprobada" | "realizada";

interface PlanCompra {
  id: string;
  anio: number;
  categoria: CategoriaCapex;
  concepto: string;
  proveedor: string | null;
  cotizacion_usd: number | null;
  prioridad: PrioridadCapex;
  estado: EstadoCapex;
}

interface CodigoDescuento {
  codigo: string;
  descuento_pct: number;
  vigente_desde: string;
  vigente_hasta: string;
  maximo_usos: number;
  usos_actuales: number;
}

const CATEGORIAS: CategoriaCapex[] = [
  "mejora",
  "reparacion",
  "mantenimiento_preventivo",
  "compra_equipo",
  "decoracion",
];
const PRIORIDADES: PrioridadCapex[] = ["alta", "media", "baja"];

const ESTADO_STYLE: Record<EstadoCapex, string> = {
  programada: "bg-panel-2 text-ink-2",
  cotizada: "bg-lamp-bg text-lamp",
  aprobada: "bg-good-bg text-good",
  realizada: "bg-good text-panel",
};

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";

function PlanDeCompras() {
  const { result, tableQuery } = useTable<PlanCompra>({
    resource: "plan_compras",
    sorters: { initial: [{ field: "anio", order: "desc" }] },
    pagination: { pageSize: 100 },
  });
  const { mutate: crear, mutation } = useCreate<PlanCompra>();
  const isPending = mutation.isPending;

  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCapex>("mejora");
  const [prioridad, setPrioridad] = useState<PrioridadCapex>("media");
  const [cotizacion, setCotizacion] = useState("");
  const [proveedor, setProveedor] = useState("");

  function agregar() {
    if (!concepto.trim()) return;
    crear(
      {
        resource: "plan_compras",
        values: {
          anio: new Date().getFullYear(),
          categoria,
          concepto,
          proveedor: proveedor || null,
          cotizacion_usd: cotizacion ? Number(cotizacion) : null,
          prioridad,
          estado: "programada",
        },
      },
      {
        onSuccess: () => {
          setConcepto("");
          setProveedor("");
          setCotizacion("");
        },
      },
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold">Plan anual de compras, mejoras y reparaciones</h2>
      <p className="mt-1 text-sm text-ink-2">
        De la casa (muebles, equipo, mantenimiento) — no confundir con la tienda del huésped, ver
        la nota en <code>supabase/migrations/0004_tienda_y_planificacion.sql</code>.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-panel p-3">
        <input
          placeholder="Concepto"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className={`${inputClass} min-w-[12rem] flex-1`}
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaCapex)}
          className={`${inputClass} capitalize`}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          placeholder="Proveedor"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className={`${inputClass} w-36`}
        />
        <input
          placeholder="Cotización USD"
          type="number"
          value={cotizacion}
          onChange={(e) => setCotizacion(e.target.value)}
          className={`${inputClass} w-32`}
        />
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as PrioridadCapex)}
          className={`${inputClass} capitalize`}
        >
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={agregar}
          disabled={isPending}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
        >
          Agregar
        </button>
      </div>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!tableQuery.isLoading && result.data.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.data.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.concepto}</p>
                <p className="text-xs text-ink-2 capitalize">
                  {item.anio} · {item.categoria.replace("_", " ")}
                  {item.proveedor ? ` · ${item.proveedor}` : ""}
                  {item.cotizacion_usd ? ` · $${item.cotizacion_usd.toFixed(2)}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ESTADO_STYLE[item.estado]}`}
              >
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CodigosDeDescuento() {
  const { result, tableQuery } = useTable<CodigoDescuento>({
    resource: "codigos_descuento",
    sorters: { initial: [{ field: "vigente_desde", order: "desc" }] },
    pagination: { pageSize: 100 },
  });
  const { mutate: crear, mutation } = useCreate<CodigoDescuento>();
  const isPending = mutation.isPending;

  const [codigo, setCodigo] = useState("");
  const [pct, setPct] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [maximo, setMaximo] = useState("0");

  function agregar() {
    if (!codigo.trim() || !pct || !desde || !hasta) return;
    crear(
      {
        resource: "codigos_descuento",
        values: {
          codigo: codigo.toUpperCase(),
          descuento_pct: Number(pct),
          vigente_desde: desde,
          vigente_hasta: hasta,
          maximo_usos: Number(maximo) || 0,
        },
      },
      {
        onSuccess: () => {
          setCodigo("");
          setPct("");
          setDesde("");
          setHasta("");
          setMaximo("0");
        },
      },
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Códigos de descuento</h2>

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-panel p-3">
        <input
          placeholder="Código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className={`${inputClass} w-40 uppercase`}
        />
        <input
          placeholder="% descuento"
          type="number"
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          className={`${inputClass} w-28`}
        />
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Máx. usos (0 = sin límite)"
          type="number"
          value={maximo}
          onChange={(e) => setMaximo(e.target.value)}
          className={`${inputClass} w-44`}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={isPending}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
        >
          Crear código
        </button>
      </div>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!tableQuery.isLoading && result.data.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 text-right font-medium">%</th>
                <th className="px-4 py-3 font-medium">Vigencia</th>
                <th className="px-4 py-3 text-right font-medium">Usos</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.codigo} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.codigo}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.descuento_pct}%</td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.vigente_desde} → {c.vigente_hasta}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.usos_actuales} / {c.maximo_usos || "∞"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AnalisisPage() {
  // Quinto módulo conectado a datos reales. El comparativo año a año que
  // muestra la intranet de WordPress necesita reservas reales para
  // calcularse (agregaciones sobre `reservas`) — se deja para cuando haya
  // datos, en vez de simularlo con cifras de ejemplo.
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">
        Inteligencia del negocio
      </p>
      <h1 className="mt-1 text-2xl font-bold">Análisis y planificación</h1>

      <div className="mt-8">
        <PlanDeCompras />
        <CodigosDeDescuento />
      </div>
    </div>
  );
}
