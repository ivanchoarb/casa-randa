"use client";

import { useTable } from "@refinedev/core";
import { usePermisos } from "@/lib/use-permisos";
import Link from "next/link";
import { descargarLiquidacionMarquelda } from "@/lib/liquidacion";

type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

interface Reserva {
  id: string;
  huesped_nombre: string;
  canal: string;
  codigo_externo: string | null;
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

interface Gasto {
  fecha: string;
  valor: number;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const money = (n: number) =>
  `$${n.toLocaleString("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InicioPage() {
  const { can } = usePermisos();
  // Conectado a datos reales (2026-09-11), mismo cálculo que usa
  // Contabilidad para que las dos pantallas nunca se contradigan. Tarjetas
  // y el botón de liquidación calzan con staging.randahome.com/intranet/
  // (comparado en vivo el 2026-09-11, incluyendo el formato exacto del
  // Excel que descarga "Descargar liquidación" ahí).
  const { result: reservasResult, tableQuery } = useTable<Reserva>({
    resource: "reservas",
    pagination: { pageSize: 500 },
  });
  const { result: gastosResult } = useTable<Gasto>({
    resource: "gastos",
    queryOptions: { enabled: can("finanzas_propietario") },
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

  // "Próxima reserva": la próxima llegada activa desde hoy — staging
  // muestra esto, no "la que está en curso ahora mismo".
  const proximaReserva = activas
    .filter((r) => r.entrada >= hoy)
    .sort((a, b) => a.entrada.localeCompare(b.entrada))[0];

  // "recibido" (bruto - comisión de plataforma), no "neto" (que ya resta
  // también las comisiones de Marquelda/Iván) — usar `neto` aquí duplica
  // esa resta en el saldo del propietario. Mismo cálculo que Contabilidad,
  // verificado cifra por cifra contra staging el 2026-09-11.
  const ingresosDelMes = delMes.reduce((sum, r) => sum + r.recibido, 0);
  const ingresosAcumulados = delAnio.reduce((sum, r) => sum + r.recibido, 0);
  const comisionMesMarquelda = delMes.reduce((sum, r) => sum + r.comision_marquelda, 0);
  const gastosDelAnio = gastos
    .filter((g) => new Date(`${g.fecha}T12:00:00`).getFullYear() === anio)
    .reduce((sum, g) => sum + g.valor, 0);
  const comisionesDelAnio = delAnio.reduce(
    (sum, r) => sum + r.comision_marquelda + r.comision_ivan,
    0,
  );
  const saldoNetoPropietario = ingresosAcumulados - comisionesDelAnio - gastosDelAnio;

  const tarjetas = [
    { permiso: "ingresos_mes" as const, titulo: `Ingresos de ${capitalizar(MESES[mes])}`, valor: money(ingresosDelMes), nota: "Después de comisión de plataforma" },
    { permiso: "comision_host" as const, titulo: "Comisión Host (Marquelda)", valor: money(comisionMesMarquelda), nota: `${capitalizar(MESES[mes])} ${anio}` },
    { permiso: "finanzas_propietario" as const, titulo: "Ingresos acumulados", valor: money(ingresosAcumulados), nota: `Acumulado ${anio}` },
    {
      permiso: "finanzas_propietario" as const,
      titulo: "Saldo neto propietario",
      valor: money(saldoNetoPropietario),
      nota: "Después de comisiones y gastos del año",
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Resumen ejecutivo</p>
      <h1 className="mt-1 text-2xl font-bold">Hoy en Casa Randa</h1>
      <p className="mt-2 text-sm text-ink-2">
        {hoy} <span className="ml-1 rounded-full bg-panel-2 px-2 py-0.5 text-xs font-semibold">HOY</span>
      </p>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isError && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {can("proxima_reserva") && <div className="rounded-xl border border-line bg-panel p-5">
            <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">Próxima reserva</p>
            {proximaReserva ? (
              <>
                <p className="mt-2 text-xl font-bold">{proximaReserva.huesped_nombre}</p>
                <p className="mt-1 text-xs text-ink-2">
                  {capitalizar(proximaReserva.canal)}
                  {proximaReserva.codigo_externo ? ` · ${proximaReserva.codigo_externo}` : ""}
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  {proximaReserva.entrada} → {proximaReserva.salida} · {proximaReserva.noches} noches
                </p>
                {can("reservas") && <Link href="/reservas" className="mt-2 inline-block text-xs font-semibold text-caoba hover:underline">
                  Ver reserva →
                </Link>}
              </>
            ) : (
              <p className="mt-2 text-xl font-bold">{tableQuery.isLoading ? "…" : "Ninguna"}</p>
            )}
          </div>}

          {tarjetas.filter(t => can(t.permiso)).map((t) => (
            <div key={t.titulo} className="rounded-xl border border-line bg-panel p-5">
              <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">{t.titulo}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{t.valor}</p>
              <p className="mt-1 text-xs text-ink-2">{t.nota}</p>
            </div>
          ))}

          {can("liquidacion_host") && <div className="rounded-xl border border-line bg-panel p-5">
            <p className="text-xs font-medium tracking-wide text-ink-2 uppercase">Liquidación Marquelda</p>
            <p className="mt-2 text-xl font-bold">{capitalizar(MESES[mes])}</p>
            <button
              type="button"
              onClick={() => descargarLiquidacionMarquelda(delMes, anio, mes)}
              disabled={tableQuery.isLoading}
              className="mt-3 rounded-md bg-caoba px-3 py-1.5 text-xs font-semibold text-panel disabled:opacity-60"
            >
              Descargar liquidación
            </button>
          </div>}
        </div>
      )}
    </div>
  );
}
