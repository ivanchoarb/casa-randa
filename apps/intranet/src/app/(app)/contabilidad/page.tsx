"use client";

import { useCreate, useDelete, useTable } from "@refinedev/core";
import { useMemo, useRef, useState } from "react";
import { importarReservasCSV, type ResultadoImport } from "@/lib/importar-reservas";

type Persona = "marquelda" | "ivan";
type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";
type CategoriaGasto =
  | "reparacion"
  | "fumigacion"
  | "limpieza"
  | "mantenimiento"
  | "servicios_publicos"
  | "insumos"
  | "honorarios"
  | "otros";

interface Reserva {
  id: string;
  canal: string;
  codigo_externo: string | null;
  huesped_nombre: string;
  entrada: string;
  salida: string;
  noches: number;
  bruto: number;
  comision_plataforma: number;
  recibido: number;
  comision_marquelda: number;
  comision_ivan: number;
  neto: number;
  estado: EstadoReserva;
}

interface Anticipo {
  id: string;
  persona: Persona;
  fecha: string;
  valor: number;
  referencia: string | null;
  motivo: string | null;
}

interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  concepto: string;
  proveedor: string | null;
  valor: number;
  medio_pago: string | null;
}

const CATEGORIAS: CategoriaGasto[] = [
  "reparacion",
  "fumigacion",
  "limpieza",
  "mantenimiento",
  "servicios_publicos",
  "insumos",
  "honorarios",
  "otros",
];

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Ojo: "recibido" (bruto - comisión de plataforma) es lo que staging llama
// "Ingresos netos acumulados" — NO usar `neto` aquí, que ya tiene también
// restadas las comisiones de Marquelda e Iván. Usar `neto` en este cálculo
// resta esas comisiones dos veces en el saldo del propietario (bug real,
// encontrado y corregido el 2026-09-11 comparando cifra por cifra contra
// staging.randahome.com/intranet/contabilidad/).
// 2026-09-13, a pedido de Ivan: antes esta sección solo mostraba el año
// calendario actual, sin forma de ver el acumulado de un año con reservas
// pero que todavía no "empieza" (2027, con reservas ya confirmadas desde
// hoy). Mismo selector de año que ya usan Anticipos de comisiones más
// abajo y Conciliación bancaria — mismo rango (actual-2 .. actual+1), así
// que 2027 ya entra sin tocar el cálculo del rango. Las tarjetas de
// "comisión del mes actual" solo tienen sentido para el año calendario
// real de hoy — no existe un "mes actual" de 2027 mientras estamos en
// 2026 — así que desaparecen cuando se elige otro año, en vez de mostrar
// una cifra sin sentido.
function ResumenFinanciero({ reservas, gastos }: { reservas: Reserva[]; gastos: Gasto[] }) {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const anios = Array.from({ length: 4 }, (_, i) => anioActual - 2 + i);
  const mes = new Date().getMonth();

  const activas = reservas.filter((r) => r.estado === "confirmada" || r.estado === "completada");
  const delAnio = activas.filter((r) => new Date(`${r.entrada}T12:00:00`).getFullYear() === anio);
  const delMes = anio === anioActual ? delAnio.filter((r) => new Date(`${r.entrada}T12:00:00`).getMonth() === mes) : [];

  const recibidoAcumulado = delAnio.reduce((sum, r) => sum + r.recibido, 0);
  const comisionMesMarquelda = delMes.reduce((sum, r) => sum + r.comision_marquelda, 0);
  const comisionMesIvan = delMes.reduce((sum, r) => sum + r.comision_ivan, 0);
  const comisionAnualMarquelda = delAnio.reduce((sum, r) => sum + r.comision_marquelda, 0);
  const comisionAnualIvan = delAnio.reduce((sum, r) => sum + r.comision_ivan, 0);
  const gastosDelAnio = gastos
    .filter((g) => new Date(`${g.fecha}T12:00:00`).getFullYear() === anio)
    .reduce((sum, g) => sum + g.valor, 0);
  const saldoNetoPropietario =
    recibidoAcumulado - (comisionAnualMarquelda + comisionAnualIvan) - gastosDelAnio;

  const tarjetas = [
    {
      titulo: `Ingresos netos acumulados ${anio}`,
      valor: money(recibidoAcumulado),
      nota: "Después de comisiones de plataforma",
    },
    ...(anio === anioActual
      ? [
          {
            titulo: `${MESES[mes]} · Marquelda`,
            valor: money(comisionMesMarquelda),
            nota: "Comisión del mes actual",
          },
          { titulo: `${MESES[mes]} · Iván`, valor: money(comisionMesIvan), nota: "Comisión del mes actual" },
        ]
      : []),
    { titulo: `${anio} · Marquelda`, valor: money(comisionAnualMarquelda), nota: "Acumulado anual" },
    { titulo: `${anio} · Iván`, valor: money(comisionAnualIvan), nota: "Acumulado anual" },
    {
      titulo: `Saldo neto del propietario ${anio}`,
      valor: money(saldoNetoPropietario),
      nota: "Después de comisiones y gastos del año",
    },
  ];

  return (
    <div>
      <label className="mb-4 block text-xs text-ink-2">
        Año
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className={`${inputClass} mt-1 block`}
        >
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">{t.titulo}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{t.valor}</p>
            <p className="mt-1 text-xs text-ink-2">{t.nota}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Staging (staging.randahome.com/intranet/contabilidad/) solo lleva
// anticipos de comisión para Iván — Marquelda no toma adelantos. El schema
// sigue soportando ambas personas (persona_comision), pero esta sección
// se fija en "ivan" para calzar con el sistema real.
function AnticiposComision({ reservas }: { reservas: Reserva[] }) {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const persona: Persona = "ivan";

  const { result, tableQuery } = useTable<Anticipo>({
    resource: "anticipos_comision",
    filters: { permanent: [{ field: "persona", operator: "eq", value: persona }] },
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
    pagination: { pageSize: 200 },
  });
  const { mutate: crear, mutation: creando } = useCreate<Anticipo>();
  const { mutate: eliminar } = useDelete<Anticipo>();

  const [fecha, setFecha] = useState("");
  const [valor, setValor] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivo, setMotivo] = useState("");

  const anticipos = result.data ?? [];

  function agregar() {
    if (!fecha || !valor) return;
    crear(
      {
        resource: "anticipos_comision",
        values: { persona, fecha, valor: Number(valor), referencia: referencia || null, motivo: motivo || null },
      },
      {
        onSuccess: () => {
          setFecha("");
          setValor("");
          setReferencia("");
          setMotivo("");
        },
      },
    );
  }

  const comisionAnual = reservas
    .filter(
      (r) =>
        (r.estado === "confirmada" || r.estado === "completada") &&
        new Date(`${r.entrada}T12:00:00`).getFullYear() === anio,
    )
    .reduce((sum, r) => sum + r.comision_ivan, 0);

  const anticiposDelAnio = anticipos.filter((a) => new Date(`${a.fecha}T12:00:00`).getFullYear() === anio);
  const anticiposPagados = anticiposDelAnio.reduce((sum, a) => sum + a.valor, 0);
  const saldoPendiente = comisionAnual - anticiposPagados;

  const anios = Array.from({ length: 4 }, (_, i) => anioActual - 2 + i);

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Anticipos de comisiones de Iván</h2>
      <p className="mt-1 text-sm text-ink-2">Control anual de pagos parciales y saldo pendiente.</p>

      <div className="mt-4 flex items-end gap-2">
        <label className="text-xs text-ink-2">
          Año
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className={`${inputClass} mt-1 block`}
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel p-4 text-center">
          <p className="text-xs text-ink-2 uppercase">Comisión acumulada {anio} (USD)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{money(comisionAnual)}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4 text-center">
          <p className="text-xs text-ink-2 uppercase">Anticipos pagados (USD)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{money(anticiposPagados)}</p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4 text-center">
          <p className="text-xs text-ink-2 uppercase">Saldo real pendiente (USD)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-caoba">{money(saldoPendiente)}</p>
          <p className="mt-1 text-xs text-ink-2">Comisiones menos anticipos</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-panel p-3">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        <input
          placeholder="Valor USD"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={`${inputClass} w-32`}
        />
        <input
          placeholder="Referencia"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          className={`${inputClass} w-40`}
        />
        <input
          placeholder="Motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={creando.isPending}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
        >
          Registrar anticipo
        </button>
      </div>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!tableQuery.isLoading && anticiposDelAnio.length > 0 && (
        <div className="mt-4 space-y-2">
          {anticiposDelAnio.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{a.fecha}</span>
                <span className="ml-2 text-ink-2">
                  {a.motivo ?? "Sin motivo"}
                  {a.referencia ? ` · ${a.referencia}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tabular-nums">{money(a.valor)}</span>
                <button
                  type="button"
                  onClick={() => eliminar({ resource: "anticipos_comision", id: a.id })}
                  className="text-xs text-caoba hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Solo el "formato Casa Randa" (mismas columnas que "Descargar Excel" más
// abajo) — verificado bajando y desarmando un export real de staging el
// 2026-09-11. Los reportes crudos de Airbnb/Vrbo todavía no, por falta de
// una muestra real para verificar sus columnas (ver src/lib/importar-reservas.ts).
function ImportarCSV({ onImportado }: { onImportado: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function procesar() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setProcesando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await importarReservasCSV(file);
      setResultado(r);
      if (inputRef.current) inputRef.current.value = "";
      if (r.procesadas > 0) onImportado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido al procesar el archivo.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Importar o actualizar CSV</h2>
      <p className="mt-1 text-sm text-ink-2">
        Acepta el formato Casa Randa (las mismas columnas que produce &quot;Descargar Excel&quot; más
        abajo — Cliente, Plataforma, Reserva, Check-in, Check-out, Valor bruto, Comisión
        plataforma, Estado). Al volver a cargar un archivo, las reservas se actualizan por código
        y no se duplican. Las comisiones internas se calculan solas (10% Marquelda, 9% Iván sobre
        el valor recibido). Los reportes crudos de Airbnb o Vrbo (exportados directo desde su
        panel de anfitrión) todavía no están soportados — si tienes uno real, compártelo para
        agregar soporte.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel p-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          aria-label="Archivo de reservas"
          className="text-sm"
        />
        <button
          type="button"
          onClick={procesar}
          disabled={procesando}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
        >
          {procesando ? "Procesando…" : "Procesar archivo"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-caoba">{error}</p>}

      {resultado && (
        <div className="mt-3 text-sm">
          <p className="text-ink">{resultado.procesadas} reservas procesadas.</p>
          {resultado.omitidas.length > 0 && (
            <div className="mt-2 text-ink-2">
              <p>{resultado.omitidas.length} filas omitidas:</p>
              <ul className="mt-1 list-inside list-disc">
                {resultado.omitidas.map((o, i) => (
                  <li key={i}>
                    Fila {o.fila}: {o.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Gastos() {
  const { result, tableQuery } = useTable<Gasto>({
    resource: "gastos",
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
    pagination: { pageSize: 200 },
  });
  const { mutate: crear, mutation: creando } = useCreate<Gasto>();

  const [fecha, setFecha] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("otros");
  const [concepto, setConcepto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [valor, setValor] = useState("");
  const [medioPago, setMedioPago] = useState("");

  function agregar() {
    if (!fecha || !concepto || !valor) return;
    crear(
      {
        resource: "gastos",
        values: {
          fecha,
          categoria,
          concepto,
          proveedor: proveedor || null,
          valor: Number(valor),
          medio_pago: medioPago || null,
        },
      },
      {
        onSuccess: () => {
          setFecha("");
          setConcepto("");
          setProveedor("");
          setValor("");
          setMedioPago("");
        },
      },
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold">Gastos y costos</h2>

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-panel p-3">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
          className={`${inputClass} capitalize`}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          placeholder="Concepto"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className={`${inputClass} min-w-[10rem] flex-1`}
        />
        <input
          placeholder="Proveedor"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className={`${inputClass} w-36`}
        />
        <input
          placeholder="Valor USD"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={`${inputClass} w-28`}
        />
        <input
          placeholder="Medio de pago"
          value={medioPago}
          onChange={(e) => setMedioPago(e.target.value)}
          className={`${inputClass} w-36`}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={creando.isPending}
          className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
        >
          Guardar gasto
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
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((g) => (
                <tr key={g.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 tabular-nums">{g.fecha}</td>
                  <td className="px-4 py-3 capitalize">{g.categoria.replace("_", " ")}</td>
                  <td className="px-4 py-3">{g.concepto}</td>
                  <td className="px-4 py-3 text-ink-2">{g.proveedor ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(g.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

function IngresosYReservas({ reservas, loading }: { reservas: Reserva[]; loading: boolean }) {
  const [filtro, setFiltro] = useState<EstadoReserva | "todas">("confirmada");
  const filtradas = filtro === "todas" ? reservas : reservas.filter((r) => r.estado === filtro);

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Ingresos y reservas</h2>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as EstadoReserva | "todas")}
          className={inputClass}
        >
          <option value="confirmada">Confirmadas</option>
          <option value="completada">Completadas</option>
          <option value="cancelada">Canceladas</option>
          <option value="pendiente">Pendientes</option>
          <option value="todas">Todas</option>
        </select>
      </div>

      {!loading && filtradas.length === 0 && (
        <p className="mt-4 text-sm text-ink-2">Sin reservas en este filtro.</p>
      )}

      {!loading && filtradas.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                <th className="px-4 py-3 font-medium">Reserva</th>
                <th className="px-4 py-3 font-medium">F. entr.</th>
                <th className="px-4 py-3 font-medium">F. sal.</th>
                <th className="px-4 py-3 text-right font-medium">Bruto</th>
                <th className="px-4 py-3 text-right font-medium">Platf.</th>
                <th className="px-4 py-3 text-right font-medium">Marq.</th>
                <th className="px-4 py-3 text-right font-medium">Iván</th>
                <th className="px-4 py-3 text-right font-medium">Neto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {r.huesped_nombre}
                    <span className="ml-1 text-xs text-ink-2 capitalize">· {r.canal}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.entrada}</td>
                  <td className="px-4 py-3 tabular-nums">{r.salida}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(r.bruto)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(r.comision_plataforma)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(r.comision_marquelda)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(r.comision_ivan)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(r.neto)}</td>
                  <td className="px-4 py-3">{ESTADO_LABEL[r.estado]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ContabilidadPage() {
  // Sexto módulo conectado a datos reales, y el primero de la Fase 4
  // (mayor riesgo financiero — ver docs/arquitectura-migracion.md).
  // Deliberadamente NO incluye: envío de liquidaciones por correo (falta
  // conectar el SMTP de Dongee, ver docs/logica-negocio-y-flujos.md).
  // El import de CSV (más abajo) solo cubre el formato Casa Randa —
  // los reportes crudos de Airbnb/Vrbo siguen pendientes por falta de
  // una muestra real para verificar sus columnas.
  const { result: reservasResult, tableQuery: reservasQuery } = useTable<Reserva>({
    resource: "reservas",
    sorters: { initial: [{ field: "entrada", order: "desc" }] },
    pagination: { pageSize: 500 },
  });
  const { result: gastosResult } = useTable<Gasto>({
    resource: "gastos",
    pagination: { pageSize: 500 },
  });

  const reservas = useMemo(() => reservasResult.data ?? [], [reservasResult.data]);
  const gastos = useMemo(() => gastosResult.data ?? [], [gastosResult.data]);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Finanzas</p>
      <h1 className="mt-1 text-2xl font-bold">Contabilidad y liquidaciones</h1>
      {!reservasQuery.isError && !reservasQuery.isLoading && (
        <p className="mt-1 text-sm text-ink-2">{reservas.length} reservas registradas</p>
      )}

      {reservasQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> a partir de{" "}
          <code>.env.example</code>.
        </p>
      )}

      {!reservasQuery.isError && (
        <>
          <div className="mt-6">
            <ResumenFinanciero reservas={reservas} gastos={gastos} />
          </div>
          <AnticiposComision reservas={reservas} />
          <ImportarCSV onImportado={() => reservasQuery.refetch()} />
          <Gastos />
          <IngresosYReservas reservas={reservas} loading={reservasQuery.isLoading} />
        </>
      )}
    </div>
  );
}
