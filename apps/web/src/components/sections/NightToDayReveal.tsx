"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// How many viewport-heights of scroll the night->day transition takes.
// Longer = more scroll per frame of video, i.e. a slower, more deliberate scrub.
const SCROLL_LENGTH_VH = 300;

/**
 * Pins the house's facade full-screen while the visitor scrolls through it;
 * the video's playback position is driven directly by scroll progress
 * (not autoplay) so it reads as night turning to day exactly as you scroll,
 * then releases into the next section once the transition completes.
 *
 * The scrubbed target time is eased toward rather than snapped to on every
 * scroll tick — combined with the source video being re-encoded with a
 * short keyframe interval (see apps/web/public/videos), this is what
 * keeps the scrub feeling continuous instead of jumping between frames.
 */
export function NightToDayReveal() {
  const { lang } = useLanguage();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);

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
      if (captionRef.current) {
        captionRef.current.style.opacity = targetProgress > 0.82 ? String((targetProgress - 0.82) / 0.18) : "0";
      }
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

  return (
    <div ref={wrapperRef} className="relative" style={{ height: `${SCROLL_LENGTH_VH}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/casa-randa-noche-dia.mp4"
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)]/50 via-transparent to-transparent" />
        <p
          ref={captionRef}
          className="absolute inset-x-0 bottom-12 px-6 text-center font-[var(--font-display)] text-sm tracking-[0.14em] text-[var(--on-dark)] uppercase opacity-0"
        >
          {lang === "es" ? "Diablo Heights, a cualquier hora del día" : "Diablo Heights, any time of day"}
        </p>
      </div>
    </div>
  );
}
