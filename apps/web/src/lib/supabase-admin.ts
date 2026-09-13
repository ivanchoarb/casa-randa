import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. Server-only: nunca importar esto
 * desde un archivo "use client". Necesario porque `contactos_marketing`
 * (apps/intranet) exige el permiso "marketing" (`to authenticated`) para
 * leer o escribir — un visitante anónimo del sitio público no tiene
 * sesión, así que la suscripción del popup no puede insertarse con la
 * anon key como sí hace `solicitudes` (que tiene su propia policy pública
 * de insert-only).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local — necesarios para el popup de suscripción (ver .env.example).",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
