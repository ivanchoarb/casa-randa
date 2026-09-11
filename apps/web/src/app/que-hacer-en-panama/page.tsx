import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PageHero } from "@/components/ui/PageHero";
import { GuideList } from "./GuideList";

export const metadata: Metadata = {
  title: "Qué hacer en Panamá",
  description: "Una selección honesta de lugares, sabores y experiencias que sí recomendamos cerca de Casa Randa.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PageHero
          title={{
            es: "Qué hacer en Panamá",
            en: "What to do in Panama",
          }}
          intro={{
            es: "Una selección honesta de lugares, sabores y experiencias que sí recomendamos, con distancia, precio y horario reales desde la casa.",
            en: "An honest selection of places, flavors and experiences we genuinely recommend, with real distance, pricing and hours from the house.",
          }}
        />
        <GuideList />
      </main>
      <SiteFooter />
    </>
  );
}
