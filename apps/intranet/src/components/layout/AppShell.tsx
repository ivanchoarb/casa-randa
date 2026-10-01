"use client";

import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePermisos } from "@/lib/use-permisos";
import { RUTAS } from "@/lib/permisos";

interface Identity {
  nombre?: string;
  email?: string;
  rol?: string;
}

// "Cotizaciones", "Marketing", "Tienda" y "Check-in" no son resources de
// Refine (no hay `useTable`/CRUD genérico detrás con el que useMenu() los
// liste solo — ver src/lib/cotizacion.ts, marketing/page.tsx, tienda/page.tsx
// y check-in/page.tsx), así que se insertan a mano. Cotizaciones en la
// posición que tiene en staging (después de "Análisis y planificación");
// Marketing, Tienda y Check-in justo después, todas antes de "Usuarios y
// permisos" (el último resource real).
function conCotizaciones<T extends { key: string }>(menuItems: T[]) {
  const idx = menuItems.length - 1;
  return [
    ...menuItems.slice(0, idx),
    { key: "/cotizaciones", route: "/cotizaciones", label: "Cotizaciones" } as unknown as T,
    { key: "/marketing", route: "/marketing", label: "Marketing" } as unknown as T,
    { key: "/metricas", route: "/metricas", label: "Métricas web" } as unknown as T,
    { key: "/tienda", route: "/tienda", label: "Tienda" } as unknown as T,
    { key: "/check-in", route: "/check-in", label: "Check-in" } as unknown as T,
    ...menuItems.slice(idx),
  ];
}

// Un solo set de línea, geométrico, trazado a mano — evoca los planos de
// una casa (aguas de techo, ventanas, esclusas) en vez de un paquete de
// iconos genérico. 18×18, stroke 1.6, sin relleno.
function NavIcon({ route }: { route: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (route) {
    case "/":
      return <svg {...common}><path d="M2.5 8.5 9 3l6.5 5.5" /><path d="M4 7.5V15h10V7.5" /><path d="M7 15v-4h4v4" /></svg>;
    case "/reservas":
      return <svg {...common}><rect x="2.5" y="3.5" width="13" height="11" rx="1" /><path d="M2.5 7h13" /><path d="M6 2v3M12 2v3" /></svg>;
    case "/calendario":
      return <svg {...common}><rect x="2.5" y="3.5" width="13" height="11" rx="1" /><path d="M2.5 7h13" /><path d="M6 10h1M9 10h1M12 10h1M6 12.5h1M9 12.5h1" /></svg>;
    case "/operacion":
      return <svg {...common}><rect x="4" y="2.5" width="10" height="13" rx="1" /><path d="M6.5 2.5V2h5v.5" /><path d="M6 8.5l1.5 1.5L12 6.5" /></svg>;
    case "/contabilidad":
      return <svg {...common}><path d="M3.5 2.5h9l2 2v11h-11z" /><path d="M6 6.5h6M6 9h6M6 11.5h4" /></svg>;
    case "/conciliacion":
      return <svg {...common}><path d="M3 6.5h8l-2-2.5" /><path d="M15 11.5H7l2 2.5" /></svg>;
    case "/analisis":
      return <svg {...common}><path d="M2.5 15.5V2.5" /><path d="M2.5 15.5H15.5" /><path d="M5 13v-4M8.5 13V6M12 13V9" /></svg>;
    case "/cotizaciones":
      return <svg {...common}><path d="M4.5 2.5h6l3 3v10h-9z" /><path d="M10.5 2.5V6h3" /><path d="M7 10.2c0 .7.6 1 1.4 1s1.4-.4 1.4-1-.6-.9-1.4-1.1-1.4-.5-1.4-1.1c0-.6.6-1 1.4-1s1.3.3 1.3.9" /><path d="M8.4 6.9v1M8.4 11.2v1" /></svg>;
    case "/marketing":
      return <svg {...common}><rect x="2.5" y="4" width="13" height="10" rx="1" /><path d="M2.5 5l6.5 5 6.5-5" /></svg>;
    case "/metricas":
      return <svg {...common}><path d="M2.5 15.5V2.5" /><path d="M2.5 15.5H15.5" /><path d="M4.5 12l3-3.5 2.5 2 4.5-5.5" /></svg>;
    case "/tienda":
      return <svg {...common}><path d="M3 5.5 4 2.5h10l1 3" /><path d="M3 5.5h12v9H3z" /><path d="M7 8.5a2 2 0 0 0 4 0" /></svg>;
    case "/check-in":
      return <svg {...common}><rect x="2.5" y="3" width="13" height="12" rx="1.5" /><circle cx="9" cy="7.3" r="1.6" /><path d="M5.8 12.3c.4-1.6 1.7-2.4 3.2-2.4s2.8.8 3.2 2.4" /></svg>;
    case "/usuarios":
      return <svg {...common}><circle cx="9" cy="6.3" r="2.3" /><path d="M4 15c.6-2.8 2.5-4.2 5-4.2s4.4 1.4 5 4.2" /></svg>;
    default:
      return <svg {...common}><circle cx="9" cy="9" r="5.5" /></svg>;
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const { can } = usePermisos();
  const { menuItems, selectedKey } = useMenu();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  const items = [
    { key: "/", route: "/", label: "Inicio" },
    ...conCotizaciones(menuItems).filter((item) => (RUTAS[item.route ?? ""] ?? []).some(can)),
  ].filter((item) => item.key === "/" ? RUTAS["/"].some(can) : true);

  const activeKey = selectedKey ?? "/";
  const refs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = refs.current.get(activeKey);
    if (el) setIndicator({ top: el.offsetTop, height: el.offsetHeight });
  }, [activeKey, items.length]);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-panel">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="var(--caoba)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12 13 4l9 8" />
            <path d="M6.5 10.5V22h13V10.5" />
            <path d="M2.5 15.5h21" />
          </svg>
          <div>
            <p className="eyebrow">Casa Randa</p>
            <p className="text-sm font-bold">Intranet</p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-0.5 px-3 py-4">
          {indicator && (
            <span
              className="nav-indicator absolute left-3 w-[calc(100%-1.5rem)] rounded-md bg-panel-2"
              style={{ top: 0, height: indicator.height, transform: `translateY(${indicator.top}px)` }}
              aria-hidden
            />
          )}
          {items.map((item, i) => {
            const isActive = item.key === activeKey;
            return (
              <Link
                key={item.key}
                ref={(el) => {
                  if (el) refs.current.set(item.key, el);
                  else refs.current.delete(item.key);
                }}
                href={item.route ?? "#"}
                className={`nav-entrance relative z-10 flex items-center gap-2.5 rounded-md border-l-[3px] px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive ? "border-caoba text-ink" : "border-transparent text-ink-2 hover:text-ink"
                }`}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <NavIcon route={item.route ?? ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium">{identity?.nombre ?? identity?.email}</p>
          <p className="text-xs text-ink-2 capitalize">{identity?.rol}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="btn-press mt-3 text-xs font-medium text-caoba hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-ground p-4 sm:p-8">{children}</main>
    </div>
  );
}
