import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { puede } from "@/lib/permisos";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Manda el borrador de una campaña a quien la está armando, antes de crearla de verdad — para ver cómo llega, no a un huésped real. */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return fail("Inicia sesión para continuar.", 401);

  const db = getSupabaseAdmin();
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user || !authData.user.email) return fail("La sesión no es válida.", 401);
  const { data: perfil } = await db.from("perfiles").select("rol, permisos").eq("id", authData.user.id).single();
  if (!puede(perfil?.rol, perfil?.permisos, "marketing")) return fail("No tienes permiso para enviar campañas de marketing.", 403);

  let body: { asunto?: string; cuerpo_html?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  if (!body.asunto || !body.cuerpo_html) return fail("Falta el asunto o el cuerpo del correo.");

  if (!transporteDisponible()) return fail("SMTP no configurado — faltan SMTP_HOST/PORT/USER/PASS en .env.local.", 400);

  try {
    const { transporte, remitente } = crearTransporte();
    await transporte.sendMail({
      from: remitente,
      to: authData.user.email,
      subject: `[PRUEBA] ${body.asunto}`,
      html: `<p style="background:#fff3cd;padding:8px 12px;font-size:12px">Esto es una prueba — no se mandó a ningún contacto real.</p>${body.cuerpo_html}`,
    });
  } catch (e) {
    return fail(`Error al enviar la prueba: ${e instanceof Error ? e.message : String(e)}`, 502);
  }

  return Response.json({ ok: true, destinatario: authData.user.email });
}
