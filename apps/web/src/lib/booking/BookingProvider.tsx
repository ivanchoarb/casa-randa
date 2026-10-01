"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { MIN_NIGHTS, type CancellationPolicy, type PaymentPlan } from "@casa-randa/pricing";

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface BookingContextValue {
  checkIn: string;
  checkOut: string;
  pax: number;
  cancellation: CancellationPolicy;
  plan: PaymentPlan;
  setCheckIn: (v: string) => void;
  setCheckOut: (v: string) => void;
  setPax: (v: number) => void;
  setCancellation: (v: CancellationPolicy) => void;
  setPlan: (v: PaymentPlan) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

/**
 * Shared check-in/out/pax state across the availability bar and the quote
 * calculator, mirroring the prototype's behaviour where editing the top
 * fields updates the quote fields below (see legacy-static/js/casa-randa.js).
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  // 2026-09-30, bug real reportado por Ivan: estas fechas de ejemplo hacían
  // que la cotización mostrara un total real (p. ej. $1,908) antes de que
  // el huésped tocara nada — parecía una cotización de verdad sin serlo.
  // Vacías, computeQuote() devuelve null (nightsBetween con fecha inválida
  // da 0 noches) y QuoteCalculator ya muestra su mensaje de "estancia
  // mínima" para ese caso — no hace falta tocar nada más.
  const [checkIn, setCheckInState] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [pax, setPax] = useState(12);
  const [cancellation, setCancellation] = useState<CancellationPolicy>("flex");
  const [plan, setPlan] = useState<PaymentPlan>("30");

  // Igual que en la cotización manual de apps/intranet: cambiar Entrada
  // corre Salida hacia adelante en vez de dejarla en un rango inválido, así
  // el calendario de Salida (que el input abre solo, ver openDatePicker.ts)
  // ya cae en el mes correcto. Conserva una estadía más larga si ya la
  // habían elegido — solo se corre cuando Salida deja de tener sentido.
  const setCheckIn = useCallback((v: string) => {
    setCheckInState(v);
    setCheckOut((prevOut) => (!prevOut || prevOut <= v ? addDays(v, MIN_NIGHTS) : prevOut));
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({ checkIn, checkOut, pax, cancellation, plan, setCheckIn, setCheckOut, setPax, setCancellation, setPlan }),
    [checkIn, checkOut, pax, cancellation, plan, setCheckIn],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
