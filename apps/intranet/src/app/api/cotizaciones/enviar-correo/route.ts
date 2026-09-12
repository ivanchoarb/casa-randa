import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Envía la cotización en PDF por correo. El cliente ya generó el PDF con
 * pdf-lib (src/lib/cotizacion.ts) y lo manda en base64 — esta ruta no
 * vuelve a calcular nada, solo lo adjunta y lo envía.
 *
 * SMTP_HOST/PORT/USER/PASS todavía no existen en .env.local — el envío
 * de liquidaciones por correo (ver contabilidad) está en el mismo punto:
 * bloqueado en activar el SMTP transaccional de Dongee para
 * booking@randahome.com (docs/arquitectura-migracion.md, "Tareas de
 * producción"). Esta ruta está completa y lista para funcionar en cuanto
 * esas credenciales existan — falla con un error claro mientras tanto,
 * no en silencio.
 *
 * Protegida verificando la sesión real de Supabase de quien llama (no
 * SYNC_SECRET: ese secreto es para jobs servidor-a-servidor, exponerlo
 * al navegador para esta ruta lo filtraría en el bundle del cliente).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) {
    return NextResponse.json(
      {
        error:
          "SMTP no configurado — faltan SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS en .env.local " +
          "(el SMTP transaccional de Dongee para booking@randahome.com, ver docs/arquitectura-migracion.md).",
      },
      { status: 400 },
    );
  }

  let body: {
    destinatario?: string;
    asunto?: string;
    mensaje?: string;
    pdfBase64?: string;
    codigo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo de la solicitud inválido" }, { status: 400 });
  }
  const { destinatario, asunto, mensaje, pdfBase64, codigo } = body;
  if (!destinatario || !pdfBase64 || !codigo) {
    return NextResponse.json({ error: "faltan destinatario, pdfBase64 o codigo" }, { status: 400 });
  }

  const transporte = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  try {
    await transporte.sendMail({
      from: `"Casa Randa" <${user}>`,
      to: destinatario,
      subject: asunto || `Tu cotización de Casa Randa — ${codigo}`,
      text: mensaje || "Adjunto encontrarás la cotización de tu estadía en Casa Randa.",
      attachments: [
        {
          filename: `casa-randa-${codigo.toLowerCase()}.pdf`,
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Error al enviar el correo: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ enviado_en: new Date().toISOString(), destinatario });
}
