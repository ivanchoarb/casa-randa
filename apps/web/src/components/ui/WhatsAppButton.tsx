"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

// Número real de contacto de Casa Randa. Formato wa.me: solo dígitos, sin
// "+" ni espacios — https://wa.me/<código de país><número>.
const WHATSAPP_NUMERO = "573157621593";

export function WhatsAppButton() {
  const { lang } = useLanguage();

  const mensaje =
    lang === "es"
      ? "Hola, quiero información sobre Casa Randa."
      : "Hi, I'd like some information about Casa Randa.";

  const href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={lang === "es" ? "Escribir por WhatsApp" : "Message us on WhatsApp"}
      className="whatsapp-fab fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:scale-105 active:scale-95"
    >
      <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
        <path d="M16.001 3C9.096 3 3.5 8.596 3.5 15.5c0 2.31.63 4.474 1.727 6.33L3 29l7.36-2.184A12.44 12.44 0 0 0 16 28.5c6.905 0 12.5-5.596 12.5-12.5S22.906 3 16.001 3Zm0 22.75c-2.05 0-3.955-.6-5.56-1.632l-.4-.25-4.37 1.297 1.322-4.26-.26-.42A10.2 10.2 0 0 1 5.75 15.5c0-5.66 4.59-10.25 10.25-10.25S26.25 9.84 26.25 15.5 21.66 25.75 16 25.75Zm5.61-7.65c-.307-.154-1.82-.898-2.102-1-.282-.103-.487-.154-.692.153-.205.308-.795 1-.975 1.206-.18.205-.36.23-.667.077-.308-.154-1.298-.478-2.473-1.524-.914-.815-1.531-1.822-1.71-2.13-.18-.307-.02-.473.135-.627.138-.137.308-.36.462-.539.154-.18.205-.308.308-.513.103-.205.051-.385-.026-.539-.077-.154-.692-1.667-.949-2.283-.25-.6-.505-.52-.692-.53l-.59-.01c-.205 0-.539.077-.821.385-.282.308-1.077 1.052-1.077 2.566s1.103 2.976 1.257 3.181c.154.205 2.171 3.316 5.26 4.65.735.317 1.309.507 1.756.649.738.235 1.41.202 1.94.123.592-.088 1.82-.744 2.076-1.463.257-.718.257-1.334.18-1.463-.077-.128-.282-.205-.59-.36Z" />
      </svg>
    </a>
  );
}
