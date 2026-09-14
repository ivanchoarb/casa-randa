import { puede } from "@/lib/permisos";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * El bucket "documentos-checkin" (supabase/migrations/0027_checkin_huespedes.sql)
 * no tiene ninguna policy de storage.objects a propósito — ni para anon ni
 * para authenticated — así que la única forma de leerlo es con el cliente
 * de servicio, nunca directo desde el navegador. Esta ruta genera una
 * signed URL de un minuto (justo para mostrar la imagen, no para
 * compartirla) verificando la sesión real de quien llama, mismo patrón que
 * /api/cotizaciones/enviar-correo.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("rol, permisos")
    .eq("id", userData.user.id)
    .single();
  if (perfilError || !puede(perfil?.rol, perfil?.permisos, "contabilidad")) {
    return NextResponse.json({ error: "No tienes permiso para ver documentos de check-in." }, { status: 403 });
  }

  const ruta = req.nextUrl.searchParams.get("ruta");
  if (!ruta) return NextResponse.json({ error: "falta la ruta del documento" }, { status: 400 });

  const { data, error } = await supabase.storage.from("documentos-checkin").createSignedUrl(ruta, 60);
  if (error || !data) return NextResponse.json({ error: "No se pudo generar el enlace del documento." }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}
