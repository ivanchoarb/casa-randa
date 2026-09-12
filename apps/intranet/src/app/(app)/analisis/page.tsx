"use client";

import { useCreate, useDelete, useTable, useUpdate } from "@refinedev/core";
import { usePermisos } from "@/lib/use-permisos";
import { useMemo, useState } from "react";

type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";
interface Reserva {
  id: string;
  entrada: string;
  noches: number;
  neto: number;
  estado: EstadoReserva;
  huesped_pais: string | null;
  huesped_ciudad: string | null;
}

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
  fecha_programada: string | null;
  prioridad: PrioridadCapex;
  estado: EstadoCapex;
  enlace_cotizacion: string | null;
  notas: string | null;
}

interface CodigoDescuento {
  codigo: string;
  descuento_pct: number;
  vigente_desde: string;
  vigente_hasta: string;
  maximo_usos: number;
  usos_actuales: number;
  notas: string | null;
}

const CATEGORIAS: CategoriaCapex[] = [
  "mejora",
  "reparacion",
  "mantenimiento_preventivo",
  "compra_equipo",
  "decoracion",
];
const PRIORIDADES: PrioridadCapex[] = ["alta", "media", "baja"];
const ESTADOS_CAPEX: EstadoCapex[] = ["programada", "cotizada", "aprobada", "realizada"];

const ESTADO_STYLE: Record<EstadoCapex, string> = {
  programada: "bg-panel-2 text-ink-2",
  cotizada: "bg-lamp-bg text-lamp",
  aprobada: "bg-good-bg text-good",
  realizada: "bg-good text-panel",
};

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// El "Comportamiento mensual" de staging (comparado en vivo el 2026-09-11,
// año 2026: RESERVAS/NOCHES/INGRESO NETO calzan exactos con esta misma
// lógica — confirmado antes de construir nada) tiene un bug real: las
// etiquetas de mes están corridas una posición hacia atrás (el conteo de
// enero aparece bajo "Dic", el de febrero bajo "Ene", etc. — los NÚMEROS
// son correctos, solo el nombre del mes está mal). No se replica ese
// desfase aquí — los conteos van bajo su mes real.
function ComparativoAnual({
  reservas,
  cargando,
  error,
}: {
  reservas: Reserva[];
  cargando: boolean;
  error: boolean;
}) {
  const anios = useMemo(() => {
    const set = new Set(reservas.map((r) => Number(r.entrada.slice(0, 4))));
    return Array.from(set).sort((a, b) => b - a);
  }, [reservas]);

  const [anioElegido, setAnioElegido] = useState<number | null>(null);
  const anioActivo = anioElegido ?? anios[0];

  const delAnio = reservas.filter(
    (r) =>
      (r.estado === "confirmada" || r.estado === "completada") &&
      Number(r.entrada.slice(0, 4)) === anioActivo,
  );
  const totalReservas = delAnio.length;
  const totalNoches = delAnio.reduce((s, r) => s + r.noches, 0);
  const ingresoNeto = delAnio.reduce((s, r) => s + r.neto, 0);

  const porMes = MESES.map((_, i) => delAnio.filter((r) => Number(r.entrada.slice(5, 7)) - 1 === i).length);
  const maxMes = Math.max(1, ...porMes);

  const paises = Array.from(new Set(delAnio.map((r) => r.huesped_pais).filter((v): v is string => !!v)));
  const ciudades = Array.from(
    new Set(delAnio.map((r) => r.huesped_ciudad).filter((v): v is string => !!v)),
  );

  if (cargando) return null;
  // Distinguir "falló la conexión" de "no hay datos todavía" — antes
  // mostraban el mismo mensaje ("Todavía no hay reservas"), lo cual es
  // engañoso cuando en realidad hubo un problema de red o de sesión y sí
  // hay reservas reales en Supabase.
  if (error) {
    return (
      <p className="text-sm text-caoba">
        No se pudo conectar a Supabase — completa <code>.env.local</code>, o si ya lo tienes
        configurado, recarga la página.
      </p>
    );
  }
  if (anios.length === 0) {
    return <p className="text-sm text-ink-2">Todavía no hay reservas para comparar año a año.</p>;
  }

  return (
    <section>
      <div className="flex flex-wrap gap-2">
        {anios.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAnioElegido(a)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              a === anioActivo ? "bg-caoba text-panel" : "border border-line text-ink-2"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-panel p-4">
        <div>
          <h2 className="font-bold">Comparativo año a año</h2>
          <p className="text-xs text-ink-2">Reservas, noches, ingresos y temporadas</p>
        </div>
        <span className="rounded-full bg-panel-2 px-3 py-1 text-xs font-semibold text-ink-2">
          {anios.length} años
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs font-medium text-ink-2 uppercase">Reservas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{totalReservas}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs font-medium text-ink-2 uppercase">Noches</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{totalNoches}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-xs font-medium text-ink-2 uppercase">Ingreso neto</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{money(ingresoNeto)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-panel p-4">
        <h3 className="font-semibold">Comportamiento mensual</h3>
        {totalReservas === 0 ? (
          <p className="mt-2 text-sm text-ink-2">Sin reservas en {anioActivo}.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {MESES.map((m, i) =>
              porMes[i] > 0 ? (
                <div key={m} className="flex items-center gap-3">
                  <span className="w-8 text-xs text-ink-2">{m}</span>
                  <div className="h-2 flex-1 rounded-full bg-panel-2">
                    <div
                      className="h-2 rounded-full bg-caoba"
                      style={{ width: `${(porMes[i] / maxMes) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs text-ink-2 tabular-nums">{porMes[i]} res.</span>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-panel p-4">
        <h3 className="font-semibold">Origen de huéspedes</h3>
        <p className="mt-2 text-sm">
          <strong>Países:</strong> {paises.length > 0 ? paises.join(", ") : "Pendiente de registrar"}
        </p>
        <p className="mt-1 text-sm">
          <strong>Ciudades:</strong> {ciudades.length > 0 ? ciudades.join(", ") : "Pendiente de registrar"}
        </p>
        <p className="mt-2 text-xs text-ink-2">
          Completa país y ciudad al editar cada reserva para mejorar la segmentación de campañas.
        </p>
      </div>
    </section>
  );
}

// Lo que todavía se le debe a un proveedor: cualquier plan_compras con un
// monto cotizado que no esté marcado como "realizada" (ya pagada/hecha).
// No es una tabla nueva — se deriva de plan_compras, así que nunca puede
// desincronizarse de lo que se ve más abajo en "Plan anual de compras".
function CuentasPorPagar({ planes, cargando }: { planes: PlanCompra[]; cargando: boolean }) {
  const pendientes = planes.filter((p) => p.estado !== "realizada" && p.cotizacion_usd != null);
  const total = pendientes.reduce((s, p) => s + (p.cotizacion_usd ?? 0), 0);

  const porProveedor = new Map<string, number>();
  for (const p of pendientes) {
    const clave = p.proveedor ?? "Sin proveedor";
    porProveedor.set(clave, (porProveedor.get(clave) ?? 0) + (p.cotizacion_usd ?? 0));
  }

  if (cargando) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Cuentas por pagar</h2>
      <p className="mt-1 text-sm text-ink-2">
        Compras del plan anual con cotización, todavía no marcadas como realizadas.
      </p>

      <div className="mt-4 rounded-xl border border-line bg-panel p-4">
        <p className="text-xs font-medium text-ink-2 uppercase">Total pendiente</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{money(total)}</p>
        <p className="mt-1 text-xs text-ink-2">
          {pendientes.length} compra{pendientes.length === 1 ? "" : "s"} · {porProveedor.size} proveedor
          {porProveedor.size === 1 ? "" : "es"}
        </p>
      </div>

      {pendientes.length > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(porProveedor.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([proveedor, monto]) => (
              <div
                key={proveedor}
                className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3 text-sm"
              >
                <span className="font-medium">{proveedor}</span>
                <span className="font-semibold tabular-nums">{money(monto)}</span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

function PlanCompraItem({ item }: { item: PlanCompra }) {
  const { mutate: actualizar, mutation: actualizando } = useUpdate<PlanCompra>();
  const { mutate: eliminar, mutation: eliminando } = useDelete<PlanCompra>();
  const [editando, setEditando] = useState(false);

  const [categoria, setCategoria] = useState(item.categoria);
  const [concepto, setConcepto] = useState(item.concepto);
  const [proveedor, setProveedor] = useState(item.proveedor ?? "");
  const [cotizacion, setCotizacion] = useState(item.cotizacion_usd?.toString() ?? "");
  const [fechaProgramada, setFechaProgramada] = useState(item.fecha_programada ?? "");
  const [prioridad, setPrioridad] = useState(item.prioridad);
  const [estado, setEstado] = useState(item.estado);
  const [enlace, setEnlace] = useState(item.enlace_cotizacion ?? "");
  const [notas, setNotas] = useState(item.notas ?? "");

  function guardar() {
    actualizar(
      {
        resource: "plan_compras",
        id: item.id,
        values: {
          categoria,
          concepto,
          proveedor: proveedor || null,
          cotizacion_usd: cotizacion ? Number(cotizacion) : null,
          fecha_programada: fechaProgramada || null,
          prioridad,
          estado,
          enlace_cotizacion: enlace || null,
          notas: notas || null,
        },
      },
      { onSuccess: () => setEditando(false) },
    );
  }

  function eliminarItem() {
    if (!window.confirm(`¿Eliminar "${item.concepto}"?`)) return;
    eliminar({ resource: "plan_compras", id: item.id });
  }

  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3 text-sm">
      <button type="button" onClick={() => setEditando(!editando)} className="flex w-full items-center justify-between text-left">
        <p className="font-medium">{item.concepto}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ESTADO_STYLE[item.estado]}`}
        >
          {item.estado}
        </span>
      </button>
      <p className="mt-1 text-xs text-ink-2 capitalize">
        {item.anio} · {item.categoria.replace("_", " ")}
        {item.proveedor ? ` · ${item.proveedor}` : ""}
        {item.cotizacion_usd ? ` · ${money(item.cotizacion_usd)}` : ""}
        {item.fecha_programada ? ` · ${item.fecha_programada}` : ""}
      </p>
      {item.enlace_cotizacion && (
        <a
          href={item.enlace_cotizacion}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs text-caoba hover:underline"
        >
          Ver cotización →
        </a>
      )}
      {item.notas && <p className="mt-1 text-xs text-ink-2">{item.notas}</p>}

      {editando && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <label className="text-xs text-ink-2">
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaCapex)}
              className={`${inputClass} mt-1 block w-full capitalize`}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Concepto
            <input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            Proveedor
            <input
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            Cotización USD
            <input
              type="number"
              value={cotizacion}
              onChange={(e) => setCotizacion(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            Fecha programada
            <input
              type="date"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2">
            Prioridad
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as PrioridadCapex)}
              className={`${inputClass} mt-1 block w-full capitalize`}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-2">
            Estado
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCapex)}
              className={`${inputClass} mt-1 block w-full capitalize`}
            >
              {ESTADOS_CAPEX.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Enlace a cotización
            <input
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <label className="text-xs text-ink-2 sm:col-span-2">
            Notas
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className={`${inputClass} mt-1 block w-full`}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={guardar}
              disabled={actualizando.isPending}
              className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
            >
              {actualizando.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={eliminarItem}
              disabled={eliminando.isPending}
              className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold text-caoba disabled:opacity-60"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanDeCompras({
  planes,
  cargando,
  error,
}: {
  planes: PlanCompra[];
  cargando: boolean;
  error: boolean;
}) {
  const { mutate: crear, mutation } = useCreate<PlanCompra>();
  const isPending = mutation.isPending;

  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCapex>("mejora");
  const [proveedor, setProveedor] = useState("");
  const [cotizacion, setCotizacion] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadCapex>("alta");
  const [estado, setEstado] = useState<EstadoCapex>("programada");
  const [enlace, setEnlace] = useState("");
  const [notas, setNotas] = useState("");

  function agregar() {
    if (!concepto.trim()) return;
    crear(
      {
        resource: "plan_compras",
        values: {
          anio: Number(anio) || new Date().getFullYear(),
          categoria,
          concepto,
          proveedor: proveedor || null,
          cotizacion_usd: cotizacion ? Number(cotizacion) : null,
          fecha_programada: fechaProgramada || null,
          prioridad,
          estado,
          enlace_cotizacion: enlace || null,
          notas: notas || null,
        },
      },
      {
        onSuccess: () => {
          setConcepto("");
          setProveedor("");
          setCotizacion("");
          setFechaProgramada("");
          setEnlace("");
          setNotas("");
        },
      },
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Plan anual de compras, mejoras y reparaciones</h2>
      <p className="mt-1 text-sm text-ink-2">
        De la casa (muebles, equipo, mantenimiento) — no confundir con la tienda del huésped, ver
        la nota en <code>supabase/migrations/0004_tienda_y_planificacion.sql</code>.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-line bg-panel p-4 sm:grid-cols-2">
        <label className="text-xs text-ink-2">
          Año
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2">
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaCapex)}
            className={`${inputClass} mt-1 block w-full capitalize`}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Concepto
          <input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2">
          Proveedor
          <input
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2">
          Cotización USD
          <input
            type="number"
            value={cotizacion}
            onChange={(e) => setCotizacion(e.target.value)}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2">
          Fecha programada
          <input
            type="date"
            value={fechaProgramada}
            onChange={(e) => setFechaProgramada(e.target.value)}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2">
          Prioridad
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value as PrioridadCapex)}
            className={`${inputClass} mt-1 block w-full capitalize`}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2">
          Estado
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCapex)}
            className={`${inputClass} mt-1 block w-full capitalize`}
          >
            {ESTADOS_CAPEX.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-2 sm:col-span-2">
          Enlace a cotización
          <input
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://…"
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <label className="text-xs text-ink-2 sm:col-span-2">
          Notas
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className={`${inputClass} mt-1 block w-full`}
          />
        </label>
        <button
          type="button"
          onClick={agregar}
          disabled={isPending}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60 sm:col-span-2"
        >
          Guardar planificación
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!cargando && planes.length > 0 && (
        <div className="mt-4 space-y-2">
          {planes.map((item) => (
            <PlanCompraItem key={item.id} item={item} />
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
  const [notas, setNotas] = useState("");

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
          notas: notas || null,
        },
      },
      {
        onSuccess: () => {
          setCodigo("");
          setPct("");
          setDesde("");
          setHasta("");
          setMaximo("0");
          setNotas("");
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
        <input
          placeholder="Notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={`${inputClass} min-w-[10rem] flex-1`}
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
                <th className="px-4 py-3 font-medium">Notas</th>
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
                  <td className="px-4 py-3 text-ink-2">{c.notas ?? "—"}</td>
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
  const { can } = usePermisos();
  // Quinto módulo conectado a datos reales. El comparativo año a año ya no
  // está diferido: con las 69 reservas reales importadas el 2026-09-11 hay
  // datos suficientes para calcularlo de verdad, verificado contra
  // staging.randahome.com/intranet/analisis/ (mismos RESERVAS/NOCHES/
  // INGRESO NETO para 2026 y 2027, comparado en vivo).
  const { result: reservasResult, tableQuery: reservasQuery } = useTable<Reserva>({
    resource: "reservas",
    queryOptions: { enabled: can("analisis_financiero") },
    pagination: { pageSize: 500 },
  });

  // plan_compras se lee una sola vez aquí arriba — Cuentas por pagar y el
  // Plan anual de compras son dos vistas del mismo dato, no dos fuentes.
  const { result: planesResult, tableQuery: planesQuery } = useTable<PlanCompra>({
    resource: "plan_compras",
    queryOptions: { enabled: can("plan_compras") || can("cuentas_pagar") },
    sorters: { initial: [{ field: "anio", order: "desc" }] },
    pagination: { pageSize: 100 },
  });
  const planes = planesResult.data ?? [];

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">
        Inteligencia del negocio
      </p>
      <h1 className="mt-1 text-2xl font-bold">Histórico, planificación y marketing</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Los datos originales permanecen intactos y cada año se conserva además un cierre
        consolidado.
      </p>

      <div className="mt-8">
        {can("analisis_financiero") && <ComparativoAnual
          reservas={reservasResult.data ?? []}
          cargando={reservasQuery.isLoading}
          error={reservasQuery.isError}
        />}
        {can("plan_compras") && <PlanDeCompras planes={planes} cargando={planesQuery.isLoading} error={planesQuery.isError} />}
        {can("cuentas_pagar") && <CuentasPorPagar planes={planes} cargando={planesQuery.isLoading} />}
        {can("descuentos") && <CodigosDeDescuento />}
      </div>
    </div>
  );
}
