"use client";

import { Refine, type ResourceProps } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router/app";
import { protectedDataProvider } from "@/lib/data-provider";
import type { ReactNode } from "react";
import { authProvider } from "@/lib/auth-provider";


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
      dataProvider={protectedDataProvider}
      authProvider={authProvider}
      resources={resources}
      options={{
        // Con `true`, todas las tablas de una página comparten un único
        // `?sorters[0][field]=…` en la URL: la última en montarse lo pisa y
        // las demás lo leen. En Calendario, la tabla de reservas escribía
        // `entrada` y la de bloqueos (que ordena por `inicio`) pedía esa
        // columna inexistente → 400 → "No se pudo conectar a Supabase", y
        // recargar no lo arreglaba porque la URL ya quedaba contaminada. Nada
        // en la intranet necesita compartir el estado de una tabla por URL.
        syncWithLocation: false,
        disableTelemetry: true,
        title: { text: "Casa Randa · Intranet" },
      }}
    >
      {children}
    </Refine>
  );
}
