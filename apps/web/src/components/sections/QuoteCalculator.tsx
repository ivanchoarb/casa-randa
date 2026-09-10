"use client";

import { VS } from "@casa-randa/data";
import { MIN_NIGHTS, RATE, computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useBooking } from "@/lib/booking/BookingProvider";
import { PaxSelect } from "@/components/ui/PaxSelect";
import { openDatePickerOnClick, openDatePickerOnKey } from "@/lib/dom/openDatePicker";

const fieldLabel = "font-[var(--font-display)] text-xs tracking-wide text-[var(--ink-2)]";
const fieldInput =
  "rounded-[1px] border border-[var(--ink)]/25 bg-[var(--ground)] px-3 py-2 font-[var(--font-display)] text-sm text-[var(--ink)]";

export function QuoteCalculator() {
  const { lang, t, money } = useLanguage();
  const { checkIn, checkOut, pax, cancellation, plan, setCheckIn, setCheckOut, setPax, setCancellation, setPlan } =
    useBooking();

  const quote = computeQuote({ checkIn, checkOut, pax, cancellation, plan });

  return (
    <div className="border-y border-[var(--ink)]/10 bg-[var(--panel)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <h2 className="font-[var(--font-display)] text-3xl font-bold sm:text-4xl">
            {lang === "es" ? "Resérvela aquí, no por una plataforma" : "Book it here, not through a platform"}
          </h2>
          <p className="text-[var(--ink-2)]">
            {lang === "es"
              ? "El mismo calendario de Airbnb y Vrbo, la misma casa, los mismos anfitriones. Reservar directo es lo que permite sostener la tarifa sin la comisión de la plataforma, partir el pago y responderle nosotros mismos."
              : "Same calendar as Airbnb and Vrbo, same house, same hosts. Booking direct is what lets us hold a rate without the platform's cut, split the payment, and answer you ourselves."}
          </p>
        </div>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-14">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="q-in" className={fieldLabel}>
                  {lang === "es" ? "Entrada" : "Check-in"}
                </label>
                <input
                  id="q-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  onClick={openDatePickerOnClick}
                  onKeyDown={openDatePickerOnKey}
                  className={`${fieldInput} cursor-pointer`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="q-out" className={fieldLabel}>
                  {lang === "es" ? "Salida" : "Check-out"}
                </label>
                <input
                  id="q-out"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  onClick={openDatePickerOnClick}
                  onKeyDown={openDatePickerOnKey}
                  className={`${fieldInput} cursor-pointer`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="q-pax" className={fieldLabel}>
                  {lang === "es" ? "Huéspedes" : "Guests"}
                </label>
                <PaxSelect id="q-pax" value={pax} onChange={setPax} className={fieldInput} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="q-cancel" className={fieldLabel}>
                  {lang === "es" ? "Cancelación" : "Cancellation"}
                </label>
                <select
                  id="q-cancel"
                  value={cancellation}
                  onChange={(e) => setCancellation(e.target.value as CancellationPolicy)}
                  className={fieldInput}
                >
                  <option value="flex">{lang === "es" ? "Flexible, +3 %" : "Flexible, +3%"}</option>
                  <option value="nr">{lang === "es" ? "No reembolsable, −5 %" : "Non-refundable, −5%"}</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="q-plan" className={fieldLabel}>
                  {lang === "es" ? "Pago" : "Payment"}
                </label>
                <select
                  id="q-plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PaymentPlan)}
                  className={fieldInput}
                >
                  <option value="30">
                    {lang === "es"
                      ? "Anticipo del 30 % ahora, saldo 7 días antes de llegar"
                      : "30% deposit now, balance 7 days before arrival"}
                  </option>
                  <option value="100">{lang === "es" ? "Pagar el 100 % ahora" : "Pay 100% now"}</option>
                </select>
              </div>
            </div>

            <table className="mt-11 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--ink)]/60 text-sm">
                  <th scope="col" className="py-2 font-normal" />
                  <th scope="col" className="py-2 font-[var(--font-display)] font-medium">
                    {lang === "es" ? "Directo" : "Direct"}
                  </th>
                  <th scope="col" className="py-2 font-[var(--font-display)] font-medium">
                    Airbnb / Vrbo
                  </th>
                </tr>
              </thead>
              <tbody>
                {VS.map((row) => (
                  <tr key={row.es} className="border-b border-[var(--ink)]/10">
                    <td className="py-3 pr-4">{t(row)}</td>
                    <td className="py-3 pr-4 font-[var(--font-display)] font-semibold text-[var(--caoba)]">
                      {lang === "es" ? "Sí" : "Yes"}
                    </td>
                    <td className="py-3 text-[var(--ink-2)]">
                      {row.d === "both" ? (lang === "es" ? "Sí" : "Yes") : lang === "es" ? "No" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-6 text-[var(--on-dark)] shadow-[0_18px_40px_-28px_rgba(20,33,26,0.55)]">
            <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--on-dark)]">
              {lang === "es" ? "Su cotización" : "Your quote"}
            </h3>

            {!quote ? (
              <p className="mt-4 text-sm text-[var(--lamp-fill)]">
                {lang === "es"
                  ? `La estancia mínima es de ${MIN_NIGHTS} noches. Ajuste las fechas para ver el total.`
                  : `The minimum stay is ${MIN_NIGHTS} nights. Adjust the dates to see a total.`}
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm text-[var(--on-dark-2)]">
                  {lang === "es"
                    ? `${quote.nights} ${quote.nights === 1 ? "noche" : "noches"}, ${pax} huéspedes, a ${money(RATE)} la noche.`
                    : `${quote.nights} ${quote.nights === 1 ? "night" : "nights"}, ${pax} guests, at ${money(RATE)} a night.`}
                </p>

                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                  {quote.lines.map((line, i) => (
                    <div key={i} className="contents">
                      <dt className="text-[var(--on-dark-2)]">{t(line.label)}</dt>
                      <dd className="m-0 text-right font-[var(--font-display)] tabular-nums">
                        {line.amountUsd < 0 ? "−" : ""}
                        {money(Math.abs(line.amountUsd))}
                      </dd>
                    </div>
                  ))}
                  <div className="col-span-2 my-1 h-px bg-[var(--on-dark-2)]/30" />
                  <dt className="font-[var(--font-display)] text-xl font-bold text-[var(--lamp-fill)]">
                    {lang === "es" ? "Total" : "Total"}
                  </dt>
                  <dd className="m-0 text-right font-[var(--font-display)] text-xl font-bold tabular-nums text-[var(--lamp-fill)]">
                    {money(quote.totalUsd)}
                  </dd>
                  <dt className="text-[var(--on-dark-2)]">
                    {plan === "30" ? (lang === "es" ? "Paga hoy, 30 %" : "Pay today, 30%") : lang === "es" ? "Paga hoy" : "Pay today"}
                  </dt>
                  <dd className="m-0 text-right font-[var(--font-display)] tabular-nums">{money(quote.dueTodayUsd)}</dd>
                </dl>

                <p className="mt-4 text-sm leading-relaxed text-[var(--on-dark-2)]">
                  {lang === "es"
                    ? "Tarifa de ejemplo. La tarifa de sus fechas la calcula el motor de precios y se confirma por escrito antes de cobrar nada."
                    : "Example rate. The rate for your dates comes from the pricing engine and is confirmed in writing before anything is charged."}
                </p>
              </>
            )}

            <a
              href="#"
              className="mt-5 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] hover:bg-[#f0ce86]"
            >
              {lang === "es" ? "Solicitar estas fechas" : "Request these dates"}
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
