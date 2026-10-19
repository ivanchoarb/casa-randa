"use client";

import { useTable, useUpdate } from "@refinedev/core";
import { useState, useEffect } from "react";

interface Propiedad {
  id: string;
  nombre: string;
  ical_airbnb: string | null;
  ical_vrbo: string | null;
  ical_booking: string | null;
}

const inputClass = "mt-1 w-full rounded-md border border-line bg-ground px-3 py-2 text-sm font-mono outline-none focus:border-caoba";

export default function ConfiguracionPage() {
  const { result, tableQuery } = useTable<Propiedad>({
    resource: "propiedades",
    pagination: { mode: "off" },
    syncWithLocation: false,
  });
  const { mutate: actualizar, mutation } = useUpdate<Propiedad>();

  const propiedad = result.data?.[0];

  const [airbnb, setAirbnb] = useState("");
  const [vrbo, setVrbo] = useState("");
  const [booking, setBooking] = useState("");

  useEffect(() => {
    if (!propiedad) return;
    setAirbnb(propiedad.ical_airbnb ?? "");
    setVrbo(propiedad.ical_vrbo ?? "");
    setBooking(propiedad.ical_booking ?? "");
  }, [propiedad]);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!propiedad) return;
    actualizar({
      resource: "propiedades",
      id: propiedad.id,
      values: {
        ical_airbnb:  airbnb.trim()  || null,
        ical_vrbo:    vrbo.trim()    || null,
        ical_booking: booking.trim() || null,
      },
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Administración</p>
      <h1 className="mt-1 text-2xl font-bold">Configuración</h1>

      {tableQuery.isError && (
        <p className="mt-4 text-sm text-caoba">
          No se pudo conectar a Supabase — completa <code>.env.local</code>.
        </p>
      )}

      {!tableQuery.isError && (
        <form onSubmit={guardar} className="mt-6 max-w-xl space-y-8">
          <section>
            <h2 className="text-base font-bold">Sincronización de calendarios (iCal)</h2>
            <p className="mt-1 text-sm text-ink-2">
              Pega aquí las URLs de exportación iCal de cada canal. Déjala vacía si no usas ese
              canal. El sync las lee una vez cada 15 minutos.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium">
                Airbnb — URL iCal
                <input
                  type="url"
                  value={airbnb}
                  onChange={(e) => setAirbnb(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/…"
                  className={inputClass}
                  disabled={tableQuery.isLoading}
                />
              </label>

              <label className="block text-sm font-medium">
                Vrbo — URL iCal
                <input
                  type="url"
                  value={vrbo}
                  onChange={(e) => setVrbo(e.target.value)}
                  placeholder="https://www.vrbo.com/icalendar/…"
                  className={inputClass}
                  disabled={tableQuery.isLoading}
                />
              </label>

              <label className="block text-sm font-medium">
                Booking.com — URL iCal
                <input
                  type="url"
                  value={booking}
                  onChange={(e) => setBooking(e.target.value)}
                  placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?…"
                  className={inputClass}
                  disabled={tableQuery.isLoading}
                />
              </label>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={tableQuery.isLoading || mutation.isPending}
              className="rounded-md bg-caoba px-5 py-2 text-sm font-semibold text-panel disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando…" : "Guardar cambios"}
            </button>
            {mutation.isSuccess && (
              <p className="text-sm text-good">Guardado.</p>
            )}
            {mutation.isError && (
              <p className="text-sm text-caoba">No se pudo guardar. Intenta de nuevo.</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
