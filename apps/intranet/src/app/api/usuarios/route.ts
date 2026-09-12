import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { usuariosHandler } from "@/lib/usuarios-api";

export const dynamic = "force-dynamic";
const handle = usuariosHandler(getSupabaseAdmin);
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
