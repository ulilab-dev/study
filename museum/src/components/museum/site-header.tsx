"use client";

import { useEffect, useState } from "react";
import { Landmark, Menu, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const LINKS = [
  { href: "#masterpiece", label: "Masterpiece" },
  { href: "#timeline", label: "Movements" },
  { href: "#tour", label: "Virtual Tour" },
  { href: "#audio", label: "Audio Guide" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-museum-line bg-museum-bg/90 backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="group flex items-center gap-3"
          aria-label="Musée Lumière — back to top"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-museum-gold/50 text-museum-gold transition-colors group-hover:border-museum-gold group-hover:text-museum-gold-soft">
            <Landmark className="h-4 w-4" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg tracking-wide text-museum-ivory">
              Musée <span className="italic text-museum-gold">Lumière</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-museum-muted">
              Gallery of Light
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs font-medium uppercase tracking-[0.22em] text-museum-muted transition-colors hover:text-museum-gold-soft"
            >
              {l.label}
            </a>
          ))}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-museum-gold/40 bg-transparent text-museum-gold hover:border-museum-gold hover:bg-museum-gold/10 hover:text-museum-gold-soft"
          >
            <a href="#audio">
              <Headphones className="mr-2 h-3.5 w-3.5" aria-hidden />
              Take the tour
            </a>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Open menu"
              className="border-museum-line bg-museum-panel text-museum-ivory"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72 border-museum-line bg-museum-bg/95 backdrop-blur-md"
          >
            <SheetTitle className="font-serif text-xl text-museum-ivory">
              Musée <span className="italic text-museum-gold">Lumière</span>
            </SheetTitle>
            <nav className="mt-8 flex flex-col gap-2" aria-label="Mobile">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-3 text-sm uppercase tracking-[0.2em] text-museum-muted transition-colors hover:bg-museum-panel hover:text-museum-gold-soft"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
