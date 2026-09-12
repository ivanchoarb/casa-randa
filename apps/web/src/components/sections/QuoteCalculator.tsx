"use client";

import { useState, type FormEvent } from "react";
import { VS } from "@casa-randa/data";
import { MIN_NIGHTS, RATE, computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useBooking } from "@/lib/booking/BookingProvider";
import { PaxSelect } from "@/components/ui/PaxSelect";
import { openDatePickerOnClick, openDatePickerOnKey } from "@/lib/dom/openDatePicker";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { Reveal } from "@/components/ui/Reveal";
import { supabaseClient } from "@/lib/supabase-client";

const fieldLabel = "font-[var(--font-display)] text-xs tracking-wide text-[var(--ink-2)]";
const fieldInput =
  "rounded-[1px] border border-[var(--ink)]/25 bg-[var(--ground)] px-3 py-2 font-[var(--font-display)] text-sm text-[var(--ink)] transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--caoba)] focus:ring-2 focus:ring-[var(--caoba)]/20";

export function QuoteCalculator() {
  const { lang, t, money } = useLanguage();
  const { checkIn, checkOut, pax, cancellation, plan, setCheckIn, setCheckOut, setPax, setCancellation, setPlan } =
    useBooking();

  const quote = computeQuote({ checkIn, checkOut, pax, cancellation, plan });

  // Flujo 1 (docs/logica-negocio-y-flujos.md): "Solicitar estas fechas"
  // crea una fila en `solicitudes`, no una Reserva todavía — eso pasa
  // recién cuando el administrador aprueba y se confirma el pago, algo
  // que esta pantalla no hace. La tabla y sus políticas RLS ya existían
  // (supabase/migrations/0002_reservas.sql, 0006_rls.sql) — el insert
  // público solo necesita la anon key, sin ruta de servidor, porque la
  // policy "publico_crea_solicitud" ya restringe a insert-only.
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [consentimientoPolitica, setConsentimientoPolitica] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  async function enviarSolicitud(e: FormEvent) {
    e.preventDefault();
    setErrorEnvio(null);
    setEnviando(true);
    try {
      const { error } = await supabaseClient.from("solicitudes").insert({
        nombre,
        email,
        telefono: telefono.trim() || null,
        entrada: checkIn,
        salida: checkOut,
        huespedes: pax,
        plan_tarifa: cancellation,
        plan_pago: plan,
        consentimiento,
        consentimiento_politica: consentimientoPolitica,
      });
      if (error) throw error;
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(
        err instanceof Error
          ? err.message
          : lang === "es"
            ? "No se pudo enviar la solicitud. Intente de nuevo o escríbanos directamente."
            : "Couldn't send the request. Try again or email us directly.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border-y border-[var(--ink)]/10 bg-[var(--panel)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="grid gap-5 sm:grid-cols-2 sm:items-end">
          <h2 className="text-fluid-h2 font-[var(--font-display)] font-bold">
            {lang === "es" ? "Resérvela aquí, no por una plataforma" : "Book it here, not through a platform"}
          </h2>
          <p className="text-[var(--ink-2)]">
            {lang === "es"
              ? "El mismo calendario de Airbnb y Vrbo, la misma casa, los mismos anfitriones. Reservar directo es lo que permite sostener la tarifa sin la comisión de la plataforma, partir el pago y responderle nosotros mismos."
              : "Same calendar as Airbnb and Vrbo, same house, same hosts. Booking direct is what lets us hold a rate without the platform's cut, split the payment, and answer you ourselves."}
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-14">
          <Reveal delayMs={100}>
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
                  <tr
                    key={row.es}
                    className="border-b border-[var(--ink)]/10 transition-colors duration-200 hover:bg-[var(--caoba)]/5"
                  >
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
          </Reveal>

          <Reveal
            scale
            delayMs={150}
            className="border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-6 text-[var(--on-dark)] shadow-[0_18px_40px_-28px_rgba(20,33,26,0.55)]"
          >
          <aside>
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

            {enviado ? (
              <p className="mt-5 rounded-[1px] border border-[var(--lamp-fill)]/40 bg-[var(--lamp-fill)]/10 px-4 py-3 text-sm text-[var(--on-dark)]">
                {lang === "es"
                  ? "Recibimos su solicitud. Le responderemos desde booking@randahome.com en las próximas horas."
                  : "We received your request. We'll reply from booking@randahome.com within a few hours."}
              </p>
            ) : mostrarFormulario ? (
              <form onSubmit={enviarSolicitud} className="mt-5 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="q-nombre" className={fieldLabel}>
                    {lang === "es" ? "Nombre" : "Name"}
                  </label>
                  <input
                    id="q-nombre"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="q-email" className={fieldLabel}>
                    Email
                  </label>
                  <input
                    id="q-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="q-telefono" className={fieldLabel}>
                    {lang === "es" ? "Teléfono (opcional)" : "Phone (optional)"}
                  </label>
                  <input
                    id="q-telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className={fieldInput}
                  />
                </div>

                <label className="mt-1 flex items-start gap-2 text-xs text-[var(--on-dark-2)]">
                  <input
                    type="checkbox"
                    required
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="mt-0.5"
                  />
                  {lang === "es"
                    ? "Autorizo a Casa Randa a contactarme sobre esta solicitud."
                    : "I allow Casa Randa to contact me about this request."}
                </label>
                <label className="flex items-start gap-2 text-xs text-[var(--on-dark-2)]">
                  <input
                    type="checkbox"
                    required
                    checked={consentimientoPolitica}
                    onChange={(e) => setConsentimientoPolitica(e.target.checked)}
                    className="mt-0.5"
                  />
                  {lang === "es"
                    ? "Entiendo que esto es una solicitud, no una reserva confirmada — se confirma por escrito antes de cobrar."
                    : "I understand this is a request, not a confirmed booking — it's confirmed in writing before anything is charged."}
                </label>

                {errorEnvio && <p className="text-xs text-[var(--caoba)]">{errorEnvio}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86] disabled:opacity-60"
                >
                  {enviando
                    ? lang === "es"
                      ? "Enviando…"
                      : "Sending…"
                    : lang === "es"
                      ? "Enviar solicitud"
                      : "Send request"}
                </button>
              </form>
            ) : (
              <MagneticLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMostrarFormulario(true);
                }}
                aria-disabled={!quote}
                className={`mt-5 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[#f0ce86] ${!quote ? "pointer-events-none opacity-50" : ""}`}
              >
                {lang === "es" ? "Solicitar estas fechas" : "Request these dates"}
              </MagneticLink>
            )}
          </aside>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
