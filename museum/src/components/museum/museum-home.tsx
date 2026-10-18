"use client";

import { useEffect, useState } from "react";
import {
  AudioLines,
  Frame,
  History,
  Map as MapIcon,
  Landmark,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MuseumData } from "@/types/museum";
import { SiteHeader } from "@/components/museum/site-header";
import { SiteFooter } from "@/components/museum/site-footer";
import { HeroSpotlight } from "@/components/museum/hero-spotlight";
import { MagnifierGallery } from "@/components/museum/magnifier-gallery";
import { GenreTimeline } from "@/components/museum/genre-timeline";
import { VirtualTourSection } from "@/components/museum/virtual-tour-section";
import { AudioGuideRings } from "@/components/museum/audio-guide-rings";

export function MuseumHome() {
  const [data, setData] = useState<MuseumData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/museum")
      .then((res) => {
        if (!res.ok) throw new Error(`The archives responded ${res.status}`);
        return res.json() as Promise<MuseumData>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-museum-bg">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-museum-gold/40 text-museum-gold">
            <Landmark className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-serif text-3xl text-museum-ivory">
              The museum is between exhibitions
            </h1>
            <p className="mt-2 max-w-md text-sm text-museum-muted">
              We could not load the collection data: {error}
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setReloadKey((k) => k + 1);
            }}
            variant="outline"
            className="border-museum-gold/40 text-museum-gold hover:bg-museum-gold/10 hover:text-museum-gold-soft"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            Try the doors again
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-museum-bg">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-5">
          <span className="halo flex h-16 w-16 items-center justify-center rounded-full border border-museum-gold/50 text-museum-gold">
            <Landmark className="h-6 w-6" aria-hidden />
          </span>
          <p className="animate-pulse font-serif text-2xl text-museum-ivory">
            Opening the museum…
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-museum-muted">
            Unlocking the galleries
          </p>
        </main>
      </div>
    );
  }

  const heroArtworks = data.artworks.filter((a) => a.isHighlight);
  const featured = data.artworks.filter((a) => a.featured);

  const stats = [
    {
      icon: History,
      value: String(data.genres.length),
      label: "Movements, Byzantium to Abstraction",
    },
    {
      icon: Frame,
      value: String(data.artworks.length),
      label: "Works hanging in three rooms",
    },
    {
      icon: MapIcon,
      value: String(data.rooms.length),
      label: "Galleries to walk in 3D",
    },
    {
      icon: AudioLines,
      value: String(data.audioGuides.length),
      label: "Narrated audio stops",
    },
  ];

  return (
    <>
      <SiteHeader />

      <main>
        <HeroSpotlight artworks={heroArtworks} />

        {/* ── 01 · the museum ── */}
        <section id="intro" className="border-t border-museum-line bg-museum-bg py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-museum-gold">
                  01 — The Museum
                </p>
                <h2 className="mt-3 font-serif text-3xl font-light leading-tight text-museum-ivory sm:text-4xl lg:text-5xl">
                  A small museum that rewards
                  <span className="italic text-museum-gold-soft"> close looking</span>
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-museum-muted sm:text-base">
                  Musée Lumière gathers sixteen compositions spanning the
                  Renaissance to Abstract Expressionism. Come for the spotlight
                  that follows your cursor; stay for the four-times lens, the
                  century-by-century stroll and rooms you can turn around in.
                  The audio guide narrates the rest.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="rounded-md border border-museum-line bg-museum-panel p-4 transition-colors hover:border-museum-gold/40"
                  >
                    <Icon className="h-4 w-4 text-museum-gold" aria-hidden />
                    <dd className="mt-3 font-serif text-3xl text-museum-ivory">
                      {value}
                    </dd>
                    <dt className="mt-1 text-xs leading-snug text-museum-muted">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── 02 · masterpiece + lens ── */}
        <MagnifierGallery artworks={featured} />

        {/* ── 03 · movements timeline ── */}
        <GenreTimeline genres={data.genres} />

        {/* ── 04 · 3D virtual tour ── */}
        <VirtualTourSection rooms={data.rooms} />

        {/* ── 05 · audio guide ── */}
        <AudioGuideRings guides={data.audioGuides} />
      </main>

      <SiteFooter />
    </>
  );
}
