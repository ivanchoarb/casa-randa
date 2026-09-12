"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePermisos } from "@/lib/use-permisos";
import { RUTAS } from "@/lib/permisos";
export function PermissionGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { can, isLoading } = usePermisos();
  if (isLoading) return <p role="status">Cargando permisos…</p>;
  if (!(RUTAS[path] ?? []).some(can)) return <p role="alert">No tienes acceso a esta sección. Selecciona una de las opciones disponibles en el menú.</p>;
  return children;
}
