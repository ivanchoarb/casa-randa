"use client";

import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import Link from "next/link";
import type { ReactNode } from "react";

interface Identity {
  nombre?: string;
  email?: string;
  rol?: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { menuItems, selectedKey } = useMenu();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-panel">
        <div className="border-b border-line px-5 py-5">
          <p className="text-xs font-semibold tracking-wide text-caoba uppercase">Casa Randa</p>
          <p className="text-sm font-bold">Intranet</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href="/"
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              selectedKey === "/"
                ? "bg-panel-2 text-ink"
                : "text-ink-2 hover:bg-panel-2 hover:text-ink"
            }`}
          >
            Inicio
          </Link>
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.route ?? "#"}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                selectedKey === item.key
                  ? "bg-panel-2 text-ink"
                  : "text-ink-2 hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium">{identity?.nombre ?? identity?.email}</p>
          <p className="text-xs text-ink-2 capitalize">{identity?.rol}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 text-xs font-medium text-caoba hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-ground p-8">{children}</main>
    </div>
  );
}
