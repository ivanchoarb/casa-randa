"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useBooking } from "@/lib/booking/BookingProvider";
import { PaxSelect } from "@/components/ui/PaxSelect";
import { openDatePickerOnClick, openDatePickerOnKey } from "@/lib/dom/openDatePicker";

const fieldLabel = "font-[var(--font-display)] text-xs tracking-wide text-[var(--on-dark-2)]";
const fieldInput =
  "rounded-[1px] border border-[var(--on-dark-2)]/40 bg-[var(--on-dark)]/[0.06] px-3 py-2 font-[var(--font-display)] text-sm text-[var(--on-dark)] [color-scheme:dark]";

export function AvailabilityBar() {
  const { lang } = useLanguage();
  const { checkIn, checkOut, pax, setCheckIn, setCheckOut, setPax } = useBooking();

  return (
    <div className="border-t border-[var(--on-dark-2)]/25 bg-[var(--night-2)] text-[var(--on-dark)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-4 px-6 py-4">
        <div className="flex min-w-[150px] flex-1 flex-col gap-1">
          <label htmlFor="in" className={fieldLabel}>
            {lang === "es" ? "Entrada" : "Check-in"}
          </label>
          <input
            id="in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            onClick={openDatePickerOnClick}
            onKeyDown={openDatePickerOnKey}
            className={`${fieldInput} cursor-pointer`}
          />
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-1">
          <label htmlFor="out" className={fieldLabel}>
            {lang === "es" ? "Salida" : "Check-out"}
          </label>
          <input
            id="out"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            onClick={openDatePickerOnClick}
            onKeyDown={openDatePickerOnKey}
            className={`${fieldInput} cursor-pointer`}
          />
        </div>
        <div className="flex min-w-[150px] flex-1 flex-col gap-1">
          <label htmlFor="pax" className={fieldLabel}>
            {lang === "es" ? "Huéspedes" : "Guests"}
          </label>
          <PaxSelect id="pax" value={pax} onChange={setPax} className={fieldInput} />
        </div>
        <a
          href="#reservar"
          className="inline-flex items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] hover:bg-[#f0ce86]"
        >
          {lang === "es" ? "Ver cuánto cuesta" : "See what it costs"}
        </a>
      </div>
    </div>
  );
}
