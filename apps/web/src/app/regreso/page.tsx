import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { RegresoContent } from "./RegresoContent";

// noindex: es una promoción para huéspedes anteriores (lleva el código de
// descuento), no una página para posicionar en Google.
export const metadata: Metadata = {
  title: "Volver a Casa Randa cuesta 5% menos",
  description: "Ya abrimos randahome.com. Si ya se hospedó con nosotros, reserve directo con 5% de descuento.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <RegresoContent />
      </main>
      <SiteFooter />
    </>
  );
}
