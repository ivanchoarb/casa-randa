"use client";
import { useGetIdentity } from "@refinedev/core";
import { puede, type Permiso, type Permisos } from "./permisos";
export interface Identidad { id: string; rol: string; permisos?: Permisos; nombre?: string; email?: string }
export function usePermisos() {
  const { data, isLoading, isError } = useGetIdentity<Identidad>({ queryOptions: { refetchInterval: 30000, refetchOnWindowFocus: true } });
  return { identity: data, isLoading, isError, can: (p: Permiso) => !isError && puede(data?.rol, data?.permisos, p) };
}
