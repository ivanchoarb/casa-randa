// Heurística simple: país de origen → idioma probable para el correo. No es
// perfecto (alguien de EE.UU. puede preferir español, o al revés), pero es
// el mismo criterio que pidió Ivan ("el lugar de origen... así determinamos
// el idioma") — un punto de partida para ver/filtrar la lista de Marketing
// a mano, no una traducción automática de las campañas.
const PAISES_ESPANOL = new Set([
  "panama",
  "panamá",
  "colombia",
  "mexico",
  "méxico",
  "españa",
  "espana",
  "argentina",
  "chile",
  "peru",
  "perú",
  "venezuela",
  "ecuador",
  "bolivia",
  "paraguay",
  "uruguay",
  "costa rica",
  "guatemala",
  "honduras",
  "el salvador",
  "nicaragua",
  "republica dominicana",
  "república dominicana",
  "cuba",
]);

export function idiomaSugerido(pais: string | null | undefined): "es" | "en" | null {
  const normalizado = pais?.trim().toLowerCase();
  if (!normalizado) return null;
  return PAISES_ESPANOL.has(normalizado) ? "es" : "en";
}

export const IDIOMA_LABEL: Record<"es" | "en", string> = { es: "Español", en: "Inglés" };
