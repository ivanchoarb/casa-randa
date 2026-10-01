import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GIF transparente de 1x1.
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Imagen invisible de las campañas de correo (la agrega apps/intranet
 * /api/marketing/enviar-lote a cada envío): al cargarse registra una
 * apertura de ese destinatario. Siempre devuelve el GIF, falle o no el
 * registro, y nunca se cachea para que cada apertura llegue aquí.
 * Cifra orientativa: Gmail/Apple Mail precargan imágenes y quien las bloquea
 * no cuenta.
 */
export async function GET(req: Request) {
  const d = new URL(req.url).searchParams.get("d") ?? "";
  if (UUID.test(d)) {
    try {
      // Un id que no existe falla por la llave foránea y se ignora.
      await getSupabaseAdmin().from("eventos_web").insert({ tipo: "apertura_correo", ruta: "/correo", destinatario_id: d });
    } catch {
      // métricas: nunca rompen nada
    }
  }
  return new Response(GIF, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate", "Content-Length": String(GIF.length) },
  });
}
