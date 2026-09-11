import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PageHero } from "@/components/ui/PageHero";
import { GuideSections } from "./GuideSections";

export const metadata: Metadata = {
  title: "Qué hacer en Panamá",
  description:
    "Una guía corta de qué ver cerca de Casa Randa: Casco Viejo, Cerro Ancón, las esclusas de Miraflores, el Biomuseo y la Calzada de Amador.",
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
            es: "Diablo Heights está a minutos del Canal, del Casco Viejo y de la Calzada de Amador. Esto es lo que vale la pena ver sin alejarse mucho de la casa.",
            en: "Diablo Heights sits minutes from the Canal, Casco Viejo, and the Amador Causeway. Here's what's worth seeing without straying far from the house.",
          }}
        />
        <GuideSections />
      </main>
      <SiteFooter />
    </>
  );
}
