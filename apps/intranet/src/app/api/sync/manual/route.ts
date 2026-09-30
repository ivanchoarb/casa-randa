import { NextRequest, NextResponse } from "next/server";
import { puede } from "@/lib/permisos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * 2026-09-30, a pedido de Ivan: un botón real en el Calendario para
 * disparar la sincronización sin depender de pedirlo por chat. Los jobs
 * reales (/api/sync/ical, /api/sync/pricelabs) siguen protegidos por
 * SYNC_SECRET — pensado para un cron server-to-server, no para exponerlo
 * en JS de cliente — así que esta ruta verifica la sesión real de quien
 * hace clic (mismo patrón que /api/checkin/foto) y, ya autorizada, llama
 * a esos dos jobs por su cuenta con el secreto, que nunca sale del
 * servidor.
 */
export async function POST(req: NextRequest) {
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
  if (perfilError || !puede(perfil?.rol, perfil?.permisos, "calendario")) {
    return NextResponse.json({ error: "No tienes permiso para sincronizar el calendario." }, { status: 403 });
  }

  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SYNC_SECRET no está configurado en este entorno." }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${secret}` };
  const origin = req.nextUrl.origin;

  const [ical, pricelabs] = await Promise.all([
    fetch(`${origin}/api/sync/ical`, { headers })
      .then((r) => r.json())
      .catch((error) => ({ ok: false, error: String(error) })),
    fetch(`${origin}/api/sync/pricelabs`, { headers })
      .then((r) => r.json())
      .catch((error) => ({ ok: false, error: String(error) })),
  ]);

  return NextResponse.json({ sincronizado_en: new Date().toISOString(), ical, pricelabs });
}
