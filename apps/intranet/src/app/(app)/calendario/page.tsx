"use client";

import { useTable } from "@refinedev/core";

interface Bloqueo {
  id: string;
  inicio: string;
  fin: string;
  fuente: "airbnb" | "vrbo" | "directo";
}

const FUENTE_STYLE: Record<Bloqueo["fuente"], string> = {
  airbnb: "bg-caoba/10 text-caoba",
  vrbo: "bg-lamp-bg text-lamp",
  directo: "bg-good-bg text-good",
};

const MES_FORMATO = new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric" });

function noches(inicio: string, fin: string) {
  const d1 = new Date(`${inicio}T12:00:00`);
  const d2 = new Date(`${fin}T12:00:00`);
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}

function agruparPorMes(bloqueos: Bloqueo[]) {
  const grupos = new Map<string, Bloqueo[]>();
  for (const b of bloqueos) {
    const fecha = new Date(`${b.inicio}T12:00:00`);
    const clave = MES_FORMATO.format(fecha);
    const grupo = grupos.get(clave) ?? [];
    grupo.push(b);
    grupos.set(clave, grupo);
  }
  return grupos;
}

export default function CalendarioPage() {
  // Segundo módulo conectado a datos reales (después de Reservas) — ver
  // docs/arquitectura-migracion.md, Fase 3. Agrupa por mes igual que la
  // intranet de WordPress; el job que llena esta tabla desde iCal
  // (Fase 2) todavía no existe, así que hoy solo se ve lo que se cargue
  // a mano o por seed.
  const { result, tableQuery } = useTable<Bloqueo>({
    resource: "bloqueos_calendario",
    sorters: { initial: [{ field: "inicio", order: "asc" }] },
    pagination: { pageSize: 200 },
  });

  const grupos = agruparPorMes(result.data ?? []);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Disponibilidad</p>
      <h1 className="mt-1 text-2xl font-bold">Calendario y disponibilidad</h1>
      <p className="mt-2 text-sm text-ink-2">
        {tableQuery.isLoading ? "Cargando…" : `${result.total ?? result.data.length} bloqueos`}
      </p>

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> (ver{" "}
          <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && result.data.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">
          Sin bloqueos todavía. Los trae la sincronización de iCal (Fase 2, no implementada) o se
          cargan a mano mientras tanto.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {Array.from(grupos.entries()).map(([mes, items]) => (
          <div key={mes}>
            <h2 className="text-sm font-semibold text-ink-2 capitalize">{mes}</h2>
            <div className="mt-3 space-y-2">
              {items.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3"
                >
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="font-semibold tabular-nums">{b.inicio}</span>
                    <span className="text-ink-2">→</span>
                    <span className="font-semibold tabular-nums">{b.fin}</span>
                    <span className="text-ink-2">
                      {noches(b.inicio, b.fin)} {noches(b.inicio, b.fin) === 1 ? "noche" : "noches"}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${FUENTE_STYLE[b.fuente]}`}
                  >
                    {b.fuente}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
