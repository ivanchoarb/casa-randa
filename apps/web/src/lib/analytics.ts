// Métricas propias de la web (sin cookies ni terceros): visitas y clicks al
// código de descuento. Los eventos van a /api/eventos, que los guarda en
// `eventos_web` para verlos en la intranet (/metricas).
export type TipoEvento = "visita" | "click_codigo" | "codigo_aplicado" | "click_cta";

const CLAVE_VISITANTE = "rt_visitante";
const CLAVE_UTM = "rt_utm";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

function visitanteId(): string {
  try {
    let id = localStorage.getItem(CLAVE_VISITANTE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLAVE_VISITANTE, id);
    }
    return id;
  } catch {
    return "";
  }
}

// Los utm de la URL de llegada se guardan para la sesión: el click al código
// puede ocurrir en otra página que la de aterrizaje y debe seguir contando
// para la campaña que trajo a la persona.
function utmDeLaSesion(): Record<string, string> {
  try {
    const actuales = new URLSearchParams(window.location.search);
    if (UTM.some((k) => actuales.get(k))) {
      const nuevos: Record<string, string> = {};
      for (const k of UTM) {
        const v = actuales.get(k);
        if (v) nuevos[k] = v.slice(0, 100);
      }
      sessionStorage.setItem(CLAVE_UTM, JSON.stringify(nuevos));
      return nuevos;
    }
    return JSON.parse(sessionStorage.getItem(CLAVE_UTM) ?? "{}");
  } catch {
    return {};
  }
}

export function trackEvento(tipo: TipoEvento) {
  if (typeof window === "undefined") return;
  // En desarrollo no se ensucia la base real, salvo con localStorage.rt_debug.
  if (window.location.hostname === "localhost" && !localStorage.getItem("rt_debug")) return;

  let referrer = "";
  try {
    if (document.referrer && new URL(document.referrer).host !== window.location.host) referrer = document.referrer.slice(0, 200);
  } catch {
    // referrer inválido: se ignora
  }

  const cuerpo = JSON.stringify({
    tipo,
    ruta: window.location.pathname,
    visitante_id: visitanteId(),
    referrer: referrer || undefined,
    idioma: document.documentElement.lang || undefined,
    dispositivo: window.matchMedia("(max-width: 767px)").matches ? "movil" : "escritorio",
    ...utmDeLaSesion(),
  });

  const blob = new Blob([cuerpo], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/eventos", blob)) {
    void fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true }).catch(() => {});
  }
}
