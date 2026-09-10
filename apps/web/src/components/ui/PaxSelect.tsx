"use client";

import { MAX_PAX } from "@casa-randa/pricing";

const OPTIONS = Array.from({ length: MAX_PAX - 1 }, (_, i) => i + 2); // 2..MAX_PAX

export function PaxSelect({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className={className}>
      {OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
