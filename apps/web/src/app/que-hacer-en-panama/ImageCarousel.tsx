"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PlacePlaceholder } from "./PlacePlaceholder";

export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const { lang } = useLanguage();
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden">
        <PlacePlaceholder className="absolute inset-0" />
      </div>
    );
  }

  const hasMultiple = images.length > 1;
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--night)]">
      <Image src={images[index]} alt={alt} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={lang === "es" ? "Foto anterior" : "Previous photo"}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-[var(--night)]/60 p-2 text-[var(--on-dark)] transition-colors hover:bg-[var(--night)]/85"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={lang === "es" ? "Foto siguiente" : "Next photo"}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-[var(--night)]/60 p-2 text-[var(--on-dark)] transition-colors hover:bg-[var(--night)]/85"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={lang === "es" ? `Ir a la foto ${i + 1}` : `Go to photo ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? "w-5 bg-[var(--lamp-fill)]" : "w-1.5 bg-[var(--on-dark)]/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
