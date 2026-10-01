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

// 2026-09-25, at Ivan's request: Banco General's real published fees for
// "Enlace de Pago BG" / "Botón de Pago BG" (the card-payment button this
// project will eventually charge direct bookings through), absorbed into
// every quoted total so the guest simply pays one clean price and Casa
// Randa still nets the real quote amount — not shown as its own line.
// Rates confirmed against BG's own published schedule (updated March
// 2026): 3.50% + USD 0.50 per Visa/Mastercard transaction, plus 7% ITBMS
// on BG's commission itself (not on the transaction total).
export const BG_CARD_FEE_PCT = 0.035;
export const BG_CARD_FEE_FLAT = 0.5;
export const BG_ITBMS_ON_FEE = 0.07;

/**
 * Grosses up a net amount so that, after Banco General deducts its card
 * fee (percentage + flat, both then taxed by ITBMS), the amount Casa
 * Randa actually receives equals `net`. Solves T - (pct*T + flat)*(1+itbms) = net for T.
 */
function grossUpForCardFees(net: number): number {
  const factor = 1 - BG_CARD_FEE_PCT * (1 + BG_ITBMS_ON_FEE);
  const flatWithTax = BG_CARD_FEE_FLAT * (1 + BG_ITBMS_ON_FEE);
  return (net + flatWithTax) / factor;
}

export type CancellationPolicy = "flex" | "nr";
export type PaymentPlan = "30" | "100";

export interface QuoteInput {
  checkIn: string; // ISO date, "YYYY-MM-DD"
  checkOut: string; // ISO date, "YYYY-MM-DD"
  pax: number;
  cancellation: CancellationPolicy;
  plan: PaymentPlan;
  /** Código de descuento ya validado, 0–1 (0.05 = 5 %). Se resta del neto antes de absorber la comisión de tarjeta. */
  discountPct?: number;
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
  const netBeforeDiscount = sub + adj + taxed;
  const discount = Math.round(netBeforeDiscount * Math.min(Math.max(input.discountPct ?? 0, 0), 1));
  const netUsd = netBeforeDiscount - discount;

  // Absorbed into the Alojamiento line rather than shown as its own line —
  // the breakdown still sums exactly to totalUsd, it just means the
  // accommodation line runs a bit above nights × RATE. See the
  // grossUpForCardFees note above for why.
  const totalUsd = Math.round(grossUpForCardFees(netUsd) * 100) / 100;
  const cardFeeSurcharge = totalUsd - netUsd;
  const dueTodayUsd = input.plan === "30" ? Math.round(totalUsd * 0.3) : totalUsd;

  const lines: QuoteLine[] = [
    {
      label: { es: `Alojamiento, ${nights} × $${RATE}`, en: `Accommodation, ${nights} × $${RATE}` },
      amountUsd: lodging + cardFeeSurcharge,
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

  if (discount > 0) {
    const pct = Math.round((input.discountPct ?? 0) * 100);
    lines.push({
      label: { es: `Código de descuento, −${pct} %`, en: `Discount code, −${pct}%` },
      amountUsd: -discount,
    });
  }

  return { nights, lines, totalUsd, dueTodayUsd };
}
