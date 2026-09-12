import type { DataProvider } from "@refinedev/core";
import { dataProvider } from "@refinedev/supabase";
import { supabaseClient } from "./supabase-client";

const base = dataProvider(supabaseClient);
// Keep Refine's resource keys for invalidation; only reads use the protected view.
function lectura<T extends { resource: string; meta?: Record<string, unknown> }>(params: T): T {
  const select = params.meta?.select;
  return { ...params, resource: params.resource === "reservas" ? "reservas_acceso" : params.resource,
    meta: { ...params.meta, ...(typeof select === "string" ? { select: select.replace(/\breservas(!inner)?\(/g, "reservas:reservas_acceso$1(") } : {}) } };
}
export const protectedDataProvider: DataProvider = {
  ...base,
  getList: params => base.getList(lectura(params)),
  getOne: params => base.getOne(lectura(params)),
  getMany: params => base.getMany(lectura(params)),
};
