/**
 * Direct-booking pricing engine. Ported from the static prototype's
 * renderQuote() (see legacy-static/js/casa-randa.js) into pure, typed
 * functions with no DOM access, so they can be unit-tested and reused
 * in both server and client components.
 */

export const RATE = 520; // USD/night — placeholder; production value comes from PriceLabs, see CLAUDE.md
export const CLEANING = 60;
export const TAX = 0.1;
export const EXTRA_GUEST = 40;
export const FREE_PAX = 14;
export const MIN_NIGHTS = 1;
export const MAX_PAX = 16;

export type CancellationPolicy = "flex" | "nr";
export type PaymentPlan = "30" | "100";

export interface QuoteInput {
  checkIn: string; // ISO date, "YYYY-MM-DD"
  checkOut: string; // ISO date, "YYYY-MM-DD"
  pax: number;
  cancellation: CancellationPolicy;
  plan: PaymentPlan;
}

export interface QuoteLine {
  label: { es: string; en: string };
  amountUsd: number;
}

export interface Quote {
  nights: number;
  lines: QuoteLine[];
  totalUsd: number;
  dueTodayUsd: number;
}

/** Whole nights between two ISO dates, or 0 if either is invalid. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const d1 = new Date(`${checkIn}T12:00:00`);
  const d2 = new Date(`${checkOut}T12:00:00`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}

/**
 * Computes the full direct-booking quote, or null if the stay is shorter
 * than MIN_NIGHTS (caller should show the "minimum stay" message instead).
 */
export function computeQuote(input: QuoteInput): Quote | null {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < MIN_NIGHTS) return null;

  const pax = Math.min(Math.max(input.pax, 2), MAX_PAX);
  const lodging = RATE * nights;
  const extraPax = Math.max(0, pax - FREE_PAX);
  const extra = extraPax * EXTRA_GUEST * nights;
  const sub = lodging + extra + CLEANING;

  const isFlex = input.cancellation === "flex";
  const adj = isFlex ? Math.round(sub * 0.03) : -Math.round(sub * 0.05);
  const taxed = Math.round((sub + adj) * TAX);
  const totalUsd = sub + adj + taxed;
  const dueTodayUsd = input.plan === "30" ? Math.round(totalUsd * 0.3) : totalUsd;

  const lines: QuoteLine[] = [
    {
      label: { es: `Alojamiento, ${nights} × $${RATE}`, en: `Accommodation, ${nights} × $${RATE}` },
      amountUsd: lodging,
    },
  ];

  if (extra > 0) {
    lines.push({
      label: {
        es: `Huéspedes 15 y 16, ${extraPax} × $${EXTRA_GUEST} × ${nights}`,
        en: `Guests over 14, ${extraPax} × $${EXTRA_GUEST} × ${nights}`,
      },
      amountUsd: extra,
    });
  }

  lines.push({
    label: { es: "Limpieza, cargo único", en: "Cleaning, one-off" },
    amountUsd: CLEANING,
  });

  lines.push({
    label: isFlex
      ? { es: "Cancelación flexible, +3 %", en: "Flexible cancellation, +3%" }
      : { es: "Tarifa no reembolsable, −5 %", en: "Non-refundable rate, −5%" },
    amountUsd: adj,
  });

  lines.push({
    label: { es: "Impuesto de hospedaje, 10 %", en: "Lodging tax, 10%" },
    amountUsd: taxed,
  });

  return { nights, lines, totalUsd, dueTodayUsd };
}
