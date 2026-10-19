"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  title?: string;
  caption?: string;
};

interface Props {
  images: LightboxImage[];
  label?: string;
  /** Minimum column width in px; at least two columns. Default 150. */
  minColumnWidth?: number;
  /** Gap between photos in px. Default 8. */
  gap?: number;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 360, damping: 34, mass: 1 } as const;

/* Slide variants: enter/exit slide from the navigation direction */
const slideVariants = {
  enter: (d: number) => ({ x: d === 0 ? 0 : d * 48, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d === 0 ? 0 : d * -48, opacity: 0, scale: 0.97 }),
};

export function LightboxGallery({
  images,
  label = "Photo gallery",
  minColumnWidth = 150,
  gap = 8,
  className,
}: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [dir, setDir] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isOpen = active !== null;

  const openAt = useCallback((i: number) => {
    setDir(0);
    setActive(i);
  }, []);

  const close = useCallback(() => {
    const last = active;
    setActive(null);
    setTimeout(() => last !== null && btnRefs.current[last]?.focus(), 60);
  }, [active]);

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setActive((i) =>
        i === null ? 0 : Math.max(0, Math.min(images.length - 1, i + delta)),
      );
    },
    [images.length],
  );

  /* keyboard shortcuts while open */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, go]);

  /* lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* ── masonry grid ── */}
      <div
        role="region"
        aria-label={label}
        className={className}
        style={{ columns: `${minColumnWidth}px`, columnGap: gap } as CSSProperties}
      >
        {images.map((img, i) => (
          <button
            key={img.src}
            ref={(el) => { btnRefs.current[i] = el; }}
            type="button"
            aria-label={`Abrir ${img.alt}, foto ${i + 1} de ${images.length}`}
            onClick={() => openAt(i)}
            className="relative block w-full overflow-hidden rounded-xl
              cursor-zoom-in focus-visible:outline-2
              focus-visible:outline-[var(--caoba)] focus-visible:outline-offset-2"
            style={{ marginBottom: gap, breakInside: "avoid", display: "block" }}
          >
            <Image
              src={img.src}
              width={img.width}
              height={img.height}
              alt={img.alt}
              className="w-full h-auto block transition-transform duration-500 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* ── lightbox viewer ── */}
      <AnimatePresence>
        {active !== null && (
          <Viewer
            images={images}
            index={active}
            dir={dir}
            onGo={go}
            onClose={close}
            label={label}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Viewer ──────────────────────────────────────────────────────────────── */
function Viewer({
  images,
  index,
  dir,
  onGo,
  onClose,
  label,
}: {
  images: LightboxImage[];
  index: number;
  dir: number;
  onGo: (delta: number) => void;
  onClose: () => void;
  label: string;
}) {
  const img = images[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  /* trap focus on open */
  useEffect(() => { closeRef.current?.focus(); }, []);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    /* drag-down to close */
    if (offset.y > 80 || velocity.y > 400) { onClose(); return; }
    /* swipe left/right to navigate */
    if (Math.abs(offset.x) > 60 || Math.abs(velocity.x) > 350) {
      onGo(offset.x < 0 ? 1 : -1);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/92 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* photo — animates per slide change, draggable for swipe+dismiss */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={{ top: 0.08, bottom: 0.18, left: 0.08, right: 0.08 }}
          onDragEnd={handleDragEnd}
          className="relative z-10 select-none"
          style={{ touchAction: "none" }}
        >
          <Image
            src={img.src}
            width={img.width}
            height={img.height}
            alt={img.alt}
            priority
            className="max-w-[92vw] max-h-[82vh] w-auto h-auto rounded-xl shadow-2xl"
            draggable={false}
          />
          {(img.title || img.caption) && (
            <div className="mt-3 text-center">
              {img.title && (
                <p className="text-white/90 font-semibold text-sm">{img.title}</p>
              )}
              {img.caption && (
                <p className="text-white/50 text-xs mt-0.5">{img.caption}</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* close */}
      <button
        ref={closeRef}
        type="button"
        aria-label="Cerrar galería"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 grid h-10 w-10 place-items-center
          rounded-full bg-white/10 text-white transition hover:bg-white/20
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <X size={18} strokeWidth={2.5} />
      </button>

      {/* prev */}
      {index > 0 && (
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => onGo(-1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10
            place-items-center rounded-full bg-white/10 text-white transition
            hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-white/60 max-sm:hidden"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* next */}
      {index < images.length - 1 && (
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => onGo(1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10
            place-items-center rounded-full bg-white/10 text-white transition
            hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-white/60 max-sm:hidden"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* counter */}
      <p
        aria-live="polite"
        aria-atomic
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/50 text-xs tabular-nums"
      >
        {index + 1} / {images.length}
      </p>
    </motion.div>
  );
}
