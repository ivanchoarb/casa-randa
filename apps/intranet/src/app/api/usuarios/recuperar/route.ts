import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { crearTransporte, transporteDisponible } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * "Olvidé mi contraseña" — pública, sin sesión. Genera un enlace de
 * recuperación con la Admin API (no dispara el correo propio de Supabase,
 * que depende de su SMTP por defecto) y lo enviamos nosotros por el SMTP
 * transaccional de Dongee, igual que las cotizaciones.
 *
 * Usa el token_hash de generateLink, no el action_link tal cual: así el
 * enlace apunta directo a /restablecer-password de esta app y se verifica
 * con supabase.auth.verifyOtp() del lado del cliente, sin pasar por el
 * redirect_to de Supabase (evita depender de su lista de URLs permitidas,
 * que no gestionamos desde aquí).
 *
 * Respuesta siempre genérica, exista o no la cuenta — evita que alguien
 * pueda usar este endpoint para averiguar qué correos están registrados.
 */
const generico = { ok: true, mensaje: "Si ese correo tiene una cuenta, enviamos un enlace para restablecer la contraseña." };

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Indica un correo válido." }, { status: 400 });
  }

  try {
    if (!transporteDisponible()) throw new Error("SMTP no configurado.");
    const db = getSupabaseAdmin();
    const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email });
    const hashedToken = data?.properties?.hashed_token;
    if (!error && hashedToken) {
      const origin = new URL(req.url).origin;
      const enlace = `${origin}/restablecer-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
      const { transporte, remitente } = crearTransporte();
      await transporte.sendMail({
        from: remitente,
        to: email,
        subject: "Restablece tu contraseña — Intranet Casa Randa",
        text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta en la intranet de Casa Randa.\n\nSi fuiste tú, abre este enlace para elegir una nueva contraseña:\n${enlace}\n\nSi no la solicitaste, ignora este correo — tu contraseña actual sigue funcionando.`,
      });
    }
  } catch {
    // Nunca revelamos si el correo existe o si el envío falló.
  }

  return Response.json(generico);
}
