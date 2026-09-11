import type { Bilingual } from "@casa-randa/data";

/**
 * Sample catalog — matches the shape of `productos_tienda` in Supabase
 * (nombre, descripcion, precio, disponible; see
 * supabase/migrations/0004_tienda_y_planificacion.sql) so swapping this
 * for a real fetch later is a drop-in change, not a rewrite. Prices are
 * illustrative, not live.
 */
export interface ShopProduct {
  nombre: Bilingual;
  descripcion: Bilingual;
  precio: number;
  disponible: boolean;
}

export const PRODUCTS: ShopProduct[] = [
  {
    nombre: { es: "Vino de bienvenida", en: "Welcome wine" },
    descripcion: {
      es: "Una botella de tinto o blanco, elegida por usted, esperando en la cocina al llegar.",
      en: "A bottle of red or white, your choice, waiting in the kitchen when you arrive.",
    },
    precio: 18,
    disponible: true,
  },
  {
    nombre: { es: "Café de Boquete, libra", en: "Boquete coffee, per pound" },
    descripcion: {
      es: "Café de las tierras altas de Chiriquí, molido o en grano.",
      en: "Coffee from the Chiriquí highlands, ground or whole bean.",
    },
    precio: 14,
    disponible: true,
  },
  {
    nombre: { es: "Desayuno completo para el grupo", en: "Full breakfast for the group" },
    descripcion: {
      es: "Huevos, fruta, pan y jugo, listo para catorce el primer día.",
      en: "Eggs, fruit, bread and juice, ready for fourteen on your first morning.",
    },
    precio: 12,
    disponible: true,
  },
  {
    nombre: { es: "Canasta de frutas tropicales", en: "Tropical fruit basket" },
    descripcion: { es: "Piña, sandía, papaya y banano de temporada.", en: "Seasonal pineapple, watermelon, papaya and banana." },
    precio: 10,
    disponible: true,
  },
  {
    nombre: { es: "Parrillada lista para el patio", en: "Ready-to-grill barbecue set" },
    descripcion: {
      es: "Carnes, carbón y encendedor para el área de BBQ, listo para la primera noche.",
      en: "Meats, charcoal and a lighter for the barbecue area, ready for your first night.",
    },
    precio: 65,
    disponible: true,
  },
  {
    nombre: { es: "Toallas y ropa de cama extra", en: "Extra towels and linens" },
    descripcion: { es: "Un juego adicional por huésped, para grupos de 15 o 16.", en: "One extra set per guest, for groups of 15 or 16." },
    precio: 25,
    disponible: true,
  },
];
