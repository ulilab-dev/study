import { Landmark, MapPin, Clock, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-museum-line bg-[#0a0906]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-museum-gold/50 text-museum-gold">
                <Landmark className="h-4 w-4" aria-hidden />
              </span>
              <p className="font-serif text-xl text-museum-ivory">
                Musée <span className="italic text-museum-gold">Lumière</span>
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-museum-muted">
              A digital wing devoted to eight centuries of painting — where
              light curates, and every canvas rewards a closer look.
            </p>
          </div>

          <div className="space-y-3 text-sm text-museum-muted">
            <p className="text-xs uppercase tracking-[0.3em] text-museum-gold">
              Visit
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-museum-gold/70" aria-hidden />
              12 Rue des Lumières, Marais District
            </p>
            <p className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-museum-gold/70" aria-hidden />
              Open in your browser · Tue – Sun · 10:00 – 18:00
            </p>
            <p className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-museum-gold/70" aria-hidden />
              curators@musee-lumiere.example
            </p>
          </div>

          <div className="space-y-3 text-sm text-museum-muted">
            <p className="text-xs uppercase tracking-[0.3em] text-museum-gold">
              The Collection
            </p>
            <ul className="space-y-1.5">
              <li>The Old Masters Hall — 7 works</li>
              <li>The Impressionist Gallery — 4 works</li>
              <li>The Modern Wing — 5 works</li>
              <li>Audio guide — 5 narrated tracks</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-museum-line pt-6 text-xs text-museum-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© MMXXV Musée Lumière — The Digital Wing.</p>
          <p className="italic">
            All artworks are AI-generated compositions for this demonstration
            museum.
          </p>
        </div>
      </div>
    </footer>
  );
}
