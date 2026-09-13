import { supabaseClient } from "@/lib/supabase-client";

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
  categoria: string | null;
}

/**
 * `productos_tienda` es pública de lectura (policy "publico_lee_catalogo",
 * 0006_rls.sql). Compartido entre /tienda (catálogo completo) y la
 * vitrina de productos en el inicio ("Llegue a una casa ya surtida",
 * Extras.tsx) para no repetir la misma consulta dos veces.
 *
 * `orden` por defecto es `created_at` — el orden que /tienda usa como
 * "Sugeridos" antes de que el visitante elija un orden distinto ahí. La
 * vitrina del inicio pide `orden: "precio"` explícitamente para seguir
 * mostrando siempre los productos más baratos, no los más nuevos.
 */
export async function obtenerProductosDisponibles(opciones?: {
  limite?: number;
  orden?: "created_at" | "precio";
}): Promise<Producto[]> {
  let query = supabaseClient
    .from("productos_tienda")
    .select("id, nombre, descripcion, precio, disponible, imagen_url, categoria")
    .eq("disponible", true);
  query =
    opciones?.orden === "precio"
      ? query.order("precio", { ascending: true })
      : query.order("created_at", { ascending: true });
  if (opciones?.limite) query = query.limit(opciones.limite);
  const { data } = await query;
  return data ?? [];
}
