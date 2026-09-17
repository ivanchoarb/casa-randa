"use client";

import { useTable } from "@refinedev/core";
import { useMemo, useState } from "react";
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

// Entrada/estado nunca se enmascaran en reservas_acceso para quien tiene el
// permiso "reservas" (Empleado y Host lo tienen por defecto) — a diferencia
// de las cifras financieras de las tarjetas de arriba, este gráfico no
// necesita "finanzas_propietario" para funcionar.
function ActividadMensual({ reservas, anioActual }: { reservas: Reserva[]; anioActual: number }) {
  const activas = useMemo(
    () => reservas.filter((r) => r.estado === "confirmada" || r.estado === "completada"),
    [reservas],
  );
  const anios = useMemo(() => {
    const set = new Set(activas.map((r) => Number(r.entrada.slice(0, 4))));
    set.add(anioActual);
    return Array.from(set).sort((a, b) => b - a);
  }, [activas, anioActual]);

  const [anioElegido, setAnioElegido] = useState(anioActual);
  const anioActivo = anios.includes(anioElegido) ? anioElegido : anios[0];

  const delAnio = activas.filter((r) => Number(r.entrada.slice(0, 4)) === anioActivo);
  const porMes = MESES.map((_, i) => delAnio.filter((r) => Number(r.entrada.slice(5, 7)) - 1 === i).length);
  const maxMes = Math.max(0, ...porMes);
  const hayDatos = maxMes > 0;
  const indiceMax = hayDatos ? porMes.indexOf(maxMes) : -1;
  const indiceMin = hayDatos ? porMes.indexOf(Math.min(...porMes)) : -1;

  return (
    <div className="mt-10 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Meses más activos</p>
          <p className="mt-1 text-xs text-ink-2">Reservas por mes de entrada — temporada alta y baja</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {anios.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAnioElegido(a)}
              className={`btn-press num rounded-full px-3 py-1 text-xs font-semibold ${
                a === anioActivo ? "bg-caoba text-panel" : "border border-line text-ink-2 hover:border-caoba"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {!hayDatos ? (
        <p className="mt-4 text-sm text-ink-2">Sin reservas confirmadas en {anioActivo}.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <p>
              <span className="text-ink-2">Mes más activo — </span>
              <span className="font-semibold text-caoba">
                {capitalizar(MESES[indiceMax])} · {porMes[indiceMax]} {porMes[indiceMax] === 1 ? "reserva" : "reservas"}
              </span>
            </p>
            <p>
              <span className="text-ink-2">Mes más flojo — </span>
              <span className="font-semibold text-lamp">
                {capitalizar(MESES[indiceMin])} · {porMes[indiceMin]} {porMes[indiceMin] === 1 ? "reserva" : "reservas"}
              </span>
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {MESES.map((m, i) => (
              <div key={m} className="flex items-center gap-3">
                <span className="w-8 text-xs text-ink-2">{capitalizar(m.slice(0, 3))}</span>
                <div className="h-1.5 flex-1 bg-panel-2">
                  <div
                    className={`h-1.5 transition-[width] duration-500 ${
                      i === indiceMax ? "bg-caoba" : i === indiceMin ? "bg-lamp" : "bg-good"
                    }`}
                    style={{ width: `${(porMes[i] / maxMes) * 100}%` }}
                  />
                </div>
                <span className="num w-16 text-right text-xs text-ink-2">{porMes[i]} res.</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
      <p className="eyebrow">Resumen ejecutivo</p>
      <h1 className="disp mt-1 text-3xl">Hoy en Casa Randa</h1>
      <p className="num mt-2 text-sm text-ink-2">
        {hoy} <span className="ml-1 rounded-full bg-panel-2 px-2 py-0.5 text-xs font-semibold">HOY</span>
      </p>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isError && (
        <div className="mt-8 space-y-6">
          {/* La próxima reserva es el hecho que de verdad importa hoy —
              se declara directo, sin caja, como el titular de la página;
              las cifras de dinero van después, en su propia fila. */}
          {can("proxima_reserva") && (
            <div>
              <p className="eyebrow">Próxima reserva</p>
              {proximaReserva ? (
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="disp text-2xl">{proximaReserva.huesped_nombre}</p>
                  <p className="num text-sm text-ink-2">
                    {capitalizar(proximaReserva.canal)}
                    {proximaReserva.codigo_externo ? ` · ${proximaReserva.codigo_externo}` : ""} ·{" "}
                    {proximaReserva.entrada} → {proximaReserva.salida} · {proximaReserva.noches} noches
                  </p>
                  {can("reservas") && (
                    <Link href="/reservas" className="text-sm font-semibold text-caoba hover:underline">
                      Ver reserva →
                    </Link>
                  )}
                </div>
              ) : (
                <p className="disp mt-1.5 text-2xl">{tableQuery.isLoading ? "…" : "Ninguna"}</p>
              )}
            </div>
          )}

          {(tarjetas.some((t) => can(t.permiso)) || can("liquidacion_host")) && (
            <div className="flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-5">
              {tarjetas
                .filter((t) => can(t.permiso))
                .map((t) => (
                  <div key={t.titulo}>
                    <p className="eyebrow">{t.titulo}</p>
                    <p className="num mt-1 text-2xl">{t.valor}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{t.nota}</p>
                  </div>
                ))}

              {can("liquidacion_host") && (
                <div>
                  <p className="eyebrow">Liquidación Marquelda</p>
                  <p className="disp mt-1 text-xl">{capitalizar(MESES[mes])}</p>
                  <button
                    type="button"
                    onClick={() => descargarLiquidacionMarquelda(delMes, anio, mes)}
                    disabled={tableQuery.isLoading}
                    className="btn-press mt-2 rounded-md bg-caoba px-3 py-1.5 text-xs font-semibold text-panel disabled:opacity-60"
                  >
                    Descargar liquidación
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!tableQuery.isError && can("reservas") && <ActividadMensual reservas={reservas} anioActual={anio} />}
    </div>
  );
}
