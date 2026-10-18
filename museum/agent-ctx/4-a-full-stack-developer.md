# Agent Work Record — Task 4-a

- Task ID: 4-a
- Agent: full-stack-developer
- Date: 2025 (session)
- Component: src/components/museum/* (MagnifierGallery, GenreTimeline, AudioGuideRings)

NOTE: The canonical root path `/agent-ctx` is not writable in this sandbox (permission denied,
root-owned). This project-local `agent-ctx/` folder is the fallback location for cross-agent
work records. The full task log was ALSO appended to /home/z/my-project/worklog.md.

## What this agent did

Read context: /home/z/my-project/worklog.md (Task 1: types + assets done) and
src/types/museum.ts (Artwork / Genre / AudioGuideItem contracts). Verified:
- Dev server on :3000 already healthy (dev.log: GET / 200) — I did NOT start or restart it.
- Museum Tailwind tokens were NOT yet in globals.css at time of writing (theme is owned by
  another agent). I only *consumed* the token names (bg-museum-bg/panel/panel2,
  border-museum-line, text-museum-gold/gold-soft/ivory/muted, font-serif) per contract.
- Did NOT run the fullstack init script: it would have launched a second dev server via
  .zscripts/dev.sh, violating the "do not start any dev server" constraint. Environment was
  already initialized (package.json + node_modules + running server).

## Files created (only these 3; nothing else touched)

1. src/components/museum/magnifier-gallery.tsx — `MagnifierGallery({ artworks })`
   - 'use client', named export. Section id="masterpiece", overline "02 — The Masterpiece".
   - Follow-cursor lens: pointer events (touch works, stage has touch-action:none), 176px
     circle, ring-2 ring-museum-gold, pointer-events-none, lens-in keyframe animation.
   - Zoom segmented control 2×/4×/8× (default 4×) + Badge "Magnifier · {zoom}×".
   - Lens background-position CLAMPED to image edges (no empty-space parallax);
     getBoundingClientRect re-read every pointermove → resize-proof.
   - Crosshair % readout chip (bottom-left), idle hint chip with Search icon when not hovering.
   - Thumbnails: horizontal strip below stage on mobile, w-28 left rail on lg (order swap);
     selected = border-2 border-museum-gold. Caption block with genreName Badge.

2. src/components/museum/genre-timeline.tsx — `GenreTimeline({ genres })`
   - 'use client', named export. Section id="movements", overline "03 — Movements".
   - Big serif readout (period gold, name ivory, 2-line description) crossfades via
     key-remount + tl-fade-up keyframes; min-height reserved against layout jump.
   - rAF-throttled nearest-card-to-center detection (getBoundingClientRect on card refs).
   - Scroller: snap-x snap-mandatory, hidden scrollbar, centering paddings
     px-[calc(50%_-_140px)] / sm:px-[calc(50%_-_160px)], cursor-grab/grabbing.
   - Drag-to-scroll (mouse/pen only; touch uses native snap scrolling): pointer capture,
     snap disabled via inline style during gesture, smooth settle to nearest card on release,
     snap restored after 400ms. Click suppression after >8px drags (onClickCapture).
   - Wheel: native non-passive listener, scrollLeft += deltaY + deltaX, preventDefault only
     when the timeline can consume the delta (page scroll survives at the ends).
   - Controls: shadcn outline icon Buttons prev/next (scroll exactly one card ≈340px so they
     land on snap points; disabled at ends), h-0.5 gold progress bar (role=progressbar),
     "n / 8" counter chip. Dot rail over hairline; dots scrollIntoView inline:center.

3. src/components/museum/audio-guide-rings.tsx — `AudioGuideRings({ guides })`
   - 'use client', named export. Section id="audio-guide", overline "05 — Audio Guide".
   - Grid 1 / md:2 / xl:3. 64px ring player: SVG r=30, C≈188.5, track #2b251b, gold progress
     (strokeDashoffset, role=progressbar + aria-valuenow), shadcn ghost icon Button size-12
     rounded-full with Play/Pause (fill-current) or Loader2 spin while metadata loads.
   - Audio objects: useRef<Map<string, HTMLAudioElement>>, created lazily (preload=metadata),
     one-time listeners (loadedmetadata / timeupdate / ended / error). Unmount pauses all.
   - Single-audio policy via parent activeId: switching pauses + rewinds others and zeroes
     their UI progress; manual pause keeps position for resume; ended rewinds + clears activeId.
   - Error path (onerror or play() rejection): amber "Audio unavailable" chip, disabled button.
   - Time display "0:12 / 0:45" with durationLabel fallback; pulsing ring + 4 equalizer bars
     (ag-eq / ag-ring-pulse keyframes, unique prefixes to avoid cross-file collisions).
   - Narration: max-h-40 overflow-y-auto with thin gold custom scrollbar utilities.
   - Artwork thumbnail row when guide.artwork != null; Download MP3 chip (target _blank).

## Verification

- `bunx eslint src/components/museum/{magnifier-gallery,genre-timeline,audio-guide-rings}.tsx`
  → 0 problems, 0 warnings (fixed one react-hooks/set-state-in-effect by deferring the
  initial timeline measurement into the rAF scheduler).
- `bunx tsc --noEmit` → 0 errors in src/components/museum (fixed article ref typing:
  Array<HTMLElement | null>). Remaining project errors are pre-existing in examples/,
  scripts/, skills/ (owned by other tasks; eslint ignores those paths).

## Handoff notes for the next agent (integration)

- Import and render these on `/` with the matching MuseumData slices:
  `<MagnifierGallery artworks={data.artworks.filter(a => a.featured)} />`
  `<GenreTimeline genres={data.genres} />`
  `<AudioGuideRings guides={data.audioGuides} />`
  (genres / audioGuides must be pre-sorted by sortOrder, as the contract states).
- Sections expect the museum tokens in globals.css @theme plus font-serif → Cormorant
  Garamond; they render unstyled-but-functional until those land.
- I did NOT modify page.tsx / layout.tsx / globals.css / prisma / API files (out of 4-a scope).
