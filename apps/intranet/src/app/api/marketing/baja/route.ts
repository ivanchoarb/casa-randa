import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Pública, sin sesión — el enlace va dentro del correo. `token` es el id de
 * la fila en campana_destinatarios (un uuid, no adivinable). Apaga el
 * consentimiento en las dos fuentes de la audiencia por correo, no solo en
 * esta campaña — quien se da de baja no debería seguir recibiendo la
 * siguiente tampoco. Responde `ok` incluso si el token no existe, para no
 * revelar nada sobre qué tokens son válidos.
 */
export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!body.token) return Response.json({ error: "Falta el token." }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: destinatario } = await db.from("campana_destinatarios").select("email").eq("id", body.token).maybeSingle();

  if (destinatario) {
    await db.from("solicitudes").update({ consentimiento: false }).eq("email", destinatario.email);
    await db.from("contactos_marketing").update({ consentimiento: false }).eq("email", destinatario.email);
    // Defensa adicional: enviar-lote ya revisa el consentimiento vigente
    // antes de cada envío, pero esto deja el progreso de otras campañas
    // activas correcto de inmediato, sin esperar a que les toque su turno.
    await db
      .from("campana_destinatarios")
      .update({ estado: "no_suscrito" })
      .eq("email", destinatario.email)
      .eq("estado", "pendiente");
  }

  return Response.json({ ok: true });
}
