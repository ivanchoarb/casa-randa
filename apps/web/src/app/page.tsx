import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BookingProvider } from "@/lib/booking/BookingProvider";
import { obtenerProductosDisponibles } from "@/lib/tienda";
import { Hero } from "@/components/sections/Hero";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { NightToDayReveal } from "@/components/sections/NightToDayReveal";
import { House } from "@/components/sections/House";
import { QuoteCalculator } from "@/components/sections/QuoteCalculator";
import { Neighborhood } from "@/components/sections/Neighborhood";
import { Reviews } from "@/components/sections/Reviews";
import { Extras } from "@/components/sections/Extras";

// La página de inicio se sigue generando estática (ISR), a diferencia de
// /tienda (force-dynamic ahí porque hay compra real en juego) — acá solo
// es una vitrina de 3 productos, no vale la pena perder el cacheo/SEO de
// una página estática por eso. Se refresca sola cada 5 minutos.
export const revalidate = 300;

export default async function Home() {
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

        <NightToDayReveal />

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
