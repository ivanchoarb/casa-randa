"use client";

import { useMemo, useState } from "react";
import { useTable } from "@refinedev/core";
import * as XLSX from "xlsx";
import type { CancellationPolicy, PaymentPlan } from "@casa-randa/pricing";

interface Solicitud {
  id: string;
  nombre: string;
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

const ESTADO_LABEL: Record<Solicitud["estado"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  convertida: "Convertida en reserva",
};

type Filtro = "todos" | Solicitud["estado"];

/**
 * Audiencia = solicitudes con consentimiento de marketing marcado en el
 * formulario público (QuoteCalculator.tsx) — no las reservas reales
 * (Airbnb/Vrbo/CSV): esas nunca piden ni guardan ese consentimiento, así
 * que incluirlas aquí sería contactar gente que nunca aceptó recibir
 * marketing. `solicitudes` no tiene columnas financieras, así que a
 * diferencia de `reservas` no hace falta enmascarar nada por permiso — solo
 * filtrar filas, que ya hace la política RLS (0018_permiso_marketing.sql).
 */
export default function MarketingPage() {
  const { result, tableQuery } = useTable<Solicitud>({
    resource: "solicitudes",
    filters: { permanent: [{ field: "consentimiento", operator: "eq", value: true }] },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });

  const contactos = useMemo(() => result.data ?? [], [result.data]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<Filtro>("todos");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return contactos.filter((c) => {
      if (filtroEstado !== "todos" && c.estado !== filtroEstado) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.telefono ?? "").toLowerCase().includes(q)
      );
    });
  }, [contactos, busqueda, filtroEstado]);

  const hoy = new Date();
  const nuevosDelMes = contactos.filter((c) => {
    const d = new Date(c.created_at);
    return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
  }).length;
  const convertidos = contactos.filter((c) => c.estado === "aprobada" || c.estado === "convertida").length;
  const tasaConversion = contactos.length > 0 ? (convertidos / contactos.length) * 100 : 0;

  function exportar() {
    const filas = filtrados.map((c) => ({
      Nombre: c.nombre,
      Correo: c.email,
      Teléfono: c.telefono ?? "",
      País: c.pais ?? "",
      Ciudad: c.ciudad ?? "",
      "Fechas solicitadas": `${c.entrada} → ${c.salida}`,
      Huéspedes: c.huespedes,
      Estado: ESTADO_LABEL[c.estado],
      "Registrado el": c.created_at.slice(0, 10),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), "Clientes potenciales");
    XLSX.writeFile(wb, "casa-randa-clientes-potenciales.xlsx");
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Ventas directas</p>
      <h1 className="mt-1 text-2xl font-bold">Clientes potenciales y marketing</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Personas que pidieron una cotización desde la página y marcaron la casilla de
        consentimiento para ser contactadas — útil como lista base para una campaña de correo o
        WhatsApp fuera de esta app.
      </p>

      {tableQuery.isLoading && <p className="mt-6 text-sm text-ink-2">Cargando…</p>}
      {tableQuery.isError && (
        <p role="alert" className="mt-6 text-caoba">
          No se pudo cargar la lista.{" "}
          <button onClick={() => void tableQuery.refetch()} className="underline">
            Reintentar
          </button>
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && (
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
              <p className="mt-1 text-xs text-ink-2">Aprobadas o convertidas en reserva</p>
            </div>
          </div>

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
              alguien pida una cotización desde la página y acepte ser contactado.
            </p>
          ) : filtrados.length === 0 ? (
            <p className="mt-6 text-sm text-ink-2">Ningún contacto coincide con ese filtro.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Origen</th>
                    <th className="p-4">Fechas pedidas</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Registrado</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="p-4 font-medium">{c.nombre}</td>
                      <td className="p-4">
                        <p>{c.email}</p>
                        {c.telefono && <p className="text-xs text-ink-2">{c.telefono}</p>}
                      </td>
                      <td className="p-4 text-xs text-ink-2">
                        {[c.ciudad, c.pais].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="p-4 text-xs">
                        {c.entrada} → {c.salida}
                      </td>
                      <td className="p-4">
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
                      </td>
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
        Esta lista es para exportar o contactar de uno en uno — no manda campañas masivas desde
        aquí. El correo transaccional que usan las cotizaciones no está pensado para envíos
        masivos de marketing; usar esta lista con una herramienta dedicada (Mailchimp, WhatsApp
        Business, etc.) evita poner en riesgo la entrega de los correos reales de reservas.
      </p>
    </div>
  );
}
