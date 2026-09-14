import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { filtroCodigoReserva, normalizarCodigoReserva } from "@/lib/codigo-reserva";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

/**
 * Variante de /api/tienda/validar-codigo para el wizard de check-in: además
 * de sí/no, devuelve entrada/salida (para el paso "confirma tus fechas",
 * que se muestra de solo lectura en vez de dejar que el huésped las
 * reescriba a mano) — nunca el nombre del huésped ni nada financiero,
 * mismo criterio de "las fechas ya son públicas por diseño en este
 * proyecto" que reservas_fechas_ocupadas/bloqueos_calendario.
 */
export async function POST(req: Request) {
  let body: { codigo?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  const codigo = normalizarCodigoReserva(body.codigo);
  if (!codigo) return fail("Escribe tu código de reserva.");

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("reservas")
    .select("entrada, salida")
    .or(filtroCodigoReserva(codigo))
    .in("estado", ["confirmada", "completada"])
    .maybeSingle();

  if (error) return fail("No se pudo validar el código.", 500);
  if (!data) return fail("Código no encontrado. Revisa que esté bien escrito, o escríbenos a booking@randahome.com.");

  return Response.json({ ok: true, entrada: data.entrada, salida: data.salida });
}
