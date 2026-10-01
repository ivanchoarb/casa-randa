import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["visita", "click_codigo", "codigo_aplicado", "click_cta"]);
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|vercel/i;

const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Recibe los eventos de apps/web (analytics.ts). Pública por necesidad
 * (los visitantes no tienen sesión), así que valida todo y siempre responde
 * 204: un fallo de métricas nunca debe notarse en la web.
 * Sin límite de frecuencia por IP todavía — ponytail: si alguien inunda la
 * tabla, agregar un tope por visitante_id/hora.
 */
export async function POST(req: Request) {
  try {
    if (BOTS.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
    const raw = await req.text();
    if (raw.length > 2000) return new Response(null, { status: 204 });
    const b = JSON.parse(raw);
    if (!TIPOS.has(b.tipo)) return new Response(null, { status: 204 });
    const ruta = texto(b.ruta, 200);
    if (!ruta || !ruta.startsWith("/")) return new Response(null, { status: 204 });

    await getSupabaseAdmin().from("eventos_web").insert({
      tipo: b.tipo,
      ruta,
      visitante_id: texto(b.visitante_id, 64),
      referrer: texto(b.referrer, 200),
      utm_source: texto(b.utm_source, 100),
      utm_medium: texto(b.utm_medium, 100),
      utm_campaign: texto(b.utm_campaign, 100),
      utm_content: texto(b.utm_content, 100),
      idioma: texto(b.idioma, 10),
      // Código ISO del país que Vercel deduce de la IP (no se guarda la IP). Sin cabecera en local.
      pais: /^[A-Za-z]{2}$/.test(req.headers.get("x-vercel-ip-country") ?? "") ? req.headers.get("x-vercel-ip-country")!.toUpperCase() : null,
      dispositivo: b.dispositivo === "movil" || b.dispositivo === "escritorio" ? b.dispositivo : null,
    });
  } catch {
    // métricas: nunca rompen nada
  }
  return new Response(null, { status: 204 });
}
