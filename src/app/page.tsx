import { JsonLd } from "@/components/JsonLd";
import { LangToggle } from "@/components/ui/LangToggle";
import { Hero } from "@/components/sections/Hero";
import { RoomsTable } from "@/components/sections/RoomsTable";

export default function Home() {
  return (
    <>
      <JsonLd />

      <header className="border-b border-[var(--ink)]/10 bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-[var(--font-display)] text-sm font-semibold tracking-wide">
            CASA RANDA <span className="text-[var(--ink-2)]">PANAMÁ</span>
          </span>
          <LangToggle />
        </div>
      </header>

      <main className="flex-1">
        <Hero />

        <section id="casa" className="mx-auto max-w-6xl px-6 py-20">
          <RoomsTable />
        </section>

        {/*
          TODO: remaining sections (reserva directa / cotizador, barrio,
          reseñas, extras, footer) — see legacy-static/index.html for the
          original content and CLAUDE.md for the porting notes. Hero and
          RoomsTable above fix the component + data pattern to follow for
          the rest.
        */}
      </main>
    </>
  );
}
