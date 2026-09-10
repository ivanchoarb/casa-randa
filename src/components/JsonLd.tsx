import { ADDRESS } from "@/data/house";

/**
 * Structured data for search engines and AI answer engines (schema.org
 * LodgingBusiness). Rendered server-side as a plain <script> tag — no
 * client JS needed. Keep this in sync with the facts in src/data/house.ts.
 */
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Casa Randa",
    description:
      "Casa completa de seis habitaciones en la antigua Zona del Canal, Diablo Heights, Ciudad de Panamá. Se alquila entera y solo a un grupo, hasta 16 huéspedes.",
    address: {
      "@type": "PostalAddress",
      ...ADDRESS,
    },
    numberOfRooms: 6,
    petsAllowed: false,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.94",
      reviewCount: "16",
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
