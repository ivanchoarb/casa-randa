import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PageHero } from "@/components/ui/PageHero";
import { ShopSections } from "./ShopSections";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Vino, café, desayuno y extras para encontrar ya en la cocina al llegar a Casa Randa.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          title={{ es: "Llegue a una casa ya surtida", en: "Arrive to a house already stocked" }}
          intro={{
            es: "Elija el vino, el café, el desayuno y los extras antes de viajar. Todo pedido se prepara para su reserva, no para cualquiera.",
            en: "Pick the wine, the coffee, the breakfast and the extras before you travel. Every order is prepared for your booking, not for anyone.",
          }}
        />
        <ShopSections />
      </main>
      <SiteFooter />
    </>
  );
}
