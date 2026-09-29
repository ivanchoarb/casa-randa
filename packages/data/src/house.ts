import type { Comparison, Distance, Room, Score } from "./types";

/**
 * Facts about the house. Edit these constants, not the markup, to change
 * anything about the property — ported 1:1 from the original static
 * prototype's js/casa-randa.js (see legacy-static/).
 */
export const ROOMS: Room[] = [
  { n: 1, beds: [["king", 1]], sleeps: 2 },
  { n: 2, beds: [["twin", 2]], sleeps: 2 },
  { n: 3, beds: [["twin", 2]], sleeps: 2 },
  { n: 4, beds: [["twin", 3]], sleeps: 3 },
  { n: 5, beds: [["twin", 2]], sleeps: 2 },
  { n: 6, beds: [["twin", 2]], sleeps: 2 },
];

export const COMMON_ES = ["Cocina completa con lavavajillas, cafetera y tostadora", "Sala principal con ventanales al jardín", "Segunda sala de estar en el tercer piso", "Comedor para catorce y barra", "Balcón con hamaca", "Patio cerrado con área de BBQ", "Lavandería con lavadora y secadora, sin cargo", "Estacionamiento gratuito para cuatro vehículos", "Internet de 500 megas en toda la casa"];
export const COMMON_EN = ["Full kitchen with dishwasher, coffee maker and toaster", "Main living room with windows onto the garden", "A second sitting room on the third floor", "Dining table for fourteen, plus a bar", "Balcony with a hammock", "Enclosed patio with barbecue", "Laundry with washer and dryer, no charge", "Free parking for four cars", "500 Mbps internet throughout"];

export const DIST: Distance[] = [
  { es: "Aeropuerto de Albrook", en: "Albrook airport", km: 1.3 },
  { es: "Albrook Mall y la Gran Terminal", en: "Albrook Mall and the bus terminal", km: 1.6 },
  { es: "Cima del Cerro Ancón", en: "Top of Cerro Ancón", km: 2.5 },
  { es: "Casco Viejo", en: "Casco Viejo", km: 3.9 },
  { es: "Esclusas de Miraflores", en: "Miraflores Locks", km: 4.1 },
  { es: "Biomuseo", en: "Biomuseo", km: 5.3 },
  { es: "Calzada de Amador", en: "Amador Causeway", km: 5.5 },
  { es: "Aeropuerto de Tocumen", en: "Tocumen airport", km: 23.1 },
];

export const SCORES: Score[] = [
  { es: "Limpieza", en: "Cleanliness", v: 5.0 },
  { es: "Exactitud", en: "Accuracy", v: 5.0 },
  { es: "Llegada", en: "Check-in", v: 5.0 },
  { es: "Comunicación", en: "Communication", v: 5.0 },
  { es: "Precio", en: "Value", v: 5.0 },
  { es: "Ubicación", en: "Location", v: 4.9 },
];

export const VS: Comparison[] = [
  { es: "Cancelación flexible o tarifa no reembolsable, a su elección", en: "Flexible cancellation or a non-refundable rate, your choice", d: true },
  { es: "Anticipo del 30 % y saldo 7 días antes de llegar", en: "30% deposit, balance 7 days before arrival", d: true },
  { es: "Sin comisión de plataforma sobre el total", en: "No platform fee on top of the total", d: true },
  { es: "Extras y despensa encargados antes de llegar", en: "Extras and pantry ordered before you arrive", d: true },
  { es: "Mismo calendario, mismas fechas libres", en: "Same calendar, same open dates", d: "both" },
  { es: "Los mismos anfitriones responden", en: "The same hosts answer", d: "both" },
];

/** House location, for JSON-LD / structured data. */
export const ADDRESS = {
  streetAddress: "Calle Hecker 5624",
  addressLocality: "Diablo Heights, Ancón",
  addressRegion: "Ciudad de Panamá",
  addressCountry: "PA",
};
