import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

/**
 * Pública, sin sesión — la tienda pública la llama para saber si el
 * "código de reserva" que escribió el huésped es real, antes de dejarlo
 * armar un pedido. Solo confirma sí/no — nunca devuelve el nombre del
 * huésped ni ningún otro dato de la reserva, para que alguien probando
 * códigos al azar no pueda usar esto para averiguar quién reservó qué.
 * Requiere el cliente de servicio porque `reservas` no tiene ninguna
 * policy pública de lectura (ver CLAUDE.md, sección `contabilidad`).
 */
export async function POST(req: Request) {
  let body: { codigo?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  const codigo = typeof body.codigo === "string" ? body.codigo.trim().toUpperCase() : "";
  if (!codigo) return fail("Escribe tu código de reserva.");

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("reservas")
    .select("id")
    .eq("codigo_tienda", codigo)
    .in("estado", ["confirmada", "completada"])
    .maybeSingle();

  if (error) return fail("No se pudo validar el código.", 500);
  if (!data) return fail("Código no encontrado. Revisa que esté bien escrito, o escríbenos a booking@randahome.com.");

  return Response.json({ ok: true });
}
