import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, personalizar, transporteDisponible } from "@/lib/mailer";
import { puede } from "@/lib/permisos";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

const TAMANO_LOTE = 50;
const INTENTOS_MAXIMOS = 5;

/**
 * Manda UN correo pendiente de una campaña, respetando `limite_diario`.
 * Sin disparador automático todavía (la intranet no está desplegada en
 * ningún servidor — ver CLAUDE.md), así que esto lo llama el botón "Enviar
 * siguiente" de campanas/page.tsx: cada click es un correo, "uno a uno" tal
 * cual lo pidió Ivan. El mismo endpoint sirve el día que exista un cron real
 * apuntándole con el límite haciendo de tope automático.
 *
 * Revisa el consentimiento VIGENTE antes de enviar, no solo el que tenía al
 * armar la campaña — encontrado probando en vivo: alguien que se da de baja
 * después de crearse una campaña, pero antes de que le toque su turno,
 * seguía en la cola como "pendiente" y se le habría mandado igual. Los que
 * ya no tienen consentimiento se marcan "no_suscrito" y se saltan (en lotes,
 * no de a uno, para no golpear la base con cientos de consultas si mucha
 * gente se dio de baja entre envíos).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return fail("Inicia sesión para continuar.", 401);

  const db = getSupabaseAdmin();
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return fail("La sesión no es válida.", 401);
  const { data: perfil } = await db.from("perfiles").select("rol, permisos").eq("id", authData.user.id).single();
  if (!puede(perfil?.rol, perfil?.permisos, "marketing")) return fail("No tienes permiso para enviar campañas de marketing.", 403);

  let body: { campana_id?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  if (!body.campana_id) return fail("Falta campana_id.");

  if (!transporteDisponible()) return fail("SMTP no configurado — faltan SMTP_HOST/PORT/USER/PASS en .env.local.", 400);

  const { data: campana, error: campanaError } = await db
    .from("campanas_marketing")
    .select("id, asunto, cuerpo_html, limite_diario, estado")
    .eq("id", body.campana_id)
    .single();
  if (campanaError || !campana) return fail("No se encontró la campaña.", 404);
  if (campana.estado !== "activa") return fail(`La campaña está ${campana.estado === "pausada" ? "pausada" : "completada"}.`, 409);

  const hoyISO = new Date().toISOString().slice(0, 10);
  const { count: enviadosHoy } = await db
    .from("campana_destinatarios")
    .select("id", { count: "exact", head: true })
    .eq("campana_id", campana.id)
    .eq("estado", "enviado")
    .gte("enviado_en", hoyISO);

  if ((enviadosHoy ?? 0) >= campana.limite_diario) {
    return Response.json({ enviado: false, motivo: "limite_diario_alcanzado", enviadosHoy: enviadosHoy ?? 0, limite: campana.limite_diario });
  }

  let siguiente: { id: string; nombre: string; apellido: string | null; email: string } | null = null;
  for (let intento = 0; intento < INTENTOS_MAXIMOS && !siguiente; intento++) {
    const { data: candidatos } = await db
      .from("campana_destinatarios")
      .select("id, nombre, apellido, email")
      .eq("campana_id", campana.id)
      .eq("estado", "pendiente")
      .order("created_at")
      .limit(TAMANO_LOTE);
    if (!candidatos || candidatos.length === 0) break;

    const emails = candidatos.map((c) => c.email);
    const [{ data: sol }, { data: con }] = await Promise.all([
      db.from("solicitudes").select("email").eq("consentimiento", true).in("email", emails),
      db.from("contactos_marketing").select("email").eq("consentimiento", true).in("email", emails),
    ]);
    const consentidos = new Set([...(sol ?? []), ...(con ?? [])].map((r) => r.email));

    const invalidos = candidatos.filter((c) => !consentidos.has(c.email)).map((c) => c.id);
    if (invalidos.length > 0) {
      await db.from("campana_destinatarios").update({ estado: "no_suscrito" }).in("id", invalidos);
    }
    siguiente = candidatos.find((c) => consentidos.has(c.email)) ?? null;
  }

  if (!siguiente) {
    const { count: quedanPendientes } = await db
      .from("campana_destinatarios")
      .select("id", { count: "exact", head: true })
      .eq("campana_id", campana.id)
      .eq("estado", "pendiente");
    if (!quedanPendientes) {
      await db.from("campanas_marketing").update({ estado: "completada" }).eq("id", campana.id);
      return Response.json({ enviado: false, motivo: "completada" });
    }
    return Response.json({ enviado: false, motivo: "sin_destinatarios_validos_en_este_lote" });
  }

  const origin = new URL(req.url).origin;
  const enlaceBaja = `${origin}/darse-de-baja?token=${siguiente.id}`;
  const cuerpoPersonalizado = personalizar(campana.cuerpo_html, siguiente.nombre, siguiente.apellido);
  const html = `${cuerpoPersonalizado}<hr style="margin-top:24px;border:none;border-top:1px solid #ddd" /><p style="font-size:11px;color:#888">Si no quieres seguir recibiendo estos correos, <a href="${enlaceBaja}">haz clic aquí para darte de baja</a>.</p>`;
  const texto = `${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\nDarte de baja: ${enlaceBaja}`;

  try {
    const { transporte, remitente } = crearTransporte();
    await transporte.sendMail({ from: remitente, to: siguiente.email, subject: campana.asunto, html, text: texto });
  } catch (e) {
    await db
      .from("campana_destinatarios")
      .update({ estado: "fallido", error: e instanceof Error ? e.message : String(e) })
      .eq("id", siguiente.id);
    return fail(`Error al enviar el correo: ${e instanceof Error ? e.message : String(e)}`, 502);
  }

  await db.from("campana_destinatarios").update({ estado: "enviado", enviado_en: new Date().toISOString() }).eq("id", siguiente.id);

  return Response.json({
    enviado: true,
    destinatario: siguiente.email,
    enviadosHoy: (enviadosHoy ?? 0) + 1,
    limite: campana.limite_diario,
  });
}
