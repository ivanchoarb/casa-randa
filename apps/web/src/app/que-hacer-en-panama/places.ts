import type { Bilingual } from "@casa-randa/data";

/**
 * Real recommended places, ported from the current staging.randahome.com
 * WordPress guide (same business, same content — this is a migration, not
 * third-party copy) so the Next.js site carries the actual researched
 * recommendations instead of generic landmarks. Photos are pending for
 * all of these, same gap as the house's own gallery — see LEEME.md.
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
  rating: number; // out of 5
  priceLevel: 1 | 2 | 3;
  teaser: Bilingual;
  why: Bilingual;
  distance: Bilingual;
  howToGetThere: Bilingual;
  hours: Bilingual;
  priceReference: Bilingual;
  officialSite: string;
  mapUrl: string;
  phone?: string;
}

export const PLACES: Place[] = [
  {
    slug: "centro-de-visitantes-de-miraflores",
    category: "canal",
    name: "Centro de Visitantes de Miraflores",
    rating: 5,
    priceLevel: 2,
    teaser: {
      es: "Observe en primera fila cómo los barcos atraviesan las esclusas del Canal de Panamá y descubra la historia de una de las grandes obras de ingeniería del mundo.",
      en: "Watch ships cross the Panama Canal locks from a front-row viewpoint and discover the story behind one of the world's great engineering achievements.",
    },
    why: {
      es: "Miraflores es una visita esencial para entender Panamá. Sus terrazas permiten observar las esclusas en operación y el tránsito de grandes embarcaciones. La entrada incluye la película IMAX sobre la historia y el funcionamiento del Canal. Recomendamos reservar aproximadamente una hora y media y comprobar previamente el horario estimado de tránsito de barcos.",
      en: "Miraflores is an essential stop for understanding Panama. Its terraces let you watch the locks in operation and large ships in transit. Admission includes the IMAX film on the Canal's history and operation. We recommend setting aside about an hour and a half and checking the estimated ship-transit schedule beforehand.",
    },
    distance: {
      es: "Aproximadamente 10–15 minutos desde Casa Randa, según el tráfico.",
      en: "About 10–15 minutes from Casa Randa, depending on traffic.",
    },
    howToGetThere: {
      es: "La opción más cómoda es taxi o transporte por aplicación. Casa Randa también puede ayudar a coordinar el traslado.",
      en: "The most convenient option is a taxi or ride-hailing app. Casa Randa can also help coordinate transport.",
    },
    hours: {
      es: "Todos los días. Boletería: 8:00 a. m.–5:00 p. m. Atención: 8:00 a. m.–6:00 p. m.",
      en: "Every day. Ticket office: 8 a.m.–5 p.m. Open until 6 p.m.",
    },
    priceReference: {
      es: "Residentes: adultos USD 3.00; menores hasta 18 años gratis. No residentes: adultos USD 17.22; niños de 6 a 12 años USD 7.22; menores de 6 años gratis.",
      en: "Residents: adults USD 3.00; under 18 free. Non-residents: adults USD 17.22; children 6–12 USD 7.22; under 6 free.",
    },
    officialSite: "https://visitcanaldepanama.com/es/sitios-de-interes/centro-de-visitantes-de-miraflores/",
    mapUrl: "https://maps.google.com/?q=Centro+de+Visitantes+de+Miraflores+Panama",
    phone: "+507 276-8431",
  },
  {
    slug: "multiplaza-panama",
    category: "ciudad",
    name: "Multiplaza Panamá",
    rating: 4,
    priceLevel: 2,
    teaser: {
      es: "Compras, gastronomía y entretenimiento en un ambiente moderno, con marcas internacionales, propuestas premium y opciones para toda la familia.",
      en: "Shopping, dining and entertainment in a modern setting with international brands, premium concepts and family-friendly options.",
    },
    why: {
      es: "Multiplaza Panamá es una de las mejores opciones de la ciudad para quienes buscan marcas internacionales, moda, tecnología y una experiencia de compras más premium. Reúne más de 350 conceptos, una amplia oferta gastronómica, cine y entretenimiento. Luxury Avenue concentra varias firmas exclusivas, mientras que el resto del centro comercial ofrece alternativas para distintos presupuestos.",
      en: "Multiplaza Panama is one of the city's best options for international brands, fashion, tech and a more premium shopping experience. It brings together more than 350 stores, a wide dining offer, a cinema and entertainment. Luxury Avenue gathers several exclusive names, while the rest of the mall offers options for different budgets.",
    },
    distance: {
      es: "Aproximadamente 20–30 minutos desde Casa Randa, dependiendo del tráfico.",
      en: "About 20–30 minutes from Casa Randa, depending on traffic.",
    },
    howToGetThere: {
      es: "Recomendamos taxi o transporte por aplicación. La ruta más conveniente normalmente cruza hacia el centro por Avenida Balboa o Corredor Sur, según el tráfico.",
      en: "We recommend a taxi or ride-hailing app. The most convenient route usually crosses into downtown via Avenida Balboa or Corredor Sur, depending on traffic.",
    },
    hours: {
      es: "Lunes a sábado: 10:00 a. m.–8:00 p. m. Domingos: 11:00 a. m.–7:00 p. m. Algunos restaurantes y servicios pueden tener horarios diferentes.",
      en: "Monday to Saturday: 10 a.m.–8 p.m. Sundays: 11 a.m.–7 p.m. Some restaurants and services may keep different hours.",
    },
    priceReference: {
      es: "Entrada gratuita. El costo de compras y consumo varía por establecimiento; incluye numerosas marcas premium. Nivel general: moderado.",
      en: "Free admission. Shopping and dining costs vary by store, including several premium brands. Overall level: moderate.",
    },
    officialSite: "https://multiplaza.com/panama",
    mapUrl: "https://maps.google.com/?q=Multiplaza+Panama+Via+Israel",
    phone: "+507 833-9991",
  },
  {
    slug: "albrook-mall-panama",
    category: "ciudad",
    name: "Albrook Mall",
    rating: 4,
    priceLevel: 1,
    teaser: {
      es: "Compras, gastronomía y entretenimiento en uno de los centros comerciales más completos de Panamá, especialmente práctico para familias y grupos.",
      en: "Shopping, dining and entertainment at one of Panama's most complete malls, especially convenient for families and groups.",
    },
    why: {
      es: "Albrook Mall es una opción muy práctica para combinar compras, comida y entretenimiento en una sola salida. Reúne más de 700 comercios, tres áreas de comida, cine, bolos y opciones para diferentes presupuestos. Su sistema de pasillos identificados con animales facilita la orientación.",
      en: "Albrook Mall is a very practical option for combining shopping, food and entertainment in one outing. It brings together more than 700 stores, three food courts, a cinema, bowling and options for different budgets. Its animal-themed aisle system makes it easy to find your way around.",
    },
    distance: {
      es: "Aproximadamente 5–10 minutos desde Casa Randa, según el tráfico.",
      en: "About 5–10 minutes from Casa Randa, depending on traffic.",
    },
    howToGetThere: {
      es: "Taxi o transporte por aplicación es la alternativa más rápida. También está conectado con la estación Albrook del Metro y la Gran Terminal Nacional de Transporte.",
      en: "A taxi or ride-hailing app is the fastest option. It's also connected to the Albrook Metro station and the national bus terminal.",
    },
    hours: {
      es: "Lunes a sábado: 10:00 a. m.–8:00 p. m. Domingos: 11:00 a. m.–7:00 p. m. Algunos establecimientos manejan horarios diferentes.",
      en: "Monday to Saturday: 10 a.m.–8 p.m. Sundays: 11 a.m.–7 p.m. Some stores keep different hours.",
    },
    priceReference: {
      es: "Entrada gratuita. Compras y consumo según cada establecimiento. Nivel de costo general: económico.",
      en: "Free admission. Shopping and dining costs vary by store. Overall level: budget-friendly.",
    },
    officialSite: "https://www.albrookmall.com/",
    mapUrl: "https://maps.google.com/?q=Albrook+Mall+Panama",
  },
  {
    slug: "isla-taboga-panama",
    category: "playas",
    name: "Isla Taboga",
    rating: 4,
    priceLevel: 2,
    teaser: {
      es: "Una escapada de playa, historia y naturaleza a solo 30 minutos en ferry de Ciudad de Panamá, ideal para disfrutar durante el día.",
      en: "A beach, history and nature escape just 30 minutes by ferry from Panama City, ideal for an easy day trip.",
    },
    why: {
      es: "Conocida como la Isla de las Flores, Taboga combina playas tranquilas, un pueblo histórico, senderos y vistas hacia la bahía de Panamá. Playa La Restinga y Playa Honda son sus principales zonas de baño; también es posible practicar paddle, snorkeling, pesca y, en temporada, avistamiento de ballenas. Recomendamos salir temprano, llevar protección solar, calzado cómodo, agua y efectivo.",
      en: "Known as the Island of Flowers, Taboga combines quiet beaches, a historic village, trails and views over the Bay of Panama. Playa La Restinga and Playa Honda are its main swimming spots; paddleboarding, snorkeling, fishing and, in season, whale watching are also possible. We recommend leaving early and bringing sunscreen, comfortable shoes, water and cash.",
    },
    distance: {
      es: "De Casa Randa a Fuerte Amador: aproximadamente 15–20 minutos por carretera. Ferry a Taboga: aproximadamente 30 minutos.",
      en: "From Casa Randa to Fuerte Amador: about 15–20 minutes by road. Ferry to Taboga: about 30 minutes.",
    },
    howToGetThere: {
      es: "La ruta recomendada es transporte privado o por aplicación desde Casa Randa hasta Taboga Express en Fuerte Amador, Isla Flamenco, y luego ferry rápido. Casa Randa puede ayudar a coordinar la experiencia.",
      en: "The recommended route is private or ride-hailing transport from Casa Randa to Taboga Express in Fuerte Amador, Isla Flamenco, then the fast ferry. Casa Randa can help coordinate the trip.",
    },
    hours: {
      es: "Los horarios del ferry varían según el día y la temporada. Se recomienda reservar con anticipación y presentarse antes de la hora indicada para el check-in.",
      en: "Ferry schedules vary by day and season. We recommend booking ahead and arriving before the indicated check-in time.",
    },
    priceReference: {
      es: "El costo depende del ferry, la fecha y las actividades elegidas. Consulte la tarifa vigente o solicite una experiencia coordinada por Casa Randa.",
      en: "Cost depends on the ferry, date and chosen activities. Check current fares or request a trip coordinated by Casa Randa.",
    },
    officialSite: "https://tabogaexpress.com/es/boletos/",
    mapUrl: "https://maps.google.com/?q=Isla+Taboga+Panama",
    phone: "+507 6234-8989",
  },
  {
    slug: "maagoos-fish-tacos-panama",
    category: "gastronomia",
    name: "MaaGoo's Fish Tacos & More",
    rating: 4,
    priceLevel: 2,
    teaser: {
      es: "Un restaurante informal y lleno de personalidad en Corozal, conocido por sus tacos de pescado fresco, preparaciones ahumadas, ceviches y sabores caribeños. Una excelente opción para comer cerca de Casa Randa y del Canal de Panamá.",
      en: "A relaxed restaurant full of character in Corozal, known for fresh fish tacos, smoked seafood, ceviche and Caribbean flavors. An excellent dining option near Casa Randa and the Panama Canal.",
    },
    why: {
      es: "Es una recomendación especial para quienes disfrutan los mariscos frescos y los ambientes relajados. Su especialidad son los tacos de pescado, disponibles en diferentes preparaciones, incluyendo pescado a la parrilla y pescado ahumado. El menú también ofrece ceviche, sopa de pescado, fish nachos, burritos, bowls, guacamole y pollo jerk. El restaurante tiene un ambiente informal, decoración inspirada en la pesca, espacios interiores y exteriores y, en algunas ocasiones, música en vivo.",
      en: "A special recommendation for anyone who enjoys fresh seafood and a relaxed setting. Its specialty is fish tacos, available grilled or smoked. The menu also offers ceviche, fish soup, fish nachos, burritos, bowls, guacamole and jerk chicken. The restaurant has a casual, fishing-inspired décor, indoor and outdoor seating, and occasional live music.",
    },
    distance: {
      es: "Aproximadamente 5–10 minutos en automóvil desde Casa Randa, dependiendo del tráfico.",
      en: "About 5–10 minutes by car from Casa Randa, depending on traffic.",
    },
    howToGetThere: {
      es: "La forma más cómoda es viajar en automóvil, taxi o transporte por aplicación desde Casa Randa hacia Corozal Oeste. El restaurante se encuentra en One Blue Plaza, locales 1 y 2, cerca de la avenida Omar Torrijos Herrera.",
      en: "The most convenient way is by car, taxi or ride-hailing app from Casa Randa to Corozal Oeste. The restaurant is at One Blue Plaza, units 1 and 2, near Avenida Omar Torrijos Herrera.",
    },
    hours: {
      es: "Lunes: cerrado. Martes a sábado: 12:00 p. m.–10:00 p. m. Domingo: 12:00 p. m.–9:00 p. m. Confirme el horario directamente con el restaurante antes de visitarlo.",
      en: "Monday: closed. Tuesday to Saturday: 12–10 p.m. Sunday: 12–9 p.m. Confirm hours directly with the restaurant before visiting.",
    },
    priceReference: {
      es: "Consumo aproximado de USD 15–30 por persona. Como referencia, dos tacos de pescado cuestan alrededor de USD 11.99 y tres tacos alrededor de USD 15.50. Los precios pueden cambiar.",
      en: "Approximately USD 15–30 per person. As a reference, two fish tacos cost around USD 11.99 and three around USD 15.50. Prices may change.",
    },
    officialSite: "https://www.facebook.com/maagoosfishtacos/",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Maagoos+Fish+Tacos+Corozal+Panama",
    phone: "+507 317-6850",
  },
];
