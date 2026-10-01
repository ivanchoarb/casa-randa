"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { VS } from "@casa-randa/data";
import { MIN_NIGHTS, RATE, computeQuote, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useBooking } from "@/lib/booking/BookingProvider";
import { PaxSelect } from "@/components/ui/PaxSelect";
import { openDatePickerOnClick, openDatePickerOnKey, tryOpenPicker } from "@/lib/dom/openDatePicker";
import { MagneticLink } from "@/components/ui/MagneticLink";
import { Reveal } from "@/components/ui/Reveal";

const fieldLabel = "font-[family-name:var(--font-display)] text-xs tracking-wide text-[var(--ink-2)]";
const fieldInput =
  "rounded-[1px] border border-[var(--ink)]/25 bg-[var(--ground)] px-3 py-2 font-[family-name:var(--font-display)] text-sm text-[var(--ink)] transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--caoba)] focus:ring-2 focus:ring-[var(--caoba)]/20";

export function QuoteCalculator() {
  const { lang, t, money } = useLanguage();
  const { checkIn, checkOut, pax, cancellation, plan, setCheckIn, setCheckOut, setPax, setCancellation, setPlan } =
    useBooking();
  const salidaRef = useRef<HTMLInputElement>(null);

  // Al elegir Entrada, Salida ya se corrió sola (ver BookingProvider) —
  // solo falta abrir su calendario, una vez React pinte el nuevo valor.
  function onEntradaChange(value: string) {
    setCheckIn(value);
    requestAnimationFrame(() => tryOpenPicker(salidaRef.current));
  }

  // 2026-09-30: revertido temporalmente a la tarifa fija RATE — el cambio
  // a tarifa real de PriceLabs (import de "@/lib/tarifaDirecta" y el campo
  // `rate` en computeQuote) quedó commiteado en main sin el archivo
  // tarifaDirecta.ts ni el campo `rate` de QuoteInput, rompiendo el build
  // de producción. Esa feature sigue en curso sin terminar de commitear
  // (ver docs/coordinacion-agentes.md); cuando esté completa y compile,
  // se puede reintroducir aquí.
  // Código de descuento: el porcentaje lo valida /api/codigo contra la base
  // de datos (no se confía en nada que calcule el navegador), y
  // /api/solicitudes lo vuelve a validar al enviar.
  const [codigoTexto, setCodigoTexto] = useState("");
  const [descuento, setDescuento] = useState<{ codigo: string; pct: number } | null>(null);
  const [codigoError, setCodigoError] = useState(false);
  async function aplicarCodigo(texto = codigoTexto) {
    const codigo = texto.trim();
    if (!codigo) return;
    setCodigoError(false);
    try {
      const res = await fetch(`/api/codigo?codigo=${encodeURIComponent(codigo)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setDescuento({ codigo: data.codigo, pct: data.pct });
        setCodigoTexto(data.codigo);
      } else {
        setDescuento(null);
        setCodigoError(true);
      }
    } catch {
      setDescuento(null);
      setCodigoError(true);
    }
  }
  // /regreso enlaza con ?codigo=... para que el descuento llegue ya aplicado.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("codigo");
    if (c) {
      setCodigoTexto(c);
      void aplicarCodigo(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quote = computeQuote({ checkIn, checkOut, pax, cancellation, plan, discountPct: descuento ? descuento.pct / 100 : 0 });

  // 2026-09-14, hallazgo de auditoría manual de Iván: nada revisaba
  // disponibilidad antes de guardar una solicitud — se pudo mandar una
  // solicitud para fechas que ya tenían una reserva confirmada encima
  // (probado en vivo contra la reserva real de "Sobi Sun"). Se revisa en
  // vivo cada vez que cambian las fechas, contra /api/disponibilidad
  // (bloqueos_calendario + reservas confirmada/completada, mismo criterio
  // que la vista reservas_fechas_ocupadas de la intranet) — y otra vez
  // server-side al enviar en /api/solicitudes, que es la que de verdad
  // importa: esta solo es para avisar antes de que la persona llene el
  // formulario completo.
  const [conflictos, setConflictos] = useState<{ inicio: string; fin: string }[] | null>(null);
  const hayEstadia = !!quote;
  useEffect(() => {
    if (!hayEstadia) return;
    let cancelado = false;
    fetch(`/api/disponibilidad?entrada=${checkIn}&salida=${checkOut}`)
      .then((r) => (r.ok ? r.json() : { conflictos: [] }))
      .then((data) => {
        if (!cancelado) setConflictos(data.conflictos ?? []);
      })
      .catch(() => {
        if (!cancelado) setConflictos(null);
      });
    return () => {
      cancelado = true;
    };
  }, [checkIn, checkOut, hayEstadia]);
  const ocupado = hayEstadia && !!conflictos && conflictos.length > 0;

  // Flujo 1 (docs/logica-negocio-y-flujos.md): "Solicitar estas fechas"
  // crea una fila en `solicitudes`, no una Reserva todavía — eso pasa
  // recién cuando el administrador aprueba y se confirma el pago, algo
  // que esta pantalla no hace. La tabla y sus políticas RLS ya existían
  // (supabase/migrations/0002_reservas.sql, 0006_rls.sql) — el insert
  // público solo necesita la anon key, sin ruta de servidor, porque la
  // policy "publico_crea_solicitud" ya restringe a insert-only.
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("");
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
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono,
          pais,
          entrada: checkIn,
          salida: checkOut,
          huespedes: pax,
          plan_tarifa: cancellation,
          plan_pago: plan,
          codigo_descuento: descuento?.codigo,
          consentimiento,
          consentimiento_politica: consentimientoPolitica,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      setEnviado(true);
    } catch (err) {
      setErrorEnvio(
        err instanceof Error && err.message
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
          <h2 className="text-fluid-h2 font-[family-name:var(--font-display)] font-bold">
            {lang === "es" ? "Resérvela aquí, directamente sin intermediarios" : "Book it here, not through a platform"}
          </h2>
          <p className="text-[var(--ink-2)]">
            {lang === "es"
              ? "El mismo calendario de Airbnb y Vrbo, la misma casa, los mismos anfitriones. Reservar directo es lo que permite sostener la tarifa sin la comisión de la plataforma, partir el pago y responderle nosotros mismos."
              : "Same calendar as Airbnb and Vrbo, same house, same hosts. Booking direct is what lets us hold a rate without the platform's cut, split the payment, and answer you ourselves."}
          </p>
        </Reveal>

        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-14">
          <Reveal delayMs={100}>
            {/* Solo lo que hace falta para cotizar, como en Airbnb/Booking:
                fechas + huéspedes. Cancelación y plan de pago se mudaron al
                lado de "Su cotización" — son ajustes al precio, no criterios
                de búsqueda, y así se ven junto al total que cambian. */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="q-in" className={fieldLabel}>
                  {lang === "es" ? "Entrada" : "Check-in"}
                </label>
                <input
                  id="q-in"
                  type="date"
                  value={checkIn}
                  onChange={(e) => onEntradaChange(e.target.value)}
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
                  ref={salidaRef}
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
            </div>

            {/* La comparación con Airbnb/Vrbo es contenido de venta, no
                parte del flujo de reserva — antes competía visualmente con
                el formulario. Ahora es un detalle plegado, cerrado por
                defecto, con el propio <details> nativo del navegador. */}
            <details className="mt-9 border-t border-[var(--ink)]/10 pt-5 text-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer font-[family-name:var(--font-display)] font-semibold text-[var(--caoba)] select-none">
                {lang === "es" ? "¿Por qué reservar directo? →" : "Why book direct? →"}
              </summary>
              <table className="mt-5 w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--ink)]/60">
                    <th scope="col" className="py-2 font-normal" />
                    <th
                      scope="col"
                      className="w-20 py-2 font-[family-name:var(--font-display)] font-medium whitespace-nowrap sm:w-24"
                    >
                      {lang === "es" ? "Directo" : "Direct"}
                    </th>
                    <th
                      scope="col"
                      className="w-20 py-2 font-[family-name:var(--font-display)] font-medium whitespace-nowrap sm:w-24"
                    >
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
                      <td className="py-3 pr-4 font-[family-name:var(--font-display)] font-semibold text-[var(--caoba)]">
                        {lang === "es" ? "Sí" : "Yes"}
                      </td>
                      <td className="py-3 text-[var(--ink-2)]">
                        {row.d === "both" ? (lang === "es" ? "Sí" : "Yes") : lang === "es" ? "No" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </Reveal>

          <Reveal
            scale
            delayMs={150}
            className="border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-6 py-6 text-[var(--on-dark)] shadow-[0_18px_40px_-28px_rgba(20,33,26,0.55)]"
          >
          <aside>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--on-dark)]">
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

                {/* Cancelación y pago viven aquí, no arriba con las fechas
                    — son ajustes al precio, así que se ven junto al total
                    que mueven, en vez de ser dos campos más en el
                    formulario inicial. */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="q-cancel" className="font-[family-name:var(--font-display)] text-xs text-[var(--on-dark-2)]">
                      {lang === "es" ? "Cancelación" : "Cancellation"}
                    </label>
                    <select
                      id="q-cancel"
                      value={cancellation}
                      onChange={(e) => setCancellation(e.target.value as CancellationPolicy)}
                      className={`${fieldInput} text-xs`}
                    >
                      <option value="flex">{lang === "es" ? "Flexible, +3 %" : "Flexible, +3%"}</option>
                      <option value="nr">{lang === "es" ? "No reembolsable, −5 %" : "Non-refundable, −5%"}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="q-plan" className="font-[family-name:var(--font-display)] text-xs text-[var(--on-dark-2)]">
                      {lang === "es" ? "Pago" : "Payment"}
                    </label>
                    <select
                      id="q-plan"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as PaymentPlan)}
                      className={`${fieldInput} text-xs`}
                    >
                      <option value="30">{lang === "es" ? "30 % ahora" : "30% now"}</option>
                      <option value="100">{lang === "es" ? "100 % ahora" : "100% now"}</option>
                    </select>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
                  {quote.lines.map((line, i) => (
                    <div key={i} className="contents">
                      <dt className="text-[var(--on-dark-2)]">{t(line.label)}</dt>
                      <dd className="m-0 text-right font-[family-name:var(--font-display)] tabular-nums">
                        {line.amountUsd < 0 ? "−" : ""}
                        {money(Math.abs(line.amountUsd))}
                      </dd>
                    </div>
                  ))}
                  <div className="col-span-2 my-1 h-px bg-[var(--on-dark-2)]/30" />
                  <dt className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--lamp-fill)]">
                    {lang === "es" ? "Total" : "Total"}
                  </dt>
                  <dd className="m-0 text-right font-[family-name:var(--font-display)] text-xl font-bold tabular-nums text-[var(--lamp-fill)]">
                    {money(quote.totalUsd)}
                  </dd>
                  <dt className="text-[var(--on-dark-2)]">
                    {plan === "30" ? (lang === "es" ? "Paga hoy, 30 %" : "Pay today, 30%") : lang === "es" ? "Paga hoy" : "Pay today"}
                  </dt>
                  <dd className="m-0 text-right font-[family-name:var(--font-display)] tabular-nums">{money(quote.dueTodayUsd)}</dd>
                </dl>

                <div className="mt-4 flex flex-col gap-1">
                  <label htmlFor="q-codigo" className={fieldLabel}>
                    {lang === "es" ? "Código de descuento" : "Discount code"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="q-codigo"
                      value={codigoTexto}
                      onChange={(e) => setCodigoTexto(e.target.value)}
                      className={`${fieldInput} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => void aplicarCodigo()}
                      className="rounded-lg border border-[var(--on-dark-2)]/50 px-4 text-sm font-semibold text-[var(--on-dark)] hover:bg-[var(--on-dark)]/10"
                    >
                      {lang === "es" ? "Aplicar" : "Apply"}
                    </button>
                  </div>
                  {descuento && (
                    <p className="text-xs text-[var(--lamp-fill)]">
                      {lang === "es" ? `Código aplicado: −${descuento.pct} %` : `Code applied: −${descuento.pct}%`}
                    </p>
                  )}
                  {codigoError && (
                    <p className="text-xs text-[var(--caoba)]">
                      {lang === "es" ? "Ese código no es válido o ya venció." : "That code isn't valid or has expired."}
                    </p>
                  )}
                </div>

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
            ) : ocupado ? (
              <p className="mt-5 rounded-[1px] border border-[var(--caoba)]/40 bg-[var(--caoba)]/10 px-4 py-3 text-sm text-[var(--on-dark)]">
                {lang === "es"
                  ? "Esas fechas ya no están disponibles — parte de su estadía se cruza con una reserva existente. Elija otras fechas."
                  : "Those dates aren't available anymore — part of the stay overlaps an existing booking. Pick different dates."}
              </p>
            ) : mostrarFormulario ? (
              <form onSubmit={enviarSolicitud} className="mt-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="q-nombre" className={fieldLabel}>
                      {lang === "es" ? "Nombre" : "First name"}
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
                    <label htmlFor="q-apellido" className={fieldLabel}>
                      {lang === "es" ? "Apellido" : "Last name"}
                    </label>
                    <input
                      id="q-apellido"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
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
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="flex flex-col gap-1">
                    <label htmlFor="q-pais" className={fieldLabel}>
                      {lang === "es" ? "País" : "Country"}
                    </label>
                    <input
                      id="q-pais"
                      required
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
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
                  className="mt-1 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)] disabled:opacity-60"
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
                className={`mt-5 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[family-name:var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)] ${!quote ? "pointer-events-none opacity-50" : ""}`}
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
