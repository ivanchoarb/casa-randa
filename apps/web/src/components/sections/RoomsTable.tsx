"use client";

import { ROOMS } from "@casa-randa/data";
import type { Room } from "@casa-randa/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function bedsLabel(room: Room, lang: "es" | "en") {
  return room.beds
    .map(([type, count]) => {
      const one = type === "king" ? (lang === "es" ? "cama king" : "king bed") : lang === "es" ? "individual" : "single";
      const many = type === "king" ? one : lang === "es" ? "individuales" : "singles";
      return `${count} ${count > 1 ? many : one}`;
    })
    .join(", ");
}

export function RoomsTable() {
  const { lang, t } = useLanguage();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="mb-3 text-left text-sm text-[var(--ink-2)]">
          {lang === "es"
            ? "Camas por habitación. Cómoda para 14; el 15 y el 16 duermen en camas adicionales, con cargo de 40 USD por huésped y noche."
            : "Beds by room. Comfortable for 14; 15 and 16 sleep on extra beds at $40 per guest per night."}
        </caption>
        <thead>
          <tr className="border-b border-[var(--ink)]/15 text-sm uppercase tracking-wide">
            <th scope="col" className="py-2 pr-4 font-[var(--font-display)] font-medium">
              {lang === "es" ? "Habitación" : "Room"}
            </th>
            <th scope="col" className="py-2 pr-4 font-[var(--font-display)] font-medium">
              {lang === "es" ? "Camas" : "Beds"}
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-[var(--font-display)] font-medium">
              {lang === "es" ? "Duerme" : "Sleeps"}
            </th>
            <th scope="col" className="py-2 font-[var(--font-display)] font-medium">
              {lang === "es" ? "Baño" : "Bathroom"}
            </th>
          </tr>
        </thead>
        <tbody>
          {ROOMS.map((room) => (
            <tr
              key={room.n}
              className="group border-b border-[var(--ink)]/10 align-top transition-colors duration-200 hover:bg-[var(--caoba)]/5"
            >
              <th
                scope="row"
                className="py-3 pr-4 font-[var(--font-display)] font-semibold transition-colors duration-200 group-hover:text-[var(--caoba)]"
              >
                {room.n}
              </th>
              <td className="py-3 pr-4">
                {bedsLabel(room, lang)}
                <span className="mt-1 block text-sm text-[var(--ink-2)]">{t(room)}</span>
              </td>
              <td className="py-3 pr-4 text-right">{room.sleeps}</td>
              <td className="py-3">{lang === "es" ? "Privado" : "Private"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
