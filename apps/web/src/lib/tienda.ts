import { supabaseClient } from "@/lib/supabase-client";

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
}

/**
 * `productos_tienda` es pública de lectura (policy "publico_lee_catalogo",
 * 0006_rls.sql). Compartido entre /tienda (catálogo completo) y la
 * vitrina de productos en el inicio ("Llegue a una casa ya surtida",
 * Extras.tsx) para no repetir la misma consulta dos veces.
 */
export async function obtenerProductosDisponibles(limite?: number): Promise<Producto[]> {
  let query = supabaseClient
    .from("productos_tienda")
    .select("id, nombre, descripcion, precio, disponible, imagen_url")
    .eq("disponible", true)
    .order("precio", { ascending: true });
  if (limite) query = query.limit(limite);
  const { data } = await query;
  return data ?? [];
}
