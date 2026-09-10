"use client";

import { Refine, type ResourceProps } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router/app";
import { dataProvider } from "@refinedev/supabase";
import type { ReactNode } from "react";
import { authProvider } from "@/lib/auth-provider";
import { supabaseClient } from "@/lib/supabase-client";

// Un resource por módulo de la intranet — mismos siete que ya existen
// en la de WordPress (ver docs/logica-negocio-y-flujos.md), menos
// "Cotizaciones" e "Inicio" que no son tablas por sí mismas.
const resources: ResourceProps[] = [
  { name: "reservas", list: "/reservas", meta: { label: "Reservas" } },
  {
    name: "bloqueos_calendario",
    list: "/calendario",
    meta: { label: "Calendario y disponibilidad" },
  },
  { name: "tareas_operacion", list: "/operacion", meta: { label: "Operación" } },
  { name: "gastos", list: "/contabilidad", meta: { label: "Contabilidad" } },
  {
    name: "movimientos_bancarios",
    list: "/conciliacion",
    meta: { label: "Conciliación bancaria" },
  },
  { name: "plan_compras", list: "/analisis", meta: { label: "Análisis y planificación" } },
  { name: "perfiles", list: "/usuarios", meta: { label: "Usuarios y permisos" } },
];

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider(supabaseClient)}
      authProvider={authProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        disableTelemetry: true,
        title: { text: "Casa Randa · Intranet" },
      }}
    >
      {children}
    </Refine>
  );
}
