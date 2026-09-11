import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. Server-only: never import this from a
 * "use client" file or anything that ships to the browser bundle. Used by
 * the sync jobs under src/app/api/sync/, which write to bloqueos_calendario
 * and tarifas_diarias — tables the anon/authenticated RLS policies only
 * grant SELECT on (see supabase/migrations/0006_rls.sql), by design.
 *
 * SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix) comes from
 * Project Settings → API → service_role secret in the Supabase dashboard.
 * Treat it like a root password — it is not the same key as
 * NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local — " +
        "necesarios para los jobs de sincronización (ver supabase/README.md).",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
