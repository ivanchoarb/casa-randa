import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Pública, sin sesión — el enlace va dentro del correo de bienvenida.
 * `id` es la fila propia de `contactos_marketing` (un uuid, no adivinable).
 * Responde `ok` incluso si el id no existe, para no revelar nada.
 */
export async function POST(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "Falta el identificador." }, { status: 400 });

  const db = getSupabaseAdmin();
  await db.from("contactos_marketing").update({ consentimiento: false }).eq("id", body.id);

  return Response.json({ ok: true });
}
