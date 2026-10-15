import type { Bilingual } from "@casa-randa/data";

/**
 * Tipos y categorías de la guía. Los lugares en sí viven en la tabla
 * `lugares_guia` (0034_lugares_guia.sql) y se administran desde la sección
 * "Qué hacer" de la intranet; se leen con `obtenerLugares()` en
 * `@/lib/guia`. Los 5 lugares originales se portaron desde la guía de
 * staging.randahome.com (WordPress) a esa tabla tal cual.
 *
 * Las categorías siguen fijas aquí (y en el CHECK de la tabla): agregar una
 * nueva sí requiere código, agregar lugares dentro de ellas no.
 */

export type CategoryKey = "ciudad" | "canal" | "playas" | "pueblos" | "gastronomia" | "nocturna";

export const CATEGORIES: { key: CategoryKey; es: string; en: string }[] = [
  { key: "ciudad", es: "Ciudad de Panamá", en: "Panama City" },
  { key: "canal", es: "Canal y naturaleza", en: "Canal & nature" },
  { key: "playas", es: "Playas", en: "Beaches" },
  { key: "pueblos", es: "Pueblos y escapadas", en: "Towns & escapes" },
  { key: "gastronomia", es: "Gastronomía", en: "Food & dining" },
  { key: "nocturna", es: "Vida nocturna", en: "Nightlife" },
];

export interface Place {
  slug: string;
  category: CategoryKey;
  name: string;
  priceLevel: 1 | 2 | 3;
  /** URLs públicas del bucket `imagenes-guia`. Vacío mientras no haya fotos
   *  reales con licencia: la tarjeta y el detalle muestran un marcador de
   *  marca en vez de una foto de stock. */
  images: string[];
  /** Línea de atribución de las fotos (licencias CC); opcional. */
  photoCredit?: string;
  teaser: Bilingual;
  why: Bilingual;
  distance: Bilingual;
  howToGetThere: Bilingual;
  hours: Bilingual;
  priceReference: Bilingual;
  officialSite?: string;
  mapUrl?: string;
  phone?: string;
}
