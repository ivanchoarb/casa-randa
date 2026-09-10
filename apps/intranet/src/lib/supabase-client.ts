import { createClient } from "@refinedev/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// No lanzamos un error aquí: este módulo se importa en el layout raíz,
// así que un throw tumbaría el build entero. Sin credenciales reales
// (todavía no existe el proyecto de Supabase, ver supabase/README.md)
// usamos un placeholder con forma de URL válida para que la app
// compile; las llamadas de red simplemente fallarán en runtime hasta
// que se complete apps/intranet/.env.local a partir de .env.example.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — " +
      "usando un placeholder. Copia .env.example a .env.local (ver supabase/README.md).",
  );
}

export const supabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  { auth: { persistSession: true } },
);
