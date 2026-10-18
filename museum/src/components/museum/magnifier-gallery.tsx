'use client';

import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Crosshair, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Artwork } from '@/types/museum';

/* ------------------------------------------------------------------ */
/* Local constants & helpers                                           */
/* ------------------------------------------------------------------ */

/** Diameter of the magnifying lens in px (matches w-44 h-44). */
const LENS_SIZE = 176;
const ZOOM_LEVELS = [2, 4, 8] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

interface LensState {
  /** Cursor position relative to the stage, in px. */
  x: number;
  y: number;
  /** Stage dimensions measured at the time of the last pointer event. */
  w: number;
  h: number;
}

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
/* MagnifierGallery                                                    */
/* ------------------------------------------------------------------ */

/**
 * "02 — The Masterpiece / Under the Lens"
 * A follow-cursor magnifying lens suspended over the selected painting.
 */
export function MagnifierGallery({ artworks }: { artworks: Artwork[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState<ZoomLevel>(4);
  const [lens, setLens] = useState<LensState | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const active = artworks.length > 0 ? artworks[Math.min(selectedIndex, artworks.length - 1)] : undefined;

  /**
   * The stage rect is re-measured on every pointer event, so the lens math
   * can never go stale on window resize or layout shifts.
   */
  const updateLens = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    setLens({ x, y, w: rect.width, h: rect.height });
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => updateLens(event.clientX, event.clientY);
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => updateLens(event.clientX, event.clientY);
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => updateLens(event.clientX, event.clientY);
  const handlePointerLeave = () => setLens(null);

  /* Zoomed background math — clamped so the lens never drifts off the canvas. */
  let backgroundSize = 'auto';
  let backgroundPosition = 'center';
  if (lens && active) {
    const zoomedW = lens.w * zoom;
    const zoomedH = lens.h * zoom;
    const rawX = lens.x * zoom - LENS_SIZE / 2;
    const rawY = lens.y * zoom - LENS_SIZE / 2;
    const offsetX = zoomedW > LENS_SIZE ? clamp(rawX, 0, zoomedW - LENS_SIZE) : (zoomedW - LENS_SIZE) / 2;
    const offsetY = zoomedH > LENS_SIZE ? clamp(rawY, 0, zoomedH - LENS_SIZE) : (zoomedH - LENS_SIZE) / 2;
    backgroundSize = `${zoomedW}px ${zoomedH}px`;
    backgroundPosition = `${-offsetX}px ${-offsetY}px`;
  }

  return (
    <section id="masterpiece" className="relative border-t border-museum-line bg-museum-bg py-16 sm:py-24">
      <style>{`
        @keyframes ml-lens-in {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          overline="02 — The Masterpiece"
          title="Under the Lens"
          lede="Lean in. Slide the glass across the canvas and let the brushwork confess its secrets — every craquelure, every glaze, every deliberate stroke."
        />

        {!active ? (
          <p className="rounded-md border border-museum-line bg-museum-panel p-8 text-center text-sm text-museum-muted">
            No artworks are currently on display in this room.
          </p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Main column: stage + caption. Stage above the strip on mobile, right of the rail on lg. */}
            <figure className="order-1 min-w-0 flex-1 lg:order-2">
              <div
                ref={stageRef}
                onPointerEnter={handlePointerEnter}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerLeave={handlePointerLeave}
                className="relative aspect-[7/4] cursor-crosshair touch-none select-none overflow-hidden rounded-md border border-museum-line bg-museum-panel"
              >
                <img
                  src={active.imageUrl}
                  alt={`${active.title} by ${active.artist}, ${active.year}`}
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />

                {/* Gallery vignette */}
                <div aria-hidden className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]" />

                {/* Magnification badge */}
                <Badge
                  variant="outline"
                  className="absolute left-3 top-3 z-10 border-museum-line bg-museum-bg/85 text-museum-gold backdrop-blur-sm"
                >
                  Magnifier · {zoom}×
                </Badge>

                {/* Zoom segmented control */}
                <div
                  role="group"
                  aria-label="Lens magnification"
                  className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-museum-line bg-museum-bg/85 p-1 backdrop-blur-sm"
                >
                  {ZOOM_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setZoom(level)}
                      aria-pressed={zoom === level}
                      className={`h-7 w-9 rounded text-xs font-medium tabular-nums transition-colors ${
                        zoom === level ? 'bg-museum-gold text-museum-bg' : 'text-museum-muted hover:bg-museum-panel2 hover:text-museum-ivory'
                      }`}
                    >
                      {level}×
                    </button>
                  ))}
                </div>

                {/* Idle hint */}
                {!lens && (
                  <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                    <div className="flex items-center gap-2 rounded-full border border-museum-line bg-museum-bg/85 px-4 py-2 text-xs text-museum-muted backdrop-blur-sm">
                      <Search className="size-3.5 text-museum-gold" aria-hidden />
                      <span>Hover to inspect — follow-cursor lens</span>
                    </div>
                  </div>
                )}

                {/* Crosshair readout */}
                {lens && (
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-md border border-museum-line bg-museum-bg/85 px-2.5 py-1.5 text-xs tabular-nums text-museum-gold backdrop-blur-sm">
                    <Crosshair className="size-3" aria-hidden />
                    <span>
                      {Math.round((lens.x / lens.w) * 100)}% · {Math.round((lens.y / lens.h) * 100)}%
                    </span>
                  </div>
                )}

                {/* The lens — its centre follows the cursor */}
                {lens && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute z-20"
                    style={{
                      left: lens.x - LENS_SIZE / 2,
                      top: lens.y - LENS_SIZE / 2,
                      width: LENS_SIZE,
                      height: LENS_SIZE,
                      animation: 'ml-lens-in 160ms ease-out',
                    }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-full shadow-2xl shadow-black/70 ring-2 ring-museum-gold">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundImage: `url(${active.imageUrl})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize,
                          backgroundPosition,
                        }}
                      />
                      {/* Glass tint & vignette */}
                      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_55%,rgba(14,12,9,0.45))]" />
                      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-museum-gold/30" />
                    </div>
                  </div>
                )}
              </div>

              <figcaption className="mt-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <h3 className="font-serif text-2xl text-museum-ivory">{active.title}</h3>
                  {active.genreName ? (
                    <Badge variant="outline" className="border-museum-line bg-transparent text-museum-gold">
                      {active.genreName}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-museum-muted">
                  {active.artist} · {active.year}
                </p>
                <p className="max-w-3xl text-sm leading-relaxed text-museum-muted">{active.description}</p>
              </figcaption>
            </figure>

            {/* Thumbnails: horizontal strip on mobile, left rail on lg */}
            <div
              role="group"
              aria-label="Select an artwork to inspect"
              className="order-2 flex shrink-0 snap-x gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:order-1 lg:w-28 lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1"
            >
              {artworks.map((artwork, index) => {
                const selected = index === selectedIndex;
                return (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-pressed={selected}
                    aria-label={`Inspect ${artwork.title} by ${artwork.artist}`}
                    title={`${artwork.title} — ${artwork.artist}`}
                    className={`relative aspect-[7/4] w-28 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-colors sm:w-32 lg:w-full ${
                      selected ? 'border-museum-gold' : 'border-museum-line hover:border-museum-muted/60'
                    }`}
                  >
                    <img
                      src={artwork.imageUrl}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-opacity ${
                        selected ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
