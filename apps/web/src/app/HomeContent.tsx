import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BookingProvider } from "@/lib/booking/BookingProvider";
import { obtenerProductosDisponibles } from "@/lib/tienda";
import { Hero } from "@/components/sections/Hero";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { House } from "@/components/sections/House";
import { QuoteCalculator } from "@/components/sections/QuoteCalculator";
import { Neighborhood } from "@/components/sections/Neighborhood";
import { Reviews } from "@/components/sections/Reviews";
import { Extras } from "@/components/sections/Extras";

/**
 * The homepage's body, shared by `/` (Spanish, default) and `/en` (English)
 * — same content and components either way, `useLanguage()` inside each
 * section picks the right copy. Kept out of `page.tsx` so both routes can
 * render it with their own (language-specific) `metadata` export.
 */
export async function HomeContent() {
  // 10 en vez de 3 — un carrusel de solo 3 tarjetas no da mucho para
  // desplazar. Sigue ordenado por precio (los más baratos primero), no
  // por categoría, para no complicar una vitrina que solo busca invitar
  // a ver /tienda, no representar el catálogo completo.
  const productos = await obtenerProductosDisponibles({ limite: 10, orden: "precio" });

  return (
    <BookingProvider>
      <JsonLd />

      <SiteHeader />

      <main id="top" className="flex-1">
        <Hero />
        <AvailabilityBar />

        <div id="casa">
          <House />
        </div>

        <div id="reservar">
          <QuoteCalculator />
        </div>

        <div id="barrio">
          <Neighborhood />
        </div>

        <div id="resenas">
          <Reviews />
        </div>

        <Extras productos={productos} />
      </main>

      <SiteFooter />
    </BookingProvider>
  );
}
