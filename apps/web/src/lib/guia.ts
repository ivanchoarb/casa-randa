import { supabaseClient } from "@/lib/supabase-client";
import type { CategoryKey, Place } from "@/app/que-hacer-en-panama/places";

interface Fila {
  slug: string;
  categoria: CategoryKey;
  nombre: string;
  nivel_precio: 1 | 2 | 3;
  imagenes: string[];
  resumen_es: string;
  resumen_en: string;
  por_que_es: string;
  por_que_en: string;
  distancia_es: string;
  distancia_en: string;
  como_llegar_es: string;
  como_llegar_en: string;
  horario_es: string;
  horario_en: string;
  precio_ref_es: string;
  precio_ref_en: string;
  sitio_oficial: string | null;
  mapa_url: string | null;
  telefono: string | null;
}

const COLUMNAS =
  "slug, categoria, nombre, nivel_precio, imagenes, resumen_es, resumen_en, por_que_es, por_que_en, " +
  "distancia_es, distancia_en, como_llegar_es, como_llegar_en, horario_es, horario_en, " +
  "precio_ref_es, precio_ref_en, sitio_oficial, mapa_url, telefono";

function aLugar(f: Fila): Place {
  return {
    slug: f.slug,
    category: f.categoria,
    name: f.nombre,
    priceLevel: f.nivel_precio,
    images: f.imagenes,
    teaser: { es: f.resumen_es, en: f.resumen_en },
    why: { es: f.por_que_es, en: f.por_que_en },
    distance: { es: f.distancia_es, en: f.distancia_en },
    howToGetThere: { es: f.como_llegar_es, en: f.como_llegar_en },
    hours: { es: f.horario_es, en: f.horario_en },
    priceReference: { es: f.precio_ref_es, en: f.precio_ref_en },
    officialSite: f.sitio_oficial || undefined,
    mapUrl: f.mapa_url || undefined,
    phone: f.telefono || undefined,
  };
}

// `lugares_guia` es pública de lectura (policy "publico_lee_lugares_guia",
// 0034). Un error de consulta lanza en vez de devolver una lista vacía: con
// ISR, Next sigue sirviendo la última página buena si la regeneración falla,
// en cambio una guía "vacía" cacheada sería peor que no actualizar.
export async function obtenerLugares(): Promise<Place[]> {
  const { data, error } = await supabaseClient
    .from("lugares_guia")
    .select(COLUMNAS)
    .order("created_at", { ascending: true })
    .returns<Fila[]>();
  if (error) throw new Error(`No se pudo leer la guía: ${error.message}`);
  return (data ?? []).map(aLugar);
}

export async function obtenerLugar(slug: string): Promise<Place | null> {
  const { data, error } = await supabaseClient
    .from("lugares_guia")
    .select(COLUMNAS)
    .eq("slug", slug)
    .maybeSingle<Fila>();
  if (error) throw new Error(`No se pudo leer el lugar: ${error.message}`);
  return data ? aLugar(data) : null;
}
