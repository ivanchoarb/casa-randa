"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { paisesOrdenados } from "@/lib/paises";

// 2026-09-14: reproduce el mismo patrón de interacción de las capturas de
// referencia (tixu.ai) — fondo blanco, un paso por pantalla, barra de
// progreso, tarjetas/inputs de borde grande — pero con los tokens reales
// de la marca en vez del azul original. Iván, tras verlo funcionando:
// "¿ponemos colores más adecuados a la marca?" — sí. `--ink` es el mismo
// tono que ya usa el resto del sitio para texto sobre fondo claro (ver el
// comentario de tokens en globals.css); `--caoba` es el acento estándar
// del sitio en superficies claras (Neighborhood, precios en Extras.tsx),
// así que reemplaza al azul en la barra de progreso y el botón principal.
const COLOR_TITULO = "var(--ink)";
const COLOR_ACENTO = "var(--caoba)";

const inputClass =
  "w-full rounded-2xl border-2 border-[var(--ink)]/15 bg-white px-5 py-4 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--caoba)]";

type Paso =
  | "idioma"
  | "codigo"
  | "nombre"
  | "pais"
  | "identificacion"
  | "documento"
  | "email"
  | "telefono"
  | "fechas"
  | "terminos"
  | "listo";

const ORDEN: Paso[] = ["idioma", "codigo", "nombre", "pais", "identificacion", "documento", "email", "telefono", "fechas", "terminos"];

export function CheckInWizard() {
  const { lang, setLang } = useLanguage();
  const [paso, setPaso] = useState<Paso>("idioma");

  const [codigo, setCodigo] = useState("");
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [fechas, setFechas] = useState<{ entrada: string; salida: string } | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [paisOrigen, setPaisOrigen] = useState("");
  const [numeroId, setNumeroId] = useState("");
  const [documento, setDocumento] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaRemarketing, setAceptaRemarketing] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const indice = ORDEN.indexOf(paso);
  const total = ORDEN.length;

  function irA(destino: Paso) {
    setPaso(destino);
  }

  function atras() {
    if (indice > 0) setPaso(ORDEN[indice - 1]);
  }

  async function validarCodigo(e: FormEvent) {
    e.preventDefault();
    setErrorCodigo(null);
    setValidandoCodigo(true);
    try {
      const res = await fetch("/api/checkin/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      setFechas({ entrada: data.entrada, salida: data.salida });
      irA("nombre");
    } catch (err) {
      setErrorCodigo(
        err instanceof Error && err.message
          ? err.message
          : lang === "es"
            ? "No se pudo validar el código."
            : "Couldn't validate the code.",
      );
    } finally {
      setValidandoCodigo(false);
    }
  }

  async function enviarRegistro(e: FormEvent) {
    e.preventDefault();
    if (!aceptaTerminos || !aceptaRemarketing) return;
    setErrorEnvio(null);
    setEnviando(true);
    try {
      const form = new FormData();
      form.set("codigo", codigo);
      form.set("nombre", nombre);
      form.set("apellido", apellido);
      form.set("pais_origen", paisOrigen);
      form.set("numero_id", numeroId);
      form.set("email", email);
      form.set("telefono", telefono);
      form.set("acepta_terminos", "true");
      form.set("acepta_remarketing", "true");
      if (documento) form.set("documento", documento);

      const res = await fetch("/api/checkin", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      irA("listo");
    } catch (err) {
      setErrorEnvio(
        err instanceof Error && err.message
          ? err.message
          : lang === "es"
            ? "No se pudo enviar el registro. Intenta de nuevo o escríbenos a booking@randahome.com."
            : "Couldn't submit the registration. Try again or email us at booking@randahome.com.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={atras}
            aria-label={lang === "es" ? "Atrás" : "Back"}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--ink-2)] hover:bg-[var(--ground)] ${indice === 0 || paso === "listo" ? "invisible" : ""}`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className={`rounded-full border border-[var(--ink)]/15 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--ink-2)] ${paso === "idioma" ? "invisible" : ""}`}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <Link
            href="/"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--ink-2)] hover:bg-[var(--ground)]"
          >
            ×
          </Link>
        </div>

        {paso !== "listo" && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ground)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((indice + 1) / total) * 100}%`, backgroundColor: COLOR_ACENTO }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-[var(--ink-2)] tabular-nums">
              {indice + 1}/{total}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center py-10">
          {paso === "idioma" && (
            <div className="flex flex-col gap-5">
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                Choose your language
                <br />
                Elige tu idioma
              </h1>
              <button
                type="button"
                onClick={() => {
                  setLang("es");
                  irA("codigo");
                }}
                className="flex items-center gap-4 rounded-2xl border-2 border-[var(--ink)]/15 bg-white px-5 py-5 text-left transition-colors hover:border-[var(--caoba)]"
              >
                <span className="text-3xl">🇵🇦</span>
                <span className="text-lg font-semibold text-[var(--ink)]">Español</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  irA("codigo");
                }}
                className="flex items-center gap-4 rounded-2xl border-2 border-[var(--ink)]/15 bg-white px-5 py-5 text-left transition-colors hover:border-[var(--caoba)]"
              >
                <span className="text-3xl">🇺🇸</span>
                <span className="text-lg font-semibold text-[var(--ink)]">English</span>
              </button>
            </div>
          )}

          {paso === "codigo" && (
            <form onSubmit={validarCodigo} className="flex flex-col gap-5">
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¿Cuál es tu código de reserva?" : "What's your reservation code?"}
              </h1>
              <p className="text-sm text-[var(--ink-2)]">
                {lang === "es"
                  ? "Si reservó directo con nosotros, el código que le enviamos al confirmar. Si reservó por Airbnb o Vrbo, el código de confirmación de esa plataforma."
                  : "If you booked directly with us, the code we sent when your booking was confirmed. If you booked through Airbnb or Vrbo, that platform's confirmation code."}
              </p>
              <input
                autoFocus
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder={lang === "es" ? "Ej. A1B2C3" : "e.g. A1B2C3"}
                className={`${inputClass} text-center text-2xl font-semibold tracking-[0.3em] uppercase`}
              />
              {errorCodigo && <p className="text-sm text-[var(--caoba)]">{errorCodigo}</p>}
              <BotonContinuar disabled={validandoCodigo} texto={validandoCodigo ? (lang === "es" ? "Validando…" : "Validating…") : undefined} lang={lang} />
            </form>
          )}

          {paso === "nombre" && (
            <PasoForm onSubmit={() => irA("pais")} lang={lang}>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¿Cómo te llamas?" : "What's your name?"}
              </h1>
              <div className="mt-6 flex flex-col gap-3">
                <input
                  autoFocus
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={lang === "es" ? "Nombre" : "First name"}
                  className={inputClass}
                />
                <input
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder={lang === "es" ? "Apellido" : "Last name"}
                  className={inputClass}
                />
              </div>
            </PasoForm>
          )}

          {paso === "pais" && (
            <PasoForm onSubmit={() => irA("identificacion")} lang={lang}>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¿De dónde nos visitas?" : "Where are you visiting from?"}
              </h1>
              <select
                autoFocus
                required
                value={paisOrigen}
                onChange={(e) => setPaisOrigen(e.target.value)}
                className={`${inputClass} mt-6`}
              >
                <option value="" disabled>
                  {lang === "es" ? "Selecciona un país" : "Select a country"}
                </option>
                {paisesOrdenados(lang).map((p) => (
                  <option key={p.es} value={p.es}>
                    {p[lang]}
                  </option>
                ))}
              </select>
            </PasoForm>
          )}

          {paso === "identificacion" && (
            <PasoForm onSubmit={() => irA("documento")} lang={lang} opcional>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "Número de identificación" : "ID number"}
              </h1>
              <p className="mt-2 text-sm text-[var(--ink-2)]">
                {lang === "es" ? "Pasaporte o cédula. Opcional." : "Passport or ID document. Optional."}
              </p>
              <input
                autoFocus
                value={numeroId}
                onChange={(e) => setNumeroId(e.target.value)}
                placeholder={lang === "es" ? "Número de documento" : "Document number"}
                className={`${inputClass} mt-6`}
              />
            </PasoForm>
          )}

          {paso === "documento" && (
            <PasoForm onSubmit={() => irA("email")} lang={lang} opcional>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "Sube una foto de tu identificación" : "Upload a photo of your ID"}
              </h1>
              <p className="mt-2 text-sm text-[var(--ink-2)]">
                {lang === "es" ? "Pasaporte o cédula. Opcional." : "Passport or ID document. Optional."}
              </p>
              <label
                className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--ink)]/20 px-5 py-10 text-center text-sm text-[var(--ink-2)] hover:border-[var(--caoba)]"
              >
                <span className="text-3xl">📎</span>
                {documento ? documento.name : lang === "es" ? "Toca para elegir una foto" : "Tap to choose a photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setDocumento(e.target.files?.[0] ?? null)}
                />
              </label>
            </PasoForm>
          )}

          {paso === "email" && (
            <PasoForm onSubmit={() => irA("telefono")} lang={lang}>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¿Cuál es tu correo?" : "What's your email?"}
              </h1>
              <input
                autoFocus
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`${inputClass} mt-6`}
              />
            </PasoForm>
          )}

          {paso === "telefono" && (
            <PasoForm onSubmit={() => irA("fechas")} lang={lang}>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¿A qué número te contactamos?" : "What number can we reach you at?"}
              </h1>
              <input
                autoFocus
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder={lang === "es" ? "Teléfono" : "Phone number"}
                className={`${inputClass} mt-6`}
              />
            </PasoForm>
          )}

          {paso === "fechas" && (
            <PasoForm onSubmit={() => irA("terminos")} lang={lang}>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "Confirma tus fechas" : "Confirm your dates"}
              </h1>
              <p className="mt-2 text-sm text-[var(--ink-2)]">
                {lang === "es" ? "Esto es lo que tenemos registrado en tu reserva." : "This is what we have on file for your booking."}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <div className="rounded-2xl border-2 border-[var(--ink)]/15 bg-[var(--ground)] px-5 py-4">
                  <p className="text-xs font-semibold tracking-wide text-[var(--ink-2)] uppercase">
                    {lang === "es" ? "Llegada" : "Arrival"}
                  </p>
                  <p className="text-lg font-semibold text-[var(--ink)]">{fechas?.entrada}</p>
                </div>
                <div className="rounded-2xl border-2 border-[var(--ink)]/15 bg-[var(--ground)] px-5 py-4">
                  <p className="text-xs font-semibold tracking-wide text-[var(--ink-2)] uppercase">
                    {lang === "es" ? "Salida" : "Departure"}
                  </p>
                  <p className="text-lg font-semibold text-[var(--ink)]">{fechas?.salida}</p>
                </div>
              </div>
            </PasoForm>
          )}

          {paso === "terminos" && (
            <form onSubmit={enviarRegistro} className="flex flex-col gap-5">
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "Últimos detalles" : "Last thing"}
              </h1>
              <label className="mt-2 flex items-start gap-3 rounded-2xl border-2 border-[var(--ink)]/15 px-5 py-4 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  required
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--caoba)]"
                />
                {lang === "es"
                  ? "Acepto los términos y condiciones de Casa Randa y confirmo que la información anterior es correcta."
                  : "I agree to Casa Randa's terms and conditions and confirm the information above is correct."}
              </label>
              <label className="flex items-start gap-3 rounded-2xl border-2 border-[var(--ink)]/15 px-5 py-4 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  required
                  checked={aceptaRemarketing}
                  onChange={(e) => setAceptaRemarketing(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--caoba)]"
                />
                {lang === "es"
                  ? "Autorizo a Casa Randa a usar mis datos de contacto para remarketing (ofertas y promociones futuras)."
                  : "I authorize Casa Randa to use my contact details for remarketing (future offers and promotions)."}
              </label>
              {errorEnvio && <p className="text-sm text-[var(--caoba)]">{errorEnvio}</p>}
              <BotonContinuar
                disabled={enviando || !aceptaTerminos || !aceptaRemarketing}
                texto={enviando ? (lang === "es" ? "Enviando…" : "Sending…") : lang === "es" ? "Enviar registro" : "Submit registration"}
                lang={lang}
              />
            </form>
          )}

          {paso === "listo" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-5xl">✅</span>
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>
                {lang === "es" ? "¡Listo! Te esperamos." : "All set! See you soon."}
              </h1>
              <p className="text-sm text-[var(--ink-2)]">
                {lang === "es"
                  ? "Recibimos tu registro. Nos vemos en tu fecha de llegada."
                  : "We've received your registration. See you on your arrival date."}
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold text-white"
                style={{ backgroundColor: COLOR_ACENTO }}
              >
                {lang === "es" ? "Volver al inicio" : "Back to home"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasoForm({
  children,
  onSubmit,
  lang,
  opcional,
}: {
  children: React.ReactNode;
  onSubmit: () => void;
  lang: "es" | "en";
  opcional?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-5"
    >
      {children}
      <BotonContinuar lang={lang} texto={opcional ? (lang === "es" ? "Continuar (opcional)" : "Continue (optional)") : undefined} />
    </form>
  );
}

function BotonContinuar({ lang, disabled, texto }: { lang: "es" | "en"; disabled?: boolean; texto?: string }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ backgroundColor: COLOR_ACENTO }}
    >
      {texto ?? (lang === "es" ? "Continuar" : "Continue")}
    </button>
  );
}
