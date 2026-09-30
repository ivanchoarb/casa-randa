import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";
import { ASUNTO_BIENVENIDA, correoBienvenidaHtml } from "@/lib/correo-bienvenida";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (error: string, status = 400) => Response.json({ error }, { status });

/**
 * Pública, sin sesión — el popup de descuento la llama directo. Guarda en
 * `contactos_marketing` (apps/intranet) con `fuente: "formulario_web"` y
 * `consentimiento: true` — la casilla del popup ya es la autorización, no
 * se pide de nuevo aquí. Requiere el cliente de servicio porque esa tabla
 * exige el permiso "marketing" (`to authenticated`) para escribir; un
 * visitante anónimo no tiene sesión.
 *
 * Si el correo ya estaba suscrito (consentimiento ya en true), no reenvía
 * el cupón — evita que alguien reenviándose el formulario reciba el mismo
 * correo una y otra vez, o que se use esto para mandar correos repetidos a
 * un tercero. Si existía pero se había dado de baja, se trata como una
 * suscripción nueva de verdad y sí se reenvía.
 */
export async function POST(req: Request) {
  let body: { nombre?: string; email?: string; telefono?: string | null; pais?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida.");
  }
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const telefono = typeof body.telefono === "string" ? body.telefono.trim() : "";
  const pais = typeof body.pais === "string" ? body.pais.trim() : "";
  if (!nombre || nombre.length > 120) return fail("Indica tu nombre completo.");
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return fail("Indica un correo válido.");
  if (!pais || pais.length > 100) return fail("Indica tu país.");

  if (!transporteDisponible()) return fail("El envío de correo no está configurado todavía.", 503);

  const db = getSupabaseAdmin();
  const { data: existente } = await db.from("contactos_marketing").select("id, consentimiento").eq("email", email).maybeSingle();
  const yaSuscrito = existente?.consentimiento === true;

  const { data: contacto, error } = await db
    .from("contactos_marketing")
    .upsert(
      { nombre, email, telefono: telefono || null, pais, fuente: "formulario_web", consentimiento: true },
      { onConflict: "email" },
    )
    .select("id")
    .single();
  if (error || !contacto) return fail("No se pudo guardar la suscripción.", 500);

  // 2026-09-30, bug real reportado por Ivan ("no envía correo electrónico"):
  // cuando el correo ya estaba suscrito, esta ruta respondía { ok: true } sin
  // enviar nada — correcto para no reenviar el cupón, pero el popup no tenía
  // forma de distinguirlo de un envío real y siempre mostraba "se ha enviado
  // el cupón", mintiéndole al visitante. Ahora se le informa a la interfaz
  // si de verdad se envió un correo o no.
  if (yaSuscrito) return Response.json({ ok: true, correoEnviado: false });

  const origin = new URL(req.url).origin;
  const enlaceBaja = `${origin}/darse-de-baja?id=${contacto.id}`;
  try {
    const { transporte, remitente } = crearTransporte();
    await transporte.sendMail({
      from: remitente,
      to: email,
      subject: ASUNTO_BIENVENIDA,
      html: correoBienvenidaHtml(enlaceBaja),
    });
  } catch (e) {
    return fail(`No se pudo enviar el correo: ${e instanceof Error ? e.message : String(e)}`, 502);
  }

  return Response.json({ ok: true, correoEnviado: true });
}
