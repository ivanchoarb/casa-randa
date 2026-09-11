import type { Bilingual } from "@casa-randa/data";

/**
 * Editorial copy for the Panama guide. Distances/points of interest match
 * DIST in @casa-randa/data; the write-up here is additional context, not
 * a house fact, so it stays local to this page rather than in the shared
 * data package. If this grows or needs non-dev editing, see the Sanity
 * note in docs/arquitectura-migracion.md.
 */
export interface Highlight extends Bilingual {
  distKey: string; // matches an entry's `es` field in DIST, for the distance lookup
  descEs: string;
  descEn: string;
}

export const HIGHLIGHTS: Highlight[] = [
  {
    es: "Casco Viejo",
    en: "Casco Viejo",
    distKey: "Casco Viejo",
    descEs:
      "El centro histórico de la ciudad, declarado Patrimonio de la Humanidad: calles de balcones coloniales, plazas y azoteas con vista a la bahía y los rascacielos del otro lado.",
    descEn:
      "The city's historic quarter, a UNESCO World Heritage Site: colonial balconies, plazas, and rooftop bars looking across the bay at the skyline.",
  },
  {
    es: "Cima del Cerro Ancón",
    en: "Top of Cerro Ancón",
    distKey: "Cima del Cerro Ancón",
    descEs:
      "Una caminata corta y empinada dentro de la propia ciudad, entre monos aulladores y perezosos, que termina en el mejor mirador de Panamá: el Canal, el Casco Viejo y el puerto, todo a la vez.",
    descEn:
      "A short, steep hike inside the city itself, past howler monkeys and sloths, ending at Panama's best lookout: the Canal, Casco Viejo, and the port, all at once.",
  },
  {
    es: "Esclusas de Miraflores",
    en: "Miraflores Locks",
    distKey: "Esclusas de Miraflores",
    descEs:
      "El centro de visitantes del Canal, con terrazas sobre las esclusas para ver de cerca cómo suben y bajan los barcos de carga. Conviene revisar el horario de tránsito de barcos antes de ir.",
    descEn:
      "The Canal's visitor center, with terraces right over the locks to watch cargo ships rise and fall up close. Worth checking the ship-transit schedule before heading over.",
  },
  {
    es: "Biomuseo",
    en: "Biomuseo",
    distKey: "Biomuseo",
    descEs:
      "El museo de Frank Gehry en la entrada de la Calzada de Amador, sobre cómo el istmo de Panamá cambió la vida en el planeta al unir dos continentes y separar dos océanos.",
    descEn:
      "Frank Gehry's museum at the entrance to the Amador Causeway, on how the Panamanian isthmus changed life on the planet by joining two continents and splitting two oceans.",
  },
  {
    es: "Calzada de Amador",
    en: "Amador Causeway",
    distKey: "Calzada de Amador",
    descEs:
      "Un camino sobre el mar que une cuatro islas, con vista a los barcos esperando turno para entrar al Canal. Se recorre a pie, en bici o en bicicleta de cuatro ruedas alquilada en el sitio.",
    descEn:
      "A causeway over the sea linking four islands, with a view of ships queued to enter the Canal. Walk it, cycle it, or rent a four-wheel bike right there.",
  },
];
