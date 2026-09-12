import { createClient } from "@supabase/supabase-js";

// Cliente anon, de solo lectura/escritura restringida por RLS — usado
// hoy solo para insertar en `solicitudes` desde el formulario de
// "Solicitar estas fechas" (ver QuoteCalculator.tsx). La policy
// "publico_crea_solicitud" (supabase/migrations/0006_rls.sql) permite
// el insert a cualquiera pero no leer las solicitudes de otros — no
// hace falta una ruta de servidor con la service_role key para esto.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en apps/web/.env.local — " +
      "el formulario de solicitud de reserva no podrá enviarse.",
  );
}

export const supabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  { auth: { persistSession: false } },
);
