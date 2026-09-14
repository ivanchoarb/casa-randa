"use client";

import { useState } from "react";
import { useTable } from "@refinedev/core";
import { supabaseClient } from "@/lib/supabase-client";

interface ReservaEmbebida {
  huesped_nombre: string;
  entrada: string;
  salida: string;
  canal: string;
}

interface CheckinHuesped {
  id: string;
  reserva_id: string;
  nombre: string;
  apellido: string;
  pais_origen: string;
  numero_id: string | null;
  documento_ruta: string | null;
  email: string;
  telefono: string;
  acepta_remarketing: boolean;
  created_at: string;
  reservas: ReservaEmbebida | null;
}

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-PA", { dateStyle: "medium", timeStyle: "short" });
}

function CheckinCard({ c }: { c: CheckinHuesped }) {
  const [abierto, setAbierto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  async function verIdentificacion() {
    if (!c.documento_ruta) return;
    setErrorFoto(null);
    setCargandoFoto(true);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch(`/api/checkin/foto?ruta=${encodeURIComponent(c.documento_ruta)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setFotoUrl(json.url);
    } catch {
      setErrorFoto("No se pudo cargar el documento.");
    } finally {
      setCargandoFoto(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="text-sm font-semibold">
            {c.nombre} {c.apellido}
          </p>
          <p className="text-xs text-ink-2">
            {c.reservas ? `${c.reservas.huesped_nombre} · ${c.reservas.entrada} → ${c.reservas.salida} · ${c.reservas.canal}` : "Reserva no encontrada"}
          </p>
        </div>
        <span className="text-xs text-ink-2">{fechaHora(c.created_at)}</span>
      </button>

      {abierto && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-2 uppercase">País de origen</p>
            <p className="break-words">{c.pais_origen}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-2 uppercase">Documento</p>
            <p className="break-words">{c.numero_id || "—"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-2 uppercase">Email</p>
            <p className="break-words">{c.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-2 uppercase">Teléfono</p>
            <p className="break-words">{c.telefono}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-2 uppercase">Remarketing</p>
            <p className={c.acepta_remarketing ? "text-good" : "text-ink-2"}>{c.acepta_remarketing ? "Autorizado" : "No autorizado"}</p>
          </div>

          <div className="col-span-2 sm:col-span-3">
            {c.documento_ruta ? (
              fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL temporal, no se puede pasar por next/image
                <img src={fotoUrl} alt="Documento de identidad" className="mt-1 max-h-80 rounded-md border border-line" />
              ) : (
                <button
                  type="button"
                  onClick={verIdentificacion}
                  disabled={cargandoFoto}
                  className="rounded-md border border-line px-3 py-1.5 text-sm disabled:opacity-60"
                >
                  {cargandoFoto ? "Cargando…" : "Ver identificación"}
                </button>
              )
            ) : (
              <p className="text-xs text-ink-2">No subió foto de identificación.</p>
            )}
            {errorFoto && <p className="mt-2 text-xs text-caoba">{errorFoto}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  // No es un resource de Refine con CRUD desde acá (los registros solo se
  // crean desde apps/web, ver /api/checkin) — igual que Reservas/Tienda,
  // solo useTable de lectura. reserva_id se resuelve con el mismo embed
  // "*, reservas(...)" que ya usa Operación (tareas_operacion) para no
  // duplicar una segunda consulta.
  const { result, tableQuery } = useTable<CheckinHuesped>({
    resource: "checkins_huesped",
    meta: { select: "*, reservas(huesped_nombre, entrada, salida, canal)" },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
    pagination: { mode: "off" },
  });

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Huéspedes</p>
      <h1 className="mt-1 text-2xl font-bold">Check-in</h1>
      <p className="mt-1 text-sm text-ink-2">
        Registros enviados desde /check-in antes de la llegada — nombre, país de origen, documento de identidad,
        contacto y confirmación de fechas, ligados a una reserva real por su código.
      </p>

      {tableQuery.isLoading && <p className="mt-6 text-sm text-ink-2">Cargando…</p>}

      {tableQuery.isError && (
        <p className="mt-6 text-sm text-caoba">
          No se pudo conectar a Supabase todavía — completa <code>.env.local</code> (ver <code>supabase/README.md</code>).
        </p>
      )}

      {!tableQuery.isLoading && !tableQuery.isError && result.data.length === 0 && (
        <p className="mt-6 text-sm text-ink-2">Todavía no ha llegado ningún registro de check-in.</p>
      )}

      {result.data.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {result.data.map((c) => (
            <CheckinCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
