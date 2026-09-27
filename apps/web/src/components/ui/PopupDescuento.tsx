"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const CLAVE_LOCALSTORAGE = "cr_popup_descuento_visto";
const RETRASO_MS = 6000;

const fieldLabel = "font-[var(--font-display)] text-xs tracking-wide text-[var(--on-dark-2)]";
const fieldInput =
  "rounded-[1px] border border-[var(--on-dark-2)]/30 bg-[var(--ground)] px-3 py-2 font-[var(--font-display)] text-sm text-[var(--ink)] transition-[border-color,box-shadow] duration-200 outline-none focus:border-[var(--lamp-fill)] focus:ring-2 focus:ring-[var(--lamp-fill)]/30";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PopupDescuento() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // El wizard de check-in (/check-in) es un flujo de un huésped que ya
    // tiene reserva confirmada — ofrecerle un cupón de bienvenida a mitad
    // de ese flujo no tiene sentido y solo distrae.
    if (pathname?.startsWith("/check-in")) return;
    let visto = false;
    try {
      visto = localStorage.getItem(CLAVE_LOCALSTORAGE) === "1";
    } catch {
      // localStorage no disponible — se muestra igual, sin recordar cierres.
    }
    if (visto) return;
    const t = setTimeout(() => setVisible(true), RETRASO_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  function recordarYCerrar() {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE_LOCALSTORAGE, "1");
    } catch {
      // sin localStorage, el popup puede volver a aparecer en la próxima visita — no es grave.
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
      setError(lang === "es" ? "Los correos no coinciden." : "The emails don't match.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(lang === "es" ? "Escribe un correo válido." : "Enter a valid email.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/suscribirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim() || null,
          pais: pais.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setEnviado(true);
      try {
        localStorage.setItem(CLAVE_LOCALSTORAGE, "1");
      } catch {
        // no crítico
      }
    } catch {
      setError(
        lang === "es"
          ? "No se pudo enviar el cupón. Intenta de nuevo o escríbenos a booking@randahome.com."
          : "Couldn't send the coupon. Try again or email us at booking@randahome.com.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === "es" ? "Suscríbete y recibe 5% de descuento" : "Subscribe and get 5% off"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/60 px-4"
      onClick={recordarYCerrar}
    >
      <div
        className="relative w-full max-w-md border-t-4 border-[var(--lamp-fill)] bg-[var(--night)] px-7 py-8 text-[var(--on-dark)] shadow-[0_18px_40px_-28px_rgba(20,33,26,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={recordarYCerrar}
          aria-label={lang === "es" ? "Cerrar" : "Close"}
          className="absolute top-3 right-3 font-[var(--font-display)] text-xl leading-none text-[var(--on-dark-2)] hover:text-[var(--on-dark)]"
        >
          ×
        </button>

        {enviado ? (
          <div>
            <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--on-dark)]">
              {lang === "es" ? "¡Listo!" : "All set!"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--on-dark-2)]">
              {lang === "es"
                ? "Se ha enviado el cupón de descuento a tu correo electrónico."
                : "We've sent the discount coupon to your email."}
            </p>
            <button
              type="button"
              onClick={recordarYCerrar}
              className="mt-6 w-full rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)]"
            >
              {lang === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--on-dark)]">
              {lang === "es" ? (
                <>
                  5% de descuento en <br /> tu próxima estadía
                </>
              ) : (
                <>
                  5% off <br /> your next stay
                </>
              )}
            </h2>
            <p className="mt-2 text-sm text-[var(--on-dark-2)]">
              {lang === "es"
                ? "Suscríbete a nuestra lista de correos y te enviamos el cupón ahora mismo."
                : "Subscribe to our mailing list and we'll email you the coupon right away."}
            </p>

            <form onSubmit={enviar} className="mt-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="popup-nombre" className={fieldLabel}>
                  {lang === "es" ? "Nombre completo" : "Full name"}
                </label>
                <input
                  id="popup-nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="popup-email" className={fieldLabel}>
                  Email
                </label>
                <input
                  id="popup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="popup-email-confirmar" className={fieldLabel}>
                  {lang === "es" ? "Confirmar email" : "Confirm email"}
                </label>
                <input
                  id="popup-email-confirmar"
                  type="email"
                  required
                  value={confirmarEmail}
                  onChange={(e) => setConfirmarEmail(e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="popup-telefono" className={fieldLabel}>
                    {lang === "es" ? "Teléfono (opcional)" : "Phone (optional)"}
                  </label>
                  <input
                    id="popup-telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="popup-pais" className={fieldLabel}>
                    {lang === "es" ? "País" : "Country"}
                  </label>
                  <input
                    id="popup-pais"
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
                  ? "Autorizo a Casa Randa a enviarme correos electrónicos con ofertas y novedades."
                  : "I allow Casa Randa to send me emails with offers and updates."}
              </label>

              {error && <p className="text-xs text-[var(--caoba)]">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 inline-flex w-full items-center justify-center rounded-[1px] bg-[var(--lamp-fill)] px-5 py-2.5 font-[var(--font-display)] text-sm font-semibold text-[#20140a] transition-colors hover:bg-[var(--lamp-fill-hover)] disabled:opacity-60"
              >
                {enviando
                  ? lang === "es"
                    ? "Enviando…"
                    : "Sending…"
                  : lang === "es"
                    ? "Quiero mi 5%"
                    : "Get my 5%"}
              </button>
              <button
                type="button"
                onClick={recordarYCerrar}
                className="text-center text-xs text-[var(--on-dark-2)] underline"
              >
                {lang === "es" ? "No, gracias" : "No, thanks"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
