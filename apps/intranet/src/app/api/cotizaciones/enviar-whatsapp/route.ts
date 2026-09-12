import { puede } from "@/lib/permisos";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Envía la cotización como documento adjunto real por WhatsApp — vía la
 * API oficial de WhatsApp Business (Meta Cloud API), no un bot ni
 * automatización de WhatsApp Web (eso viola los términos de Meta y
 * arriesga que baneen el número). El PDF no se manda como bytes: Meta
 * exige una URL pública de la que su servidor lo descarga, por eso el
 * cliente sube el PDF a Supabase Storage primero (subirCotizacionPDF en
 * src/lib/cotizacion.ts) y manda esa signed URL aquí.
 *
 * Bloqueada en WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID — ninguno
 * existe todavía. Conseguirlos requiere conectar el número de WhatsApp
 * Business (Ivan ya tiene la app, pero eso es distinto del acceso a la
 * Cloud API) a Meta Business Manager y generar un access token
 * permanente + el Phone Number ID, ver la conversación del 2026-09-12.
 *
 * Límite real de Meta que este código no puede evitar: si el cliente
 * nunca te ha escrito primero por WhatsApp, Meta exige que el primer
 * mensaje use una "plantilla" pre-aprobada por ellos — no un documento
 * libre. Esta ruta solo cubre el caso "el cliente ya escribió dentro de
 * las últimas 24 horas"; fuera de eso, Meta la rechaza con un error
 * propio (se devuelve tal cual, no se oculta). El botón "Enviar por
 * WhatsApp" en la página siempre puede caer de vuelta al enlace wa.me
 * como respaldo — ver la página de cotizaciones.
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

  const { data: perfil, error: perfilError } = await supabase.from("perfiles").select("rol, permisos").eq("id", userData.user.id).single();
  if (perfilError || !puede(perfil?.rol, perfil?.permisos, "cotizaciones")) {
    return NextResponse.json({ error: "No tienes permiso para gestionar cotizaciones." }, { status: 403 });
  }


  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    return NextResponse.json(
      {
        error:
          "WhatsApp Business API no configurada — faltan WHATSAPP_ACCESS_TOKEN / " +
          "WHATSAPP_PHONE_NUMBER_ID en .env.local (Meta Business Manager, ver el comentario " +
          "en esta ruta y docs/arquitectura-migracion.md).",
      },
      { status: 400 },
    );
  }

  let body: { telefono?: string; urlPdf?: string; caption?: string; codigo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo de la solicitud inválido" }, { status: 400 });
  }
  const { telefono, urlPdf, caption, codigo } = body;
  const numero = telefono?.replace(/[^0-9]/g, "");
  if (!numero || !urlPdf || !codigo) {
    return NextResponse.json({ error: "faltan telefono, urlPdf o codigo" }, { status: 400 });
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: numero,
      type: "document",
      document: {
        link: urlPdf,
        filename: `casa-randa-${codigo.toLowerCase()}.pdf`,
        caption: caption || `Tu cotización de Casa Randa — ${codigo}`,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    // Meta devuelve su propio error (número inválido, fuera de la ventana
    // de 24h sin plantilla aprobada, token vencido, etc.) — se reenvía tal
    // cual en vez de inventar un mensaje genérico.
    return NextResponse.json({ error: json?.error?.message || "Error de WhatsApp", detalle: json }, { status: 502 });
  }

  return NextResponse.json({ enviado_en: new Date().toISOString(), telefono: numero, meta: json });
}
