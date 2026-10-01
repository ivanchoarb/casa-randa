"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/ui/Reveal";

const CODIGO = "COMINGBACKRANDA5%";

const PASOS = [
  {
    es: ["Elija sus fechas", "Use el cotizador de la página principal. El botón de arriba ya le lleva con el código puesto."],
    en: ["Pick your dates", "Use the quote calculator on the homepage. The button above takes you there with the code already applied."],
  },
  {
    es: ["Solicite la reserva", "Envíe la solicitud con sus datos. Responde directamente el equipo de Casa Randa."],
    en: ["Request the booking", "Send the request with your details. The Casa Randa team answers you directly."],
  },
  {
    es: ["Vea su descuento", "El 5% se aplica al instante en la cotización. Si lo prefiere, escriba el código en el campo \"Código de descuento\"."],
    en: ["See your discount", "The 5% is applied instantly in the quote. You can also type the code in the \"Discount code\" field."],
  },
] as const;

export function RegresoContent() {
  const { lang } = useLanguage();
  const [copiado, setCopiado] = useState(false);
  const es = lang === "es";
  const codigoUrl = encodeURIComponent(CODIGO);
  const reservar = es ? `/?codigo=${codigoUrl}#reservar` : `/en?codigo=${codigoUrl}#reservar`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(CODIGO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles el código sigue visible para copiarlo a mano.
    }
  }

  const boton =
    "inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--caoba)] px-7 py-3 font-[family-name:var(--font-display)] font-bold text-white transition-opacity hover:opacity-90";

  return (
    <>
      {/* Hero: la foto va limpia arriba y el texto en una tarjeta debajo, sin pelear con la imagen. */}
      <section className="bg-[var(--ground)]">
        <div className="relative h-[42vh] min-h-64 sm:h-[56vh]">
          <Image
            src="/images/fachada-diablo-heights.jpg"
            alt={es ? "Fachada verde de Casa Randa en Diablo Heights" : "Green façade of Casa Randa in Diablo Heights"}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto -mt-16 max-w-5xl px-4 pb-16 sm:-mt-24 sm:px-6">
          <Reveal>
            <div className="grid gap-8 rounded-xl bg-[var(--night)] p-6 text-[var(--on-dark)] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)] sm:p-10 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-sm text-[var(--lamp-fill)]">
                  {es ? "Para huéspedes que ya nos conocen" : "For guests who already know us"}
                </p>
                <h1 className="text-fluid-h2 mt-3 font-[family-name:var(--font-display)] font-bold">
                  {es ? "Volver a Casa Randa cuesta 5% menos." : "Coming back to Casa Randa costs 5% less."}
                </h1>
              </div>
              <div>
                <p className="text-lg text-[var(--on-dark-2)]">
                  {es
                    ? "Ya abrimos randahome.com. Reserve directo con nosotros, sin intermediarios ni comisiones de plataforma."
                    : "We just launched randahome.com. Book directly with us, with no middlemen and no platform fees."}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <a href={reservar} className={boton}>
                    {es ? "Ver fechas y reservar" : "See dates and book"}
                  </a>
                  <p className="text-sm text-[var(--on-dark-2)]">
                    ★ 4.89 · {es ? "Favorito entre huéspedes en Airbnb" : "Airbnb Guest Favorite"}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Código */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Reveal>
          <p className="text-xs tracking-[0.2em] text-[var(--ink-2)]">{es ? "SU CÓDIGO DE REGRESO" : "YOUR COMEBACK CODE"}</p>
          <p className="mt-3 font-mono text-3xl font-bold break-all text-[var(--caoba)] sm:text-4xl">{CODIGO}</p>
          <button
            type="button"
            onClick={copiar}
            className="mt-5 min-h-12 rounded-lg border border-[var(--caoba)] px-6 py-3 font-[family-name:var(--font-display)] font-bold text-[var(--caoba)] transition-colors hover:bg-[var(--caoba)] hover:text-white"
          >
            {copiado ? (es ? "¡Copiado!" : "Copied!") : es ? "Copiar código" : "Copy code"}
          </button>
          <p className="mt-4 text-sm text-[var(--ink-2)]">
            {es ? "5% de descuento en su próxima reserva directa." : "5% off your next direct booking."}
          </p>
        </Reveal>
      </section>

      {/* Reseña */}
      <section className="bg-[var(--panel)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <blockquote className="border-l-4 border-[var(--lamp-fill)] pl-6">
              <p className="font-serif text-xl italic leading-relaxed">
                {es
                  ? "“Desde el momento en que llegué, me sentí cómodo y bienvenido. El alojamiento estaba limpio, era cómodo y me sentí como en casa. Sin duda me hospedaría aquí de nuevo.”"
                  : "“From the moment I arrived, I felt comfortable and welcome. The place was clean, comfortable, and I felt at home. I would definitely stay here again.”"}
              </p>
              <footer className="mt-4 text-sm text-[var(--ink-2)]">
                Nestor · Waldwick, {es ? "Nueva Jersey" : "New Jersey"} · {es ? "Reseña en Airbnb, 5 estrellas" : "Airbnb review, 5 stars"}
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Foto de la habitación */}
      <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
        <Reveal>
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] sm:aspect-[16/9]">
            <Image
              src="/images/habitacion-cama-king.jpg"
              alt={es ? "Habitación de Casa Randa con cama king, lámparas de mesa y piso de madera" : "Casa Randa bedroom with a king bed, table lamps and wood floors"}
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* Cómo funciona: lista editorial con filas separadas, no tres columnas de número grande. */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <Reveal>
          <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {es ? "Cómo usar su descuento" : "How to use your discount"}
              </h2>
              <p className="mt-3 max-w-xs text-[var(--ink-2)]">
                {es ? "Sin formularios extra ni cuentas nuevas." : "No extra forms, no new accounts."}
              </p>
            </div>
            <ol className="border-t border-[var(--ink)]/15">
              {PASOS.map((p, i) => (
                <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-[var(--ink)]/15 py-6 sm:grid-cols-[3rem_12rem_1fr]">
                  <span className="pt-0.5 font-mono text-sm text-[var(--caoba)]">0{i + 1}</span>
                  <h3 className="font-[family-name:var(--font-display)] font-bold">{p[lang][0]}</h3>
                  <p className="col-start-2 mt-1 text-[var(--ink-2)] sm:col-start-3 sm:mt-0">{p[lang][1]}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Cierre */}
      <section className="bg-[var(--night)] text-center text-[var(--on-dark)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {es ? "Las mismas 6 habitaciones y el mismo patio, esperándole." : "The same 6 bedrooms and the same patio, waiting for you."}
          </h2>
          <a href={reservar} className={`${boton} mt-8`}>
            {es ? "Ver fechas y reservar" : "See dates and book"}
          </a>
        </div>
      </section>
    </>
  );
}
