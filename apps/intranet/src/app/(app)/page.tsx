"use client";

import { useTable } from "@refinedev/core";

type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

interface Reserva {
  id: string;
  huesped_nombre: string;
  canal: string;
  codigo_externo: string | null;
  entrada: string;
  salida: string;
  bruto: number;
  comision_marquelda: number;
  comision_ivan: number;
  neto: number;
  estado: EstadoReserva;
}

interface Gasto {
  fecha: string;
  valor: number;
}

const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InicioPage() {
  // Ahora conectado a datos reales (2026-09-11) — mismo cálculo que
  // usa Contabilidad, para que las dos pantallas nunca se contradigan.
  const { result: reservasResult, tableQuery } = useTable<Reserva>({
    resource: "reservas",
    pagination: { pageSize: 500 },
  });
  const { result: gastosResult } = useTable<Gasto>({
    resource: "gastos",
    pagination: { pageSize: 500 },
  });

  const reservas = reservasResult.data ?? [];
  const gastos = gastosResult.data ?? [];

  const hoy = new Date().toISOString().slice(0, 10);
  const anio = new Date().getFullYear();
  const mes = new Date().getMonth();

  const activas = reservas.filter((r) => r.estado === "confirmada" || r.estado === "completada");
  const delAnio = activas.filter((r) => new Date(`${r.entrada}T12:00:00`).getFullYear() === anio);
  const delMes = delAnio.filter((r) => new Date(`${r.entrada}T12:00:00`).getMonth() === mes);

  const reservaEnCurso = activas.find((r) => r.entrada <= hoy && hoy < r.salida);
  const ingresosDelMes = delMes.reduce((sum, r) => sum + r.neto, 0);
  const ingresosAcumulados = delAnio.reduce((sum, r) => sum + r.neto, 0);
  const gastosDelAnio = gastos
    .filter((g) => new Date(`${g.fecha}T12:00:00`).getFullYear() === anio)
    .reduce((sum, g) => sum + g.valor, 0);
  const comisionesDelAnio = delAnio.reduce(
    (sum, r) => sum + r.comision_marquelda + r.comision_ivan,
    0,
  );
  const saldoNetoPropietario = ingresosAcumulados - comisionesDelAnio - gastosDelAnio;

  const tarjetas = [
    {
      titulo: "Reserva en curso",
      valor: reservaEnCurso
        ? `${reservaEnCurso.huesped_nombre}`
        : tableQuery.isLoading
          ? "…"
          : "Ninguna",
      nota: reservaEnCurso
        ? `${reservaEnCurso.canal}${reservaEnCurso.codigo_externo ? " · " + reservaEnCurso.codigo_externo : ""} · ${reservaEnCurso.entrada} → ${reservaEnCurso.salida}`
        : "Hoy, " + hoy,
    },
    { titulo: "Ingresos del mes", valor: money(ingresosDelMes), nota: "Después de comisión de plataforma" },
    { titulo: "Ingresos acumulados", valor: money(ingresosAcumulados), nota: `Acumulado ${anio}` },
    {
      titulo: "Saldo neto del propietario",
      valor: money(saldoNetoPropietario),
      nota: "Después de comisiones y gastos del año",
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Resumen ejecutivo</p>
      <h1 className="mt-1 text-2xl font-bold">Hoy en Casa Randa</h1>
      <p className="mt-2 text-sm text-ink-2">{hoy}</p>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isError && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <div key={t.titulo} className="rounded-xl border border-line bg-panel p-5">
              <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">{t.titulo}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{t.valor}</p>
              <p className="mt-1 text-xs text-ink-2">{t.nota}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
