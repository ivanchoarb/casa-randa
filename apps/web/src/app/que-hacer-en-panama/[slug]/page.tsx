import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { obtenerLugar, obtenerLugares } from "@/lib/guia";
import { PlaceDetail } from "./PlaceDetail";

// Los lugares existentes se generan en el build; uno nuevo agregado desde la
// intranet se genera en su primera visita y luego se cachea (ISR, 5 min),
// sin necesitar un deploy.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await obtenerLugares()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await obtenerLugar(slug);
  if (!place) return {};
  return {
    title: place.name,
    description: place.teaser.es,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await obtenerLugar(slug);
  if (!place) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <PlaceDetail place={place} />
      </main>
      <SiteFooter />
    </>
  );
}
