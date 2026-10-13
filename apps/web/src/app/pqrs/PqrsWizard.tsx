"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { bandera, paisesTelefono, PAISES } from "@/lib/paises";
import { useLanguage, type Lang } from "@/lib/i18n/LanguageProvider";
import { TIPOS_PQRS, type TipoPqrs } from "@/lib/pqrs";

const COLOR_TITULO = "var(--ink)";
const COLOR_ACENTO = "var(--caoba)";
const inputClassBase =
  "rounded-2xl border-2 border-[var(--ink)]/15 bg-white px-5 py-4 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--caoba)] focus-visible:ring-2 focus-visible:ring-[var(--caoba)]/30";
const inputClass = `w-full ${inputClassBase}`;
const botonFoco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--caoba)] focus-visible:ring-offset-2";

type Paso = "idioma" | "tipo" | "nombre" | "email" | "telefono" | "reserva" | "mensaje" | "consentimiento" | "listo";
const ORDEN: Exclude<Paso, "listo">[] = ["idioma", "tipo", "nombre", "email", "telefono", "reserva", "mensaje", "consentimiento"];

const textosTipo: Record<TipoPqrs, { es: [string, string]; en: [string, string] }> = {
  peticion: {
    es: ["Petición", "Pedir información o un servicio."],
    en: ["Request", "Ask for information or a service."],
  },
  queja: {
    es: ["Queja", "Inconformidad con el trato o el servicio recibido."],
    en: ["Complaint", "Concern about the treatment or service you received."],
  },
  reclamo: {
    es: ["Reclamo", "Algo cobrado, prometido o dañado que requiere una solución."],
    en: ["Claim", "Something charged, promised or damaged that requires a solution."],
  },
  sugerencia: {
    es: ["Sugerencia", "Una idea para ayudarnos a mejorar."],
    en: ["Suggestion", "An idea to help us improve."],
  },
};

export function PqrsWizard() {
  const { lang, setLang } = useLanguage();
  const [paso, setPaso] = useState<Paso>("idioma");
  const [tipo, setTipo] = useState<TipoPqrs | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefonoIso, setTelefonoIso] = useState("PA");
  const [telefonoNumero, setTelefonoNumero] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [aceptaTratamientoDatos, setAceptaTratamientoDatos] = useState(false);
  const [sitioWeb, setSitioWeb] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [radicado, setRadicado] = useState("");

  const indice = paso === "listo" ? -1 : ORDEN.indexOf(paso);

  function atras() {
    if (indice > 0) setPaso(ORDEN[indice - 1]);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!tipo || !aceptaTratamientoDatos) return;
    setErrorEnvio(null);
    setEnviando(true);
    const codigoTelefono = PAISES.find((pais) => pais.iso === telefonoIso)?.telefono ?? "";
    const telefono = telefonoNumero.trim() ? `${codigoTelefono} ${telefonoNumero.trim()}` : "";

    try {
      const respuesta = await fetch("/api/pqrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          nombre,
          apellido,
          email,
          telefono,
          idioma: lang,
          codigoReserva,
          asunto,
          mensaje,
          aceptaTratamientoDatos,
          sitio_web: sitioWeb,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.ok) throw new Error(datos.error);
      setRadicado(datos.radicado ?? "");
      setPaso("listo");
    } catch (error) {
      setErrorEnvio(
        error instanceof Error && error.message
          ? error.message
          : lang === "es"
            ? "No se pudo enviar la solicitud. Inténtalo de nuevo."
            : "We couldn't submit your request. Please try again.",
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
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--ink-2)] hover:bg-[var(--ground)] ${botonFoco} ${indice <= 0 || paso === "listo" ? "invisible" : ""}`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className={`rounded-full border border-[var(--ink)]/15 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--ink-2)] ${botonFoco} ${paso === "idioma" || paso === "listo" ? "invisible" : ""}`}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <Link
            href="/"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--ink-2)] hover:bg-[var(--ground)] ${botonFoco}`}
          >
            ×
          </Link>
        </div>

        {paso !== "listo" && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ground)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((indice + 1) / ORDEN.length) * 100}%`, backgroundColor: COLOR_ACENTO }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-[var(--ink-2)] tabular-nums">
              {indice + 1}/{ORDEN.length}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center py-10">
          {paso === "idioma" && (
            <div className="flex flex-col gap-5">
              <Titulo>Choose your language<br />Elige tu idioma</Titulo>
              <BotonIdioma bandera="🇵🇦" texto="Español" onClick={() => { setLang("es"); setPaso("tipo"); }} />
              <BotonIdioma bandera="🇺🇸" texto="English" onClick={() => { setLang("en"); setPaso("tipo"); }} />
            </div>
          )}

          {paso === "tipo" && (
            <PasoForm lang={lang} onSubmit={() => tipo && setPaso("nombre")} disabled={!tipo}>
              <Titulo>{lang === "es" ? "¿Cómo podemos ayudarte?" : "How can we help?"}</Titulo>
              <div className="mt-1 grid gap-3" role="group" aria-label={lang === "es" ? "Tipo de solicitud" : "Submission type"}>
                {TIPOS_PQRS.map((valor) => {
                  const [titulo, descripcion] = textosTipo[valor][lang];
                  const seleccionado = tipo === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={seleccionado}
                      onClick={() => setTipo(valor)}
                      className={`rounded-2xl border-2 bg-white px-5 py-4 text-left transition-colors ${botonFoco} ${seleccionado ? "border-[var(--caoba)]" : "border-[var(--ink)]/15 hover:border-[var(--caoba)]"}`}
                    >
                      <span className="block text-base font-semibold">{titulo}</span>
                      <span className="mt-1 block text-sm text-[var(--ink-2)]">{descripcion}</span>
                    </button>
                  );
                })}
              </div>
            </PasoForm>
          )}

          {paso === "nombre" && (
            <PasoForm lang={lang} onSubmit={() => setPaso("email")}>
              <Titulo>{lang === "es" ? "¿Cómo te llamas?" : "What's your name?"}</Titulo>
              <div className="mt-1 flex flex-col gap-3">
                <Campo id="pqrs-nombre" label={lang === "es" ? "Nombre" : "First name"}>
                  <input id="pqrs-nombre" autoFocus required minLength={1} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
                </Campo>
                <Campo id="pqrs-apellido" label={lang === "es" ? "Apellido" : "Last name"}>
                  <input id="pqrs-apellido" required minLength={1} maxLength={80} value={apellido} onChange={(e) => setApellido(e.target.value)} className={inputClass} />
                </Campo>
              </div>
            </PasoForm>
          )}

          {paso === "email" && (
            <PasoForm lang={lang} onSubmit={() => setPaso("telefono")}>
              <Titulo>{lang === "es" ? "¿Cuál es tu correo?" : "What's your email?"}</Titulo>
              <Campo id="pqrs-email" label="Email">
                <input id="pqrs-email" autoFocus required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Campo>
            </PasoForm>
          )}

          {paso === "telefono" && (
            <PasoOpcional lang={lang} onSubmit={() => setPaso("reserva")} onOmitir={() => { setTelefonoNumero(""); setPaso("reserva"); }}>
              <Titulo>{lang === "es" ? "¿A qué número te contactamos?" : "What number can we reach you at?"}</Titulo>
              <p className="text-sm text-[var(--ink-2)]">{lang === "es" ? "Opcional." : "Optional."}</p>
              <div className="flex gap-3">
                <Campo id="pqrs-codigo-pais" label={lang === "es" ? "Código de país" : "Country code"} className="w-32 shrink-0">
                  <select id="pqrs-codigo-pais" value={telefonoIso} onChange={(e) => setTelefonoIso(e.target.value)} className={`${inputClassBase} w-full px-3`}>
                    {paisesTelefono(lang).map((pais) => <option key={pais.iso} value={pais.iso}>{bandera(pais.iso)} {pais.telefono}</option>)}
                  </select>
                </Campo>
                <Campo id="pqrs-telefono" label={lang === "es" ? "Teléfono" : "Phone number"} className="min-w-0 flex-1">
                  <input id="pqrs-telefono" autoFocus type="tel" maxLength={24} pattern="[0-9 ()+-]*" value={telefonoNumero} onChange={(e) => setTelefonoNumero(e.target.value)} className={inputClass} />
                </Campo>
              </div>
            </PasoOpcional>
          )}

          {paso === "reserva" && (
            <PasoOpcional lang={lang} onSubmit={() => setPaso("mensaje")} onOmitir={() => { setCodigoReserva(""); setPaso("mensaje"); }}>
              <Titulo>{lang === "es" ? "¿Tienes un código de reserva?" : "Do you have a reservation code?"}</Titulo>
              <p className="text-sm text-[var(--ink-2)]">
                {lang === "es" ? "Puede ser el código de nuestra web, Airbnb o Vrbo. Opcional." : "It can be your website, Airbnb or Vrbo code. Optional."}
              </p>
              <Campo id="pqrs-reserva" label={lang === "es" ? "Código de reserva" : "Reservation code"}>
                <input id="pqrs-reserva" autoFocus maxLength={40} value={codigoReserva} onChange={(e) => setCodigoReserva(e.target.value.toUpperCase())} className={`${inputClass} text-center text-xl font-semibold tracking-[0.2em] uppercase`} />
              </Campo>
            </PasoOpcional>
          )}

          {paso === "mensaje" && (
            <PasoForm lang={lang} onSubmit={() => setPaso("consentimiento")}>
              <Titulo>{lang === "es" ? "Cuéntanos qué ocurrió" : "Tell us what happened"}</Titulo>
              <Campo id="pqrs-asunto" label={lang === "es" ? "Asunto" : "Subject"}>
                <input id="pqrs-asunto" autoFocus required minLength={3} maxLength={150} value={asunto} onChange={(e) => setAsunto(e.target.value)} className={inputClass} />
              </Campo>
              <Campo id="pqrs-mensaje" label={lang === "es" ? "Mensaje" : "Message"}>
                <textarea id="pqrs-mensaje" required minLength={10} maxLength={4000} rows={7} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={inputClass} />
              </Campo>
            </PasoForm>
          )}

          {paso === "consentimiento" && (
            <form onSubmit={enviar} className="flex flex-col gap-5">
              <Titulo>{lang === "es" ? "Antes de enviar" : "Before submitting"}</Titulo>
              <label className="flex items-start gap-3 rounded-2xl border-2 border-[var(--ink)]/15 px-5 py-4 text-sm text-[var(--ink)]">
                <input type="checkbox" required checked={aceptaTratamientoDatos} onChange={(e) => setAceptaTratamientoDatos(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--caoba)] focus-visible:ring-2 focus-visible:ring-[var(--caoba)]" />
                {lang === "es" ? "Autorizo el tratamiento de mis datos personales para gestionar esta solicitud." : "I authorize the processing of my personal data to manage this request."}
              </label>
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="pqrs-sitio-web">Sitio web</label>
                <input id="pqrs-sitio-web" name="sitio_web" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} className="sr-only" tabIndex={-1} aria-hidden="true" autoComplete="off" />
              </div>
              <p className="text-sm text-[var(--ink-2)]">{lang === "es" ? "Te responderemos al correo que indicaste." : "We will reply to the email address you provided."}</p>
              {errorEnvio && <p role="alert" className="text-sm text-[var(--caoba)]">{errorEnvio}</p>}
              <BotonContinuar lang={lang} disabled={enviando || !aceptaTratamientoDatos} texto={enviando ? (lang === "es" ? "Enviando…" : "Sending…") : (lang === "es" ? "Enviar solicitud" : "Submit request")} />
            </form>
          )}

          {paso === "listo" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>{lang === "es" ? "Recibimos tu solicitud" : "We received your submission"}</h1>
              {radicado && <p className="rounded-2xl bg-[var(--ground)] px-5 py-4 text-xl font-bold tracking-wide text-[var(--ink)]">{radicado}</p>}
              <p className="text-sm font-semibold text-[var(--ink)]">{lang === "es" ? "Guarda este número de radicado." : "Keep this reference number."}</p>
              <p className="text-sm text-[var(--ink-2)]">{lang === "es" ? "Te responderemos al correo que indicaste." : "We will reply to the email address you provided."}</p>
              <Link href="/" className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold text-white ${botonFoco}`} style={{ backgroundColor: COLOR_ACENTO }}>
                {lang === "es" ? "Volver al inicio" : "Back to home"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return <h1 className="font-sans text-3xl leading-tight font-bold" style={{ color: COLOR_TITULO }}>{children}</h1>;
}

function Campo({ id, label, children, className = "" }: { id: string; label: string; children: ReactNode; className?: string }) {
  return <div className={className}><label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--ink-2)]">{label}</label>{children}</div>;
}

function PasoForm({ children, onSubmit, lang, disabled }: { children: ReactNode; onSubmit: () => void; lang: Lang; disabled?: boolean }) {
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col gap-5">{children}<BotonContinuar lang={lang} disabled={disabled} /></form>;
}

function PasoOpcional({ children, onSubmit, onOmitir, lang }: { children: ReactNode; onSubmit: () => void; onOmitir: () => void; lang: Lang }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col gap-4">
      {children}
      <BotonContinuar lang={lang} />
      <button type="button" onClick={onOmitir} className={`rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--ink-2)] underline underline-offset-4 ${botonFoco}`}>{lang === "es" ? "Omitir" : "Skip"}</button>
    </form>
  );
}

function BotonIdioma({ bandera: emoji, texto, onClick }: { bandera: string; texto: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-4 rounded-2xl border-2 border-[var(--ink)]/15 bg-white px-5 py-5 text-left transition-colors hover:border-[var(--caoba)] ${botonFoco}`}><span className="text-3xl">{emoji}</span><span className="text-lg font-semibold">{texto}</span></button>;
}

function BotonContinuar({ lang, disabled, texto }: { lang: Lang; disabled?: boolean; texto?: string }) {
  return <button type="submit" disabled={disabled} className={`mt-2 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-50 ${botonFoco}`} style={{ backgroundColor: COLOR_ACENTO }}>{texto ?? (lang === "es" ? "Continuar" : "Continue")}</button>;
}
