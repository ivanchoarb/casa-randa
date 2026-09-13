"use client";

import { useCreate, useTable } from "@refinedev/core";
import { useMemo, useState } from "react";

type EstadoConciliacion = "pendiente" | "conciliado" | "diferencia";
type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

interface Reserva {
  id: string;
  huesped_nombre: string;
  canal: string;
  codigo_externo: string | null;
  neto: number;
  estado: EstadoReserva;
}

interface Movimiento {
  id: string;
  fecha: string;
  descripcion: string;
  referencia_bancaria: string | null;
  valor_esperado: number;
  valor_recibido: number | null;
  reserva_id: string | null;
  estado: EstadoConciliacion;
}

const inputClass = "rounded-md border border-line bg-ground px-2 py-1.5 text-sm";
const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO_STYLE: Record<EstadoConciliacion, string> = {
  pendiente: "bg-panel-2 text-ink-2",
  conciliado: "bg-good-bg text-good",
  diferencia: "bg-lamp-bg text-lamp",
};
const ESTADO_LABEL: Record<EstadoConciliacion, string> = {
  pendiente: "Pendiente",
  conciliado: "Conciliado",
  diferencia: "Diferencia",
};

export default function ConciliacionPage() {
  // Séptimo y último módulo conectado a datos reales — cierra la Fase 4.
  // El lado "esperado" hoy se llena a mano, eligiendo la reserva; cuando
  // se integren las APIs de historial de PagueloFacil/Yappy (ver
  // docs/logica-negocio-y-flujos.md → "Conciliación bancaria") ese paso
  // se puede automatizar sin tocar esta pantalla. Confirmar que el
  // dinero llegó al banco se mantiene manual siempre — no hay
  // integración con Banco General ni la va a haber por ahora.
  const { result: movResult, tableQuery: movQuery } = useTable<Movimiento>({
    resource: "movimientos_bancarios",
    sorters: { initial: [{ field: "fecha", order: "desc" }] },
    pagination: { pageSize: 300 },
  });
  const { result: reservasResult } = useTable<Reserva>({
    resource: "reservas",
    pagination: { pageSize: 500 },
  });
  const { mutate: crear, mutation: creando } = useCreate<Movimiento>();

  const movimientos = useMemo(() => movResult.data ?? [], [movResult.data]);
  const reservas = useMemo(() => reservasResult.data ?? [], [reservasResult.data]);

  const reservasSinRelacionar = useMemo(() => {
    const relacionadas = new Set(movimientos.map((m) => m.reserva_id).filter(Boolean));
    return reservas.filter(
      (r) => (r.estado === "confirmada" || r.estado === "completada") && !relacionadas.has(r.id),
    );
  }, [reservas, movimientos]);

  // 2026-09-13, a pedido de Ivan: los totales de esta página sumaban TODOS
  // los movimientos bancarios sin importar el año — un depósito de una
  // reserva de 2027 se sumaba al acumulado de 2026 y seguiría creciendo
  // para siempre. Se filtra por el año de `fecha` del movimiento (la fecha
  // real del depósito, no la de `entrada` de la reserva — hay movimientos
  // sin reserva relacionada todavía, `reserva_id` null, que no tienen otra
  // fecha de la cual partir), mismo patrón de selector de año que ya usa
  // "Anticipos de comisiones de Iván" en Contabilidad. `reservasSinRelacionar`
  // se deja sin filtrar a propósito: hace falta poder registrar un depósito
  // atrasado de un año anterior aunque la vista esté mirando el año actual.
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const anios = Array.from({ length: 4 }, (_, i) => anioActual - 2 + i);

  const movimientosDelAnio = useMemo(
    () => movimientos.filter((m) => new Date(`${m.fecha}T12:00:00`).getFullYear() === anio),
    [movimientos, anio],
  );

  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [valorRecibido, setValorRecibido] = useState("");
  const [reservaId, setReservaId] = useState("");

  const registrados = movimientosDelAnio.reduce((sum, m) => sum + (m.valor_recibido ?? 0), 0);
  const conciliado = movimientosDelAnio
    .filter((m) => m.estado === "conciliado")
    .reduce((sum, m) => sum + (m.valor_recibido ?? 0), 0);
  const pendiente = movimientosDelAnio
    .filter((m) => m.estado === "pendiente")
    .reduce((sum, m) => sum + m.valor_esperado, 0);
  const diferencias = movimientosDelAnio
    .filter((m) => m.estado === "diferencia")
    .reduce((sum, m) => sum + Math.abs((m.valor_recibido ?? 0) - m.valor_esperado), 0);

  function registrar() {
    if (!fecha || !descripcion || !valorRecibido) return;
    const reserva = reservas.find((r) => r.id === reservaId);
    const esperado = reserva?.neto ?? Number(valorRecibido);
    const recibido = Number(valorRecibido);
    const estado: EstadoConciliacion = reserva
      ? Math.abs(recibido - esperado) < 0.01
        ? "conciliado"
        : "diferencia"
      : "pendiente";

    crear(
      {
        resource: "movimientos_bancarios",
        values: {
          fecha,
          descripcion,
          referencia_bancaria: referencia || null,
          valor_esperado: esperado,
          valor_recibido: recibido,
          reserva_id: reserva?.id ?? null,
          origen: "manual",
          estado,
        },
      },
      {
        onSuccess: () => {
          setFecha("");
          setDescripcion("");
          setReferencia("");
          setValorRecibido("");
          setReservaId("");
        },
      },
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Banco General</p>
      <h1 className="mt-1 text-2xl font-bold">Conciliación bancaria</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-2">
        Compara los depósitos recibidos con los pagos registrados por Airbnb, Vrbo y reservas
        directas.
      </p>

      {movQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!movQuery.isError && (
        <>
          <label className="mt-4 block text-xs text-ink-2">
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

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Movimientos registrados</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{money(registrados)}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Conciliado</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-good">{money(conciliado)}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Pendiente</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{money(pendiente)}</p>
            </div>
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="text-xs font-medium text-ink-2 uppercase">Diferencias</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-caoba">{money(diferencias)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Registrar depósito o transferencia</h2>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
              <input
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={`${inputClass} min-w-[10rem] flex-1`}
              />
              <input
                placeholder="Referencia bancaria"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className={`${inputClass} w-40`}
              />
              <input
                placeholder="Valor recibido USD"
                type="number"
                value={valorRecibido}
                onChange={(e) => setValorRecibido(e.target.value)}
                className={`${inputClass} w-36`}
              />
              <select
                value={reservaId}
                onChange={(e) => setReservaId(e.target.value)}
                className={`${inputClass} min-w-[14rem]`}
              >
                <option value="">Sin relacionar todavía</option>
                {reservasSinRelacionar.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.huesped_nombre} · {r.canal}
                    {r.codigo_externo ? ` · ${r.codigo_externo}` : ""} · {money(r.neto)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={registrar}
                disabled={creando.isPending}
                className="rounded-md bg-caoba px-4 py-1.5 text-sm font-semibold text-panel disabled:opacity-60"
              >
                Guardar y comparar
              </button>
            </div>
          </div>

          {!movQuery.isLoading && movimientosDelAnio.length === 0 && (
            <p className="mt-6 text-sm text-ink-2">
              {movimientos.length === 0
                ? "Todavía no hay movimientos bancarios registrados."
                : `Sin movimientos bancarios en ${anio}.`}
            </p>
          )}

          {!movQuery.isLoading && movimientosDelAnio.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-ink-2 uppercase">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Descripción / referencia</th>
                    <th className="px-4 py-3 text-right font-medium">Esperado</th>
                    <th className="px-4 py-3 text-right font-medium">Banco</th>
                    <th className="px-4 py-3 text-right font-medium">Diferencia</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosDelAnio.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 tabular-nums">{m.fecha}</td>
                      <td className="px-4 py-3">
                        {m.descripcion}
                        {m.referencia_bancaria && (
                          <span className="ml-1 text-xs text-ink-2">· {m.referencia_bancaria}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(m.valor_esperado)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.valor_recibido !== null ? money(m.valor_recibido) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.valor_recibido !== null ? money(m.valor_recibido - m.valor_esperado) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[m.estado]}`}>
                          {ESTADO_LABEL[m.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
