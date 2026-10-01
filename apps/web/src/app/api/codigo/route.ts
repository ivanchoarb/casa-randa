import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validarCodigo } from "@/lib/codigo-descuento";

export const dynamic = "force-dynamic";

// Pública: la cotización de la web la usa para saber si un código aplica.
// Responde igual de genérico para "no existe", "vencido" y "agotado".
export async function GET(req: Request) {
  const codigo = new URL(req.url).searchParams.get("codigo");
  const valido = await validarCodigo(getSupabaseAdmin(), codigo);
  if (!valido) return Response.json({ ok: false }, { status: 404 });
  return Response.json({ ok: true, codigo: valido.codigo, pct: valido.pct });
}
