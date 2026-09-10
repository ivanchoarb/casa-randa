import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { BookingProvider } from "@/lib/booking/BookingProvider";
import { Hero } from "@/components/sections/Hero";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { House } from "@/components/sections/House";
import { QuoteCalculator } from "@/components/sections/QuoteCalculator";
import { Neighborhood } from "@/components/sections/Neighborhood";
import { Reviews } from "@/components/sections/Reviews";
import { Extras } from "@/components/sections/Extras";

export default function Home() {
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

        <Extras />
      </main>

      <SiteFooter />
    </BookingProvider>
  );
}
