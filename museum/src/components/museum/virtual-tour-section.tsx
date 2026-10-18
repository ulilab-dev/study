"use client";

import dynamic from "next/dynamic";
import { Move, MousePointerClick, ZoomIn } from "lucide-react";
import type { TourRoom } from "@/types/museum";

const VirtualTour = dynamic(
  () => import("./virtual-tour").then((m) => m.VirtualTour),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[62vh] max-h-[720px] min-h-[430px] w-full items-center justify-center rounded-lg border border-museum-line bg-museum-panel">
        <p className="animate-pulse font-serif text-lg text-museum-muted">
          Preparing the galleries…
        </p>
      </div>
    ),
  },
);

const LEGEND = [
  { icon: Move, label: "Drag to look around" },
  { icon: ZoomIn, label: "Scroll to step closer" },
  { icon: MousePointerClick, label: "Click a gold ring to teleport" },
];

export function VirtualTourSection({ rooms }: { rooms: TourRoom[] }) {
  return (
    <section
      id="tour"
      className="relative border-t border-museum-line bg-museum-bg py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-museum-gold">
          04 — The Virtual Tour
        </p>
        <h2 className="mt-3 font-serif text-3xl font-light text-museum-ivory sm:text-4xl lg:text-5xl">
          Walk the rooms in <span className="italic text-museum-gold-soft">three dimensions</span>
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-museum-muted sm:text-base">
          Three galleries rendered in real time: stand at the centre, drag to
          turn your head, and let the glowing rings carry you between halls.
          Every canvas on every wall is clickable — the labels tell its story.
        </p>

        <div className="mt-10">
          <VirtualTour rooms={rooms} />
        </div>

        <ul className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-museum-muted">
          {LEGEND.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-museum-gold/70" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
