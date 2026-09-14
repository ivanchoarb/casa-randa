import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buscarConflictos } from "@/lib/disponibilidad";

export const dynamic = "force-dynamic";

const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Pública, sin sesión — usada por QuoteCalculator para avisar en vivo si
 * las fechas elegidas ya están ocupadas, antes de que el huésped llene el
 * formulario completo. `/api/solicitudes` repite esta misma verificación
 * server-side al enviar (nunca confía en que el navegador ya la corrió).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entrada = searchParams.get("entrada") ?? "";
  const salida = searchParams.get("salida") ?? "";
  if (!ISO_FECHA.test(entrada) || !ISO_FECHA.test(salida) || salida <= entrada) {
    return Response.json({ error: "Fechas inválidas." }, { status: 400 });
  }

  try {
    const conflictos = await buscarConflictos(getSupabaseAdmin(), entrada, salida);
    return Response.json({ conflictos });
  } catch {
    // No confirmar disponibilidad que no se pudo verificar de verdad —
    // ver el comentario en buscarConflictos (docs/auditoria-2026-09-14.md).
    return Response.json({ error: "No se pudo verificar la disponibilidad. Intenta de nuevo." }, { status: 503 });
  }
}
