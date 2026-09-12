import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Acorta la signed URL del PDF de la cotización antes de meterla en un
 * mensaje de WhatsApp — sin esto el link mide más de 300 caracteres (trae
 * el token firmado de Supabase Storage). Usa la API pública de TinyURL
 * (sin cuenta ni API key, un simple GET: api-create.php?url=...) en vez
 * de un acortador propio, que exigiría su propia tabla + ruta de
 * redirección — de sobra para un link que ya expira solo.
 *
 * Corre del lado del servidor (no desde el navegador) para evitar
 * problemas de CORS con tinyurl.com y no depender de que el dominio de
 * este intranet ya esté desplegado públicamente — la URL que se acorta es
 * la de Supabase Storage, que sí es pública ahora mismo aunque la intranet
 * todavía corra en localhost.
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

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "cuerpo de la solicitud inválido" }, { status: 400 });
  }
  if (!body.url) {
    return NextResponse.json({ error: "falta url" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(body.url)}`);
    const corta = (await res.text()).trim();
    if (!res.ok || !corta.startsWith("http")) {
      throw new Error(corta || `TinyURL respondió ${res.status}`);
    }
    return NextResponse.json({ corta });
  } catch (e) {
    // Si TinyURL falla (caído, límite de uso), se devuelve la URL original
    // sin acortar en vez de bloquear el envío — un link largo que funciona
    // es mejor que ningún link.
    return NextResponse.json({ corta: body.url, aviso: e instanceof Error ? e.message : String(e) });
  }
}
