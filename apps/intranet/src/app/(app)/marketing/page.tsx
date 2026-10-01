"use client";

import { useMemo, useRef, useState } from "react";
import { useCreate, useGetIdentity, useTable } from "@refinedev/core";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { CancellationPolicy, PaymentPlan } from "@casa-randa/pricing";
import {
  CAMPO_LABEL,
  importarContactos,
  leerArchivoContactos,
  sugerirMapeo,
  type ArchivoContactos,
  type CampoContacto,
  type Mapeo,
  type ResultadoImportContactos,
} from "@/lib/importar-contactos";
import { IDIOMA_LABEL, idiomaSugerido } from "@/lib/idioma";
import { usePermisos } from "@/lib/use-permisos";

interface Solicitud {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  entrada: string;
  salida: string;
  huespedes: number;
  plan_tarifa: CancellationPolicy;
  plan_pago: PaymentPlan;
  notas: string | null;
  estado: "pendiente" | "aprobada" | "rechazada" | "convertida";
  created_at: string;
}

interface ContactoMarketing {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  entrada: string | null;
  salida: string | null;
  fuente: "formulario_web" | "importado" | "manual";
  created_at: string;
}

const ESTADO_LABEL: Record<Solicitud["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  convertida: "Convertida en reserva",
};
const FUENTE_LABEL: Record<ContactoMarketing["fuente"], string> = {
  formulario_web: "Formulario web",
  importado: "Importado",
  manual: "Manual",
};

interface Contacto {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  fuente: string;
  estado: Solicitud["estado"] | null;
  entrada: string | null;
  salida: string | null;
  created_at: string;
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

type Filtro = "todos" | Solicitud["estado"];
type FiltroIdioma = "todos" | "es" | "en" | "desconocido";

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";

// 2026-09-13, a pedido de Ivan: gráfico de países de origen de los
// contactos de marketing (leads con consentimiento — no huéspedes reales,
// eso ya existe aparte en Análisis > "Origen de huéspedes"). Cuenta sobre
// TODA la audiencia con consentimiento, no sobre `filtrados` — así el
// gráfico no cambia de forma cada vez que alguien escribe algo en el
// buscador, coherente con las tres tarjetas de resumen de arriba (que
// tampoco usan `filtrados`).
function paisesOrdenados(contactos: Contacto[]): [string, number][] {
  const conteo = new Map<string, number>();
  for (const c of contactos) {
    const clave = c.pais?.trim() || "Sin país registrado";
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return Array.from(conteo.entries()).sort((a, b) => b[1] - a[1]);
}

function PaisesDeOrigen({ contactos }: { contactos: Contacto[] }) {
  const porPais = useMemo(() => paisesOrdenados(contactos), [contactos]);
  const max = Math.max(1, ...porPais.map(([, n]) => n));

  return (
    <div className="mt-6 rounded-xl border border-line bg-panel p-4">
      <h3 className="font-semibold">De qué países nos han visitado</h3>
      <p className="mt-1 text-xs text-ink-2">
        País de origen de los {contactos.length} contacto{contactos.length === 1 ? "" : "s"} con
        consentimiento de marketing (cotizaciones web e importados).
      </p>
      <div className="mt-3 space-y-2">
        {porPais.map(([pais, n]) => (
          <div key={pais} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs text-ink-2" title={pais}>
              {pais}
            </span>
            <div className="h-2 flex-1 rounded-full bg-panel-2">
              <div className="h-2 rounded-full bg-caoba" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="w-20 shrink-0 text-right text-xs text-ink-2 tabular-nums">
              {n} ({((n / contactos.length) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportarContactos({ onImportado }: { onImportado: () => void }) {
  const { data: identity } = useGetIdentity<{ id: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<ArchivoContactos | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo | null>(null);
  const [confirmaConsentimiento, setConfirmaConsentimiento] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportContactos | null>(null);

  async function leer() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setResultado(null);
    setLeyendo(true);
    try {
      const buf = await file.arrayBuffer();
      const a = leerArchivoContactos(buf);
      setArchivo(a);
      setMapeo(sugerirMapeo(a.encabezados));
      setConfirmaConsentimiento(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
      setArchivo(null);
      setMapeo(null);
    } finally {
      setLeyendo(false);
    }
  }

  async function confirmar() {
    if (!archivo || !mapeo) return;
    setImportando(true);
    setError(null);
    try {
      const r = await importarContactos(archivo, mapeo, identity?.id);
      setResultado(r);
      setArchivo(null);
      setMapeo(null);
      setConfirmaConsentimiento(false);
      if (inputRef.current) inputRef.current.value = "";
      if (r.procesados > 0) onImportado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar el archivo.");
    } finally {
      setImportando(false);
    }
  }

  const listo = !!mapeo && mapeo.nombre !== null && mapeo.email !== null && confirmaConsentimiento;

  return (
    <details className="mt-6 rounded-xl border border-line bg-panel p-5">
      <summary className="cursor-pointer font-semibold">Importar contactos desde CSV o Excel</summary>
      <p className="mt-3 text-xs text-ink-2">
        Para contactos que ya tengas en FormsApp u otra herramienta. Sube un CSV o Excel, indica
        qué columna del archivo es cuál de nuestros campos, y confirma el consentimiento antes de
        guardar — no se asume solo porque venga en el archivo. Si vuelves a importar un correo ya
        existente, se actualiza en vez de duplicarse. Los PDF no están soportados todavía: si tus
        datos solo existen en PDF, expórtalos primero a CSV/Excel desde FormsApp, o manda un
        ejemplo real para revisar si se puede leer directo.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" aria-label="Archivo de contactos" className="text-sm" />
        <button
          type="button"
          onClick={() => void leer()}
          disabled={leyendo}
          className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold disabled:opacity-60"
        >
          {leyendo ? "Leyendo…" : "Leer archivo"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-caoba">{error}</p>}

      {resultado && (
        <div className="mt-3 text-sm">
          <p>{resultado.procesados} contactos importados.</p>
          {resultado.omitidos.length > 0 && (
            <details className="mt-1 text-xs text-ink-2">
              <summary className="cursor-pointer">{resultado.omitidos.length} fila(s) omitida(s)</summary>
              <ul className="mt-1 list-disc pl-4">
                {resultado.omitidos.map((o, i) => (
                  <li key={i}>
                    Fila {o.fila}: {o.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {archivo && mapeo && (
        <div className="mt-4 space-y-4 rounded-lg border border-line p-4">
          <div>
            <p className="text-sm font-semibold">¿Qué columna es cada campo?</p>
            <p className="mt-1 text-xs text-ink-2">Nombre y Correo son obligatorios; el resto es opcional.</p>
            {(() => {
              const sinDetectar = (Object.keys(CAMPO_LABEL) as CampoContacto[]).filter(
                (c) => c !== "notas" && mapeo[c] === null,
              );
              return sinDetectar.length > 0 ? (
                <p className="mt-2 rounded-md bg-lamp-bg px-3 py-2 text-xs text-lamp">
                  No se detectó sola una columna para: {sinDetectar.map((c) => CAMPO_LABEL[c]).join(", ")}. Si tu
                  archivo sí trae esos datos, selecciona la columna correcta a mano abajo antes de importar.
                </p>
              ) : null;
            })()}
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(CAMPO_LABEL) as CampoContacto[]).map((campo) => (
                <label key={campo} className="text-xs text-ink-2">
                  {CAMPO_LABEL[campo]}
                  <select
                    value={mapeo[campo] ?? ""}
                    onChange={(e) =>
                      setMapeo({ ...mapeo, [campo]: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className="mt-1 block w-full rounded-md border border-line bg-ground px-2 py-1.5 text-sm"
                  >
                    <option value="">Ninguna</option>
                    {archivo.encabezados.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {archivo.filas.length > 0 && mapeo.nombre !== null && mapeo.email !== null && (
            <div>
              <p className="text-xs font-semibold text-ink-2 uppercase">Vista previa</p>
              <div className="mt-1 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="py-1 pr-4">Nombre</th>
                      <th className="py-1 pr-4">Apellido</th>
                      <th className="py-1 pr-4">Correo</th>
                      <th className="py-1 pr-4">País</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivo.filas.slice(0, 3).map((f, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-4">{f[mapeo.nombre as number]}</td>
                        <td className="py-1 pr-4">{mapeo.apellido !== null ? f[mapeo.apellido] : "—"}</td>
                        <td className="py-1 pr-4">{f[mapeo.email as number]}</td>
                        <td className="py-1 pr-4">{mapeo.pais !== null ? f[mapeo.pais] : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-ink-2">{archivo.filas.length} fila(s) en total.</p>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmaConsentimiento}
              onChange={(e) => setConfirmaConsentimiento(e.target.checked)}
            />
            Confirmo que estos contactos aceptaron ser contactados con fines de marketing (por
            ejemplo, marcaron una casilla de consentimiento equivalente en el formulario de
            origen).
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void confirmar()}
              disabled={!listo || importando}
              className="rounded-md bg-caoba px-4 py-2 text-sm font-semibold text-panel disabled:opacity-50"
            >
              {importando ? "Importando…" : "Importar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setArchivo(null);
                setMapeo(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={importando}
              className="rounded-md border border-line px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </details>
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
    <section className="mt-10 rounded-xl border border-line bg-panel p-4">
      <h2 className="text-lg font-bold">Códigos de descuento</h2>

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-ground/40 p-3">
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
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
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

/**
 * Audiencia = dos fuentes, unificadas:
 * - `solicitudes` con consentimiento de marketing marcado en el formulario
 *   público (QuoteCalculator.tsx).
 * - `contactos_marketing` (0019_contactos_marketing.sql): subidos por CSV/
 *   Excel, o eventualmente desde un formulario de registro nativo en la
 *   página — ver ImportarContactos arriba.
 * En ningún caso las reservas reales (Airbnb/Vrbo/CSV): esas nunca piden ni
 * guardan consentimiento de marketing, así que incluirlas sería contactar
 * gente que nunca aceptó recibirlo.
 */
export default function MarketingPage() {
  const { can } = usePermisos();
  const solicitudesTable = useTable<Solicitud>({
    resource: "solicitudes",
    filters: { permanent: [{ field: "consentimiento", operator: "eq", value: true }] },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });
  const contactosTable = useTable<ContactoMarketing>({
    resource: "contactos_marketing",
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });

  const cargando = solicitudesTable.tableQuery.isLoading || contactosTable.tableQuery.isLoading;
  const conError = solicitudesTable.tableQuery.isError || contactosTable.tableQuery.isError;

  const contactos = useMemo<Contacto[]>(() => {
    const deSolicitudes: Contacto[] = (solicitudesTable.result.data ?? []).map((s) => ({
      id: `solicitud-${s.id}`,
      nombre: s.nombre,
      apellido: s.apellido,
      email: s.email,
      telefono: s.telefono,
      pais: s.pais,
      ciudad: s.ciudad,
      fuente: "Cotización web",
      estado: s.estado,
      entrada: s.entrada,
      salida: s.salida,
      created_at: s.created_at,
    }));
    const deImportados: Contacto[] = (contactosTable.result.data ?? []).map((c) => ({
      id: `contacto-${c.id}`,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      telefono: c.telefono,
      pais: c.pais,
      ciudad: c.ciudad,
      fuente: FUENTE_LABEL[c.fuente],
      estado: null,
      entrada: c.entrada,
      salida: c.salida,
      created_at: c.created_at,
    }));
    return [...deSolicitudes, ...deImportados].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [solicitudesTable.result.data, contactosTable.result.data]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<Filtro>("todos");
  const [filtroIdioma, setFiltroIdioma] = useState<FiltroIdioma>("todos");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return contactos.filter((c) => {
      if (filtroEstado !== "todos" && c.estado !== filtroEstado) return false;
      if (filtroIdioma !== "todos" && (idiomaSugerido(c.pais) ?? "desconocido") !== filtroIdioma) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        (c.apellido ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.telefono ?? "").toLowerCase().includes(q)
      );
    });
  }, [contactos, busqueda, filtroEstado, filtroIdioma]);

  const hoy = new Date();
  const nuevosDelMes = contactos.filter((c) => {
    const d = new Date(c.created_at);
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
  }).length;
  const conSolicitud = contactos.filter((c) => c.estado !== null);
  const convertidos = conSolicitud.filter((c) => c.estado === "aprobada" || c.estado === "convertida").length;
  const tasaConversion = conSolicitud.length > 0 ? (convertidos / conSolicitud.length) * 100 : 0;

  function exportar() {
    const filas = filtrados.map((c) => ({
      Nombre: c.nombre,
      Apellido: c.apellido ?? "",
      Correo: c.email,
      Teléfono: c.telefono ?? "",
      "Lugar de origen": c.pais ?? "",
      Ciudad: c.ciudad ?? "",
      Idioma: idiomaSugerido(c.pais) ? IDIOMA_LABEL[idiomaSugerido(c.pais) as "es" | "en"] : "",
      Llegada: c.entrada ?? "",
      Salida: c.salida ?? "",
      Estado: c.estado ? ESTADO_LABEL[c.estado] : "",
      Fuente: c.fuente,
      "Registrado el": c.created_at.slice(0, 10),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), "Clientes potenciales");
    XLSX.writeFile(wb, "casa-randa-clientes-potenciales.xlsx");
  }

  function recargar() {
    void solicitudesTable.tableQuery.refetch();
    void contactosTable.tableQuery.refetch();
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes potenciales y marketing</h1>
        <Link href="/marketing/campanas" className="text-sm font-semibold text-caoba hover:underline">
          Campañas de correo →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Personas que pidieron una cotización desde la página, o que importaste, y aceptaron ser
        contactadas.
      </p>

      <ImportarContactos onImportado={recargar} />

      {cargando && <p className="mt-6 text-sm text-ink-2">Cargando…</p>}
      {conError && (
        <p role="alert" className="mt-6 text-caoba">
          No se pudo cargar la lista.{" "}
          <button onClick={recargar} className="underline">
            Reintentar
          </button>
        </p>
      )}

      {!cargando && !conError && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Contactos con consentimiento</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{contactos.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Nuevos este mes</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{nuevosDelMes}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Tasa de conversión</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{tasaConversion.toFixed(0)}%</p>
              <p className="mt-1 text-xs text-ink-2">De quienes pidieron cotización — aprobadas o convertidas</p>
            </div>
          </div>

          {contactos.length > 0 && <PaisesDeOrigen contactos={contactos} />}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono"
              className="min-w-[16rem] flex-1 rounded-md border border-line bg-ground px-3 py-2 text-sm"
            />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as Filtro)}
              className="rounded-md border border-line bg-ground px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              {(Object.entries(ESTADO_LABEL) as [Solicitud["estado"], string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filtroIdioma}
              onChange={(e) => setFiltroIdioma(e.target.value as FiltroIdioma)}
              className="rounded-md border border-line bg-ground px-3 py-2 text-sm"
            >
              <option value="todos">Cualquier idioma</option>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="desconocido">Sin país registrado</option>
            </select>
            <button
              type="button"
              onClick={exportar}
              disabled={filtrados.length === 0}
              className="rounded-md border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Exportar ({filtrados.length})
            </button>
          </div>

          {contactos.length === 0 ? (
            <p className="mt-6 text-sm text-ink-2">
              Todavía no hay contactos con consentimiento de marketing. Aparecen aquí en cuanto
              alguien pida una cotización desde la página y acepte ser contactado, o cuando
              importes un archivo arriba.
            </p>
          ) : filtrados.length === 0 ? (
            <p className="mt-6 text-sm text-ink-2">Ningún contacto coincide con ese filtro.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Apellido</th>
                    <th className="p-4">Correo</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4">Lugar de origen</th>
                    <th className="p-4">Idioma</th>
                    <th className="p-4">Llegada</th>
                    <th className="p-4">Salida</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Fuente</th>
                    <th className="p-4">Registrado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="p-4 font-medium">{c.nombre}</td>
                      <td className="p-4">{c.apellido || "—"}</td>
                      <td className="p-4">{c.email}</td>
                      <td className="p-4">{c.telefono || "—"}</td>
                      <td className="p-4 text-xs text-ink-2">
                        {[c.pais, c.ciudad].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="p-4 text-xs text-ink-2">
                        {idiomaSugerido(c.pais) ? IDIOMA_LABEL[idiomaSugerido(c.pais) as "es" | "en"] : "—"}
                      </td>
                      <td className="p-4 text-xs">{c.entrada || "—"}</td>
                      <td className="p-4 text-xs">{c.salida || "—"}</td>
                      <td className="p-4">
                        {c.estado ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              c.estado === "pendiente"
                                ? "bg-lamp-bg text-lamp"
                                : c.estado === "rechazada"
                                  ? "bg-panel-2 text-ink-2"
                                  : "bg-good-bg text-good"
                            }`}
                          >
                            {ESTADO_LABEL[c.estado]}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-2">—</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-ink-2">{c.fuente}</td>
                      <td className="p-4 text-xs text-ink-2">{c.created_at.slice(0, 10)}</td>
                      <td className="p-4">
                        <div className="flex gap-3">
                          <a href={`mailto:${c.email}`} className="text-xs font-semibold text-caoba hover:underline">
                            Correo
                          </a>
                          {c.telefono && (
                            <a
                              href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-caoba hover:underline"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-ink-2">
        Esta lista también exporta para usarla con una herramienta externa (Mailchimp, WhatsApp
        Business, etc.), o se puede mandar por correo directo desde aquí en{" "}
        <Link href="/marketing/campanas" className="underline">
          Campañas de correo
        </Link>{" "}
        — de a uno, con un límite diario, nunca todo de golpe, para no arriesgar la entrega de
        los correos reales de reservas que usan la misma cuenta.
      </p>

      {can("descuentos") && <CodigosDeDescuento />}
    </div>
  );
}
