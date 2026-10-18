'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Genre } from '@/types/museum';

/* ------------------------------------------------------------------ */
/* Local constants & helpers                                           */
/* ------------------------------------------------------------------ */

/** Distance in px a pointer must travel before a gesture counts as a drag. */
const DRAG_THRESHOLD = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* ------------------------------------------------------------------ */
/* Local section heading (kept local to avoid cross-imports)           */
/* ------------------------------------------------------------------ */

function SectionHeading({ overline, title, lede }: { overline: string; title: string; lede: string }) {
  return (
    <div className="mb-10 flex flex-col gap-3 sm:mb-14 sm:gap-4">
      <p className="text-xs uppercase tracking-[0.35em] text-museum-gold">{overline}</p>
      <h2 className="font-serif text-3xl text-museum-ivory sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="max-w-2xl text-sm text-museum-muted sm:text-base">{lede}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GenreTimeline                                                       */
/* ------------------------------------------------------------------ */

/**
 * "03 — Movements / A Stroll Through Time"
 * A drag-to-scroll, wheel-to-scroll horizontal timeline of art movements.
 * The big readout above the scroller tracks whichever card is nearest
 * the centre of the viewport (rAF-throttled).
 */
export function GenreTimeline({ genres }: { genres: Genre[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(-1);
  const progressRef = useRef(-1);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, pointerId: -1 });
  const draggedRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const activeGenre = genres.length > 0 ? genres[clamp(activeIndex, 0, genres.length - 1)] : undefined;

  /* ---------------- measurement (rAF-throttled) ---------------- */

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollerCenter = el.getBoundingClientRect().left + el.clientWidth / 2;

    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < cardRefs.current.length; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - scrollerCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActiveIndex(best);
    }

    const max = el.scrollWidth - el.clientWidth;
    const next = max > 0 ? clamp(el.scrollLeft / max, 0, 1) : 0;
    if (Math.abs(next - progressRef.current) > 0.0005) {
      progressRef.current = next;
      setProgress(next);
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  /* Initial measurement (deferred to the next frame), plus re-measurement on resize. */
  useEffect(() => {
    scheduleMeasure();
    const onResize = () => scheduleMeasure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
    };
  }, [measure, scheduleMeasure]);

  /* Vertical wheel scrolls horizontally (non-passive native listener). */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const delta = event.deltaY + event.deltaX;
      if (delta === 0) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;
      /* Let the page scroll once the timeline is pinned at an edge. */
      if ((delta > 0 && atEnd) || (delta < 0 && atStart)) return;
      event.preventDefault();
      el.scrollLeft += delta;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [genres.length]);

  /* ---------------- drag to scroll (mouse / pen) ---------------- */

  /** Smoothly settle onto the card nearest the centre, then re-enable CSS snap. */
  const settleToNearest = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollerCenter = el.getBoundingClientRect().left + el.clientWidth / 2;

    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < cardRefs.current.length; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - scrollerCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }

    const card = cardRefs.current[best];
    if (!card) {
      el.style.scrollSnapType = '';
      return;
    }
    const rect = card.getBoundingClientRect();
    const target = el.scrollLeft + (rect.left + rect.width / 2) - scrollerCenter;
    el.scrollTo({ left: target, behavior: 'smooth' });

    if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = '';
    }, 400);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || event.pointerType !== 'mouse' || event.button !== 0) return;
    dragRef.current = { active: true, startX: event.clientX, startScrollLeft: el.scrollLeft, pointerId: event.pointerId };
    draggedRef.current = false;
    /* Snap fights programmatic scrollLeft — off during the gesture. */
    el.style.scrollSnapType = 'none';
    el.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    const dx = event.clientX - drag.startX;
    if (!draggedRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      draggedRef.current = true;
    }
    el.scrollLeft = drag.startScrollLeft - dx;
  };

  const releaseDrag = (settle: boolean) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;
    drag.active = false;
    if (drag.pointerId !== -1) {
      try {
        el.releasePointerCapture(drag.pointerId);
      } catch {
        /* capture was already released */
      }
    }
    if (settle) {
      settleToNearest();
    } else {
      el.style.scrollSnapType = '';
    }
  };

  const handlePointerUp = () => releaseDrag(true);
  const handlePointerCancel = () => releaseDrag(false);

  /* Swallow clicks that were really drags. */
  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
    if (draggedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      draggedRef.current = false;
    }
  };

  /* ---------------- programmatic navigation ---------------- */

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= cardRefs.current.length) return;
    cardRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  /* One card per click (~340px at the sm+ card width), landing on a snap point. */
  const nudge = (direction: 1 | -1) => {
    scrollToIndex(clamp(activeIndex + direction, 0, genres.length - 1));
  };

  /* ---------------- render ---------------- */

  return (
    <section id="timeline" className="relative border-t border-museum-line bg-museum-bg py-16 sm:py-24">
      <style>{`
        @keyframes tl-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          overline="03 — Movements"
          title="A Stroll Through Time"
          lede="Eight movements across six centuries. Drag, scroll, or simply stroll — the centuries unfold at your pace, one gilded frame at a time."
        />

        {!activeGenre ? (
          <p className="rounded-md border border-museum-line bg-museum-panel p-8 text-center text-sm text-museum-muted">
            The timeline is being curated — movements will arrive shortly.
          </p>
        ) : (
          <>
            {/* Big readout — follows the card nearest the centre */}
            <div aria-live="polite" className="mb-8 min-h-[128px] sm:min-h-[160px]">
              <div key={activeGenre.id} style={{ animation: 'tl-fade-up 450ms ease-out both' }}>
                <p className="text-xs uppercase tracking-[0.35em] text-museum-gold">{activeGenre.period}</p>
                <p className="mt-3 font-serif text-4xl text-museum-ivory sm:text-5xl lg:text-6xl">{activeGenre.name}</p>
                <p className="mt-3 line-clamp-2 max-w-xl text-sm text-museum-muted sm:text-base">{activeGenre.description}</p>
              </div>
            </div>

            {/* Horizontal scroller */}
            <div
              ref={scrollerRef}
              onScroll={scheduleMeasure}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onClickCapture={handleClickCapture}
              role="region"
              aria-label="Art movements timeline"
              tabIndex={0}
              className="flex cursor-grab snap-x snap-mandatory select-none gap-5 overflow-x-auto px-[calc(50%_-_140px)] pt-2 pb-2 outline-none focus-visible:ring-1 focus-visible:ring-museum-gold/50 active:cursor-grabbing [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] sm:px-[calc(50%_-_160px)]"
            >
              {genres.map((genre, index) => {
                const isActive = index === activeIndex;
                return (
                  <article
                    key={genre.id}
                    ref={(element) => {
                      cardRefs.current[index] = element;
                    }}
                    aria-label={`${genre.name}, ${genre.period}`}
                    className={`group flex w-[280px] shrink-0 snap-center flex-col overflow-hidden rounded-md border bg-museum-panel transition-[border-color,background-color,box-shadow,transform] duration-300 sm:w-[320px] ${
                      isActive
                        ? 'scale-[1.02] border-museum-gold/60 bg-museum-panel2 shadow-xl shadow-black/30'
                        : 'border-museum-line hover:border-museum-muted/50'
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={genre.imageUrl}
                        alt={`Representative work of the ${genre.name} movement`}
                        draggable={false}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-museum-panel via-transparent to-transparent opacity-80"
                      />
                      <span
                        aria-hidden
                        className="absolute left-4 top-4 rounded-full border border-museum-line bg-museum-bg/70 px-2 py-0.5 font-serif text-xs text-museum-gold backdrop-blur-sm"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-serif text-lg text-museum-gold/40">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-xs tracking-wide text-museum-gold">{genre.period}</span>
                      </div>
                      <h3 className="font-serif text-xl text-museum-ivory">{genre.name}</h3>
                      <p className="text-sm leading-relaxed text-museum-muted">{genre.description}</p>
                      <div className="mt-auto flex items-center gap-2 border-t border-museum-line pt-3">
                        <Users className="size-3.5 shrink-0 text-museum-gold/60" aria-hidden />
                        <span className="text-xs text-museum-muted">{genre.keyArtists}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Timeline dots */}
            <div className="relative mt-6">
              <div aria-hidden className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-museum-line" />
              <div className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                {genres.map((genre, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => scrollToIndex(index)}
                      aria-label={`Show ${genre.name}`}
                      aria-current={isActive}
                      className="rounded-full p-1.5 outline-none focus-visible:ring-1 focus-visible:ring-museum-gold/60"
                    >
                      <span
                        className={`block h-2 w-2 rounded-full ring-4 ring-museum-bg transition-all duration-300 ${
                          isActive
                            ? 'scale-125 bg-museum-gold shadow-[0_0_10px_rgba(201,162,75,0.7)]'
                            : 'bg-museum-muted/50 hover:bg-museum-gold/70'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls: prev/next, progress rail, counter */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => nudge(-1)}
                  disabled={progress <= 0.0005}
                  aria-label="Previous movement"
                  className="border-museum-line bg-museum-panel text-museum-ivory hover:border-museum-gold/40 hover:bg-museum-panel2 hover:text-museum-gold dark:border-museum-line dark:bg-museum-panel dark:hover:bg-museum-panel2"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => nudge(1)}
                  disabled={progress >= 0.9995}
                  aria-label="Next movement"
                  className="border-museum-line bg-museum-panel text-museum-ivory hover:border-museum-gold/40 hover:bg-museum-panel2 hover:text-museum-gold dark:border-museum-line dark:bg-museum-panel dark:hover:bg-museum-panel2"
                >
                  <ChevronRight />
                </Button>
              </div>

              <div
                className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-museum-line"
                role="progressbar"
                aria-label="Timeline scroll progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div
                  className="h-full rounded-full bg-museum-gold transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>

              <span className="shrink-0 rounded-full border border-museum-line bg-museum-panel px-3 py-1 text-xs tabular-nums text-museum-muted">
                {clamp(activeIndex + 1, 1, genres.length)} / {genres.length}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
