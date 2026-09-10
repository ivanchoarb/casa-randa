"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CancellationPolicy, PaymentPlan } from "@casa-randa/pricing";

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
  const [checkIn, setCheckIn] = useState("2026-11-20");
  const [checkOut, setCheckOut] = useState("2026-11-23");
  const [pax, setPax] = useState(12);
  const [cancellation, setCancellation] = useState<CancellationPolicy>("flex");
  const [plan, setPlan] = useState<PaymentPlan>("30");

  const value = useMemo<BookingContextValue>(
    () => ({ checkIn, checkOut, pax, cancellation, plan, setCheckIn, setCheckOut, setPax, setCancellation, setPlan }),
    [checkIn, checkOut, pax, cancellation, plan],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
