import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { PLACES } from "../places";
import { PlaceDetail } from "./PlaceDetail";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = PLACES.find((p) => p.slug === slug);
  if (!place) return {};
  return {
    title: place.name,
    description: place.teaser.es,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = PLACES.find((p) => p.slug === slug);
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
