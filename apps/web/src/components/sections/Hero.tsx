"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// How many viewport-heights of scroll the hero video's scrub takes.
// Longer = more scroll per frame of video, i.e. a slower, more deliberate scrub.
//
// 2026-09-24, at Ivan's request ("pasa este video al hero con efectos"):
// this is the same scroll-scrub mechanism that used to live in its own
// standalone NightToDayReveal section further down the page — moved here
// wholesale, not duplicated, so the video now plays as the visitor scrolls
// through the Hero itself instead of a separate section.
//
// 2026-09-27: swapped in a new hero video (casa-randa-hero.mp4) — same
// scrub mechanism, different footage. The source file (1280x720, ~16Mbps,
// default long-GOP encode) made every scroll-driven seek take 100-200ms+
// to resolve — no ffmpeg was installed locally, so a scratch copy of
// ffmpeg-static was pulled via npm just for this one re-encode, matching
// the original clip's approach: 960x540, no B-frames, a keyframe every 5
// frames (`-bf 0 -g 5 -keyint_min 5 -sc_threshold 0`), audio stripped
// (the video is muted anyway). That took seeks down to 3-12ms — verified
// by timing `currentTime` sets against the real file, not assumed.
const SCROLL_LENGTH_VH = 300;

export function Hero() {
  const { lang } = useLanguage();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      const showMidTransition = () => {
        if (video.duration) video.currentTime = video.duration / 2;
      };
      video.addEventListener("loadedmetadata", showMidTransition);
      return () => video.removeEventListener("loadedmetadata", showMidTransition);
    }

    let targetProgress = 0;
    let inView = false;
    let rafId = 0;

    function computeTargetProgress() {
      const rect = wrapper!.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      targetProgress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
    }

    function ease() {
      const duration = video!.duration;
      if (duration && !Number.isNaN(duration)) {
        const target = targetProgress * duration;
        const current = video!.currentTime;
        const diff = target - current;
        // Snap once close enough — lerping forever never quite reaches the
        // exact end/start frame, which matters right at the section edges.
        video!.currentTime = Math.abs(diff) < 0.03 ? target : current + diff * 0.18;
      }
      if (inView) rafId = requestAnimationFrame(ease);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          computeTargetProgress();
          rafId = requestAnimationFrame(ease);
        } else {
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0 },
    );
    observer.observe(wrapper);

    window.addEventListener("scroll", computeTargetProgress, { passive: true });
    computeTargetProgress();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", computeTargetProgress);
    };
  }, []);

  // 2026-09-24, at Ivan's request: a two-line title back in the Hero,
  // bottom-left over the video — chosen over "toda la casa / solo su
  // grupo" after Ivan questioned whether that even needs spelling out
  // (the video already shows it's a whole house; the meta description
  // already says "casa completa"). This version names the place instead
  // of restating what's already visible.
  const heading =
    lang === "es"
      ? ["Una casa de la antigua", "Zona del Canal."]
      : ["A house from the old", "Canal Zone."];

  // 2026-09-27, /copywriter-rentas-cortas audit: the headline named the
  // place but the Hero had no subheadline or proof at all — the rubric's
  // "titular + subtítulo + prueba" structure was missing its last two
  // thirds on the first screen. Deliberately did NOT reuse "toda la casa /
  // solo su grupo" here — that's the exact line Ivan already vetoed for
  // this spot on 2026-09-24 (see comment above). Picked a different,
  // compatible angle instead: room/bathroom count (not visible in a
  // facade shot, so it's new information, not a restatement) plus the
  // real 4.94/16-review figure Reviews.tsx already shows further down —
  // same number, just surfaced earlier where Bencivenga/Hopkins would
  // put proof, not a new claim.
  const sub =
    lang === "es"
      ? "Seis habitaciones, seis baños privados."
      : "Six bedrooms, six private bathrooms.";
  const proof = lang === "es" ? "4,94 · 16 reseñas en Airbnb" : "4.94 · 16 reviews on Airbnb";

  return (
    <section ref={wrapperRef} className="relative" style={{ height: `${SCROLL_LENGTH_VH}vh` }}>
      <div className="sticky top-0 isolate h-screen overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/casa-randa-hero.mp4"
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        {/* Scoped to just behind the title, not the whole frame — Ivan
            asked for the full-screen overlay gone, but the video alone
            can't guarantee contrast for text in every frame (a bright
            daytime moment under light text would wash out). */}
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[var(--night)]/70 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 sm:pb-14">
          <h1 className="text-fluid-hero font-[var(--font-display)] leading-none tracking-tight font-semibold text-[var(--on-dark)]">
            {heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-lg text-[var(--on-dark)] sm:text-xl">{sub}</p>
          <p className="mt-2 font-[var(--font-display)] text-sm font-semibold tracking-wide text-[var(--lamp-fill)]">
            {proof}
          </p>
        </div>
      </div>
    </section>
  );
}
