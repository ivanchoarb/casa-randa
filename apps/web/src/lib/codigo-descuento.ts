import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Valida un código de descuento contra `codigos_descuento` (¿existe, está
 * vigente hoy en Panamá, le quedan usos?). Corre con el service-role
 * client: el SELECT público de esa tabla se quitó en 0016, así que ni el
 * navegador ni la anon key pueden consultarla directamente.
 */
export async function validarCodigo(db: SupabaseClient, codigoCrudo: unknown) {
  const codigo = typeof codigoCrudo === "string" ? codigoCrudo.trim() : "";
  if (!codigo || codigo.length > 60) return null;

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const { data } = await db
    .from("codigos_descuento")
    .select("codigo, descuento_pct, vigente_desde, vigente_hasta, maximo_usos, usos_actuales")
    .ilike("codigo", codigo.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();
  if (!data) return null;
  if (data.vigente_desde > hoy || data.vigente_hasta < hoy) return null;
  if (data.maximo_usos > 0 && data.usos_actuales >= data.maximo_usos) return null;
  return { codigo: data.codigo as string, pct: Number(data.descuento_pct) };
}
