"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Headphones,
  Lightbulb,
  LightbulbOff,
  Move3d,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Artwork } from "@/types/museum";

const SLIDE_MS = 7000;

/**
 * Cross-fade spotlight hero.
 * Full-bleed masterpieces cross-fade on a timer; a cursor-following
 * spotlight (radial mask) reveals the painting beneath a dimmed gallery.
 */
export function HeroSpotlight({ artworks }: { artworks: Artwork[] }) {
  const [index, setIndex] = useState(0);
  const [spotlit, setSpotlit] = useState(true);
  const [hovering, setHovering] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── auto cross-fade ────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % artworks.length);
    }, SLIDE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [artworks.length]);

  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(
          () => setIndex((p) => (p + 1) % artworks.length),
          SLIDE_MS,
        );
      }
    },
    [artworks.length],
  );

  // ── cursor-following spotlight ─────────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const setSpot = (x: number, y: number) => {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setSpot(e.clientX - rect.left, e.clientY - rect.top);
      });
    };
    const onLeave = () => {
      // drift the spotlight back to a resting museum-light position
      const rect = el.getBoundingClientRect();
      setSpot(rect.width * 0.5, rect.height * 0.42);
    };

    onLeave();
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (artworks.length === 0) return null;
  const current = artworks[index];

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className="hero-grain relative flex min-h-[100svh] items-center overflow-hidden bg-museum-bg"
      style={{ ["--mx" as string]: "50vw", ["--my" as string]: "42vh" }}
      aria-label="Museum spotlight hero"
    >
      {/* ── cross-fading masterpieces with slow Ken Burns drift ── */}
      {artworks.map((a, i) => (
        <div
          key={a.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={a.imageUrl}
            alt={a.title}
            draggable={false}
            className={`h-full w-full select-none object-cover ${
              i === index ? "kenburns" : ""
            }`}
          />
        </div>
      ))}

      {/* ── spotlight: everything outside the beam falls to darkness ── */}
      {spotlit && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(circle 300px at var(--mx) var(--my), rgba(10,8,5,0.06) 0%, rgba(10,8,5,0.18) 34%, rgba(8,6,4,0.74) 62%, rgba(6,5,3,0.92) 100%)",
          }}
        />
      )}
      {/* warm glow that travels with the beam */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          spotlit ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle 620px at var(--mx) var(--my), rgba(201,162,75,0.14) 0%, rgba(201,162,75,0.05) 40%, transparent 68%)",
        }}
      />
      {/* base legibility scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-museum-bg via-museum-bg/25 to-museum-bg/40" />

      {/* ── copy ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-museum-gold">
          Est. MMXXV — The Digital Wing
        </p>
        <h1 className="mt-6 max-w-4xl font-serif text-5xl font-light leading-[1.05] text-museum-ivory sm:text-6xl lg:text-8xl">
          Where light becomes
          <span className="gold-sheen italic"> the curator</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-museum-muted sm:text-lg">
          Eight centuries of painting under one roof — a Renaissance
          procession, an evening water garden, a field of pure gesture. Move
          your cursor: the gallery follows your light.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-museum-gold text-[#1a1508] hover:bg-museum-gold-soft"
          >
            <a href="#tour">
              <Move3d className="mr-2 h-4 w-4" aria-hidden />
              Enter the 3D galleries
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-museum-line bg-museum-bg/40 text-museum-ivory backdrop-blur-sm hover:border-museum-gold/60 hover:bg-museum-panel/60"
          >
            <a href="#audio">
              <Headphones className="mr-2 h-4 w-4" aria-hidden />
              Start the audio guide
            </a>
          </Button>
        </div>

        {/* spotlight toggle */}
        <button
          type="button"
          onClick={() => setSpotlit((s) => !s)}
          aria-pressed={spotlit}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-museum-line bg-museum-bg/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-museum-muted backdrop-blur-sm transition-colors hover:border-museum-gold/50 hover:text-museum-gold-soft"
        >
          {spotlit ? (
            <Lightbulb className="h-3.5 w-3.5 text-museum-gold" aria-hidden />
          ) : (
            <LightbulbOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {spotlit ? "Spotlight on" : "House lights up"}
        </button>
      </div>

      {/* ── artwork caption + slide indicators ── */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="max-w-md">
            <p className="text-[10px] uppercase tracking-[0.35em] text-museum-gold">
              Now in the beam
            </p>
            <p
              key={current.id}
              className="mt-1 font-serif text-xl text-museum-ivory sm:text-2xl"
            >
              {current.title}
            </p>
            <p className="text-xs text-museum-muted">
              {current.artist} · {current.year}
              {current.heroCaption ? ` · ${current.heroCaption}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3" role="tablist" aria-label="Hero artworks">
            {artworks.map((a, i) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Spotlight ${a.title}`}
                onClick={() => goTo(i)}
                className="group relative h-8 w-12 overflow-hidden rounded-sm border transition-all"
              >
                <img
                  src={a.imageUrl}
                  alt=""
                  className={`h-full w-full object-cover transition-opacity ${
                    i === index ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                  }`}
                />
                {i === index && (
                  <span
                    key={`p-${index}`}
                    className={`absolute bottom-0 left-0 h-0.5 bg-museum-gold ${
                      hovering ? "" : "animate-[ml-hero-progress_7s_linear_forwards]"
                    }`}
                    style={hovering ? { width: "100%" } : undefined}
                  />
                )}
                <span
                  className={`absolute inset-0 border transition-colors ${
                    i === index
                      ? "border-museum-gold"
                      : "border-transparent group-hover:border-museum-gold/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-none flex justify-center pb-4">
          <a
            href="#intro"
            aria-label="Scroll to introduction"
            className="pointer-events-auto flex flex-col items-center gap-1 text-museum-muted transition-colors hover:text-museum-gold-soft"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Stroll down</span>
            <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden />
          </a>
        </div>
      </div>

      <style>{`
        @keyframes ml-hero-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
