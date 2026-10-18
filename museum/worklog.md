# Project Worklog — Musée Lumière (Art History Museum Platform)

Project: Next.js 16 + Tailwind 4 + shadcn/ui + Prisma (SQLite) + Three.js
Goal: Art history museum platform with:
1. Cross-fade spotlight hero (cursor-following spotlight, auto cross-fading masterpieces)
2. Follow-cursor 4x magnifier on masterpiece
3. Horizontal scroll genre timeline (8 movements)
4. Drag-to-look 3D virtual tour with teleport hotspots (Three.js, 3 rooms)
5. Audio-guide circular progress rings (TTS-generated narrations)

Design language (binding for all agents):
- Dark museum aesthetic: bg #0e0c09, panels #16130e, lines #2b251b
- Gold accent #c9a24b (soft #e6c883), ivory text #ece3d0, muted #a2967d
- Display font: Cormorant Garamond (class `font-serif`), body: Geist sans
- Tailwind tokens (defined in globals.css @theme): bg-museum-bg, bg-museum-panel, bg-museum-panel2, border-museum-line, text-museum-gold, text-museum-gold-soft, text-museum-ivory, text-museum-muted
- Section heading pattern: overline `01 — LABEL` (uppercase, tracking, gold, text-xs), big serif title, lede paragraph
- NO blue/indigo colors. Only one page route `/` + API routes.

Data contract: src/types/museum.ts (MuseumData) — served by GET /api/museum.
Assets: public/images/museum/*.png (AI-generated), public/audio/guide-*.mp3 (TTS).

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Project setup, type contract, background asset generation

Work Log:
- Checked environment: Next.js 16 dev server already running on :3000 (pid 1183), healthy.
- Invoked image-generation + TTS skills; read their docs.
- Created worklog.md, src/types/museum.ts (data contract).
- Created scripts/generate-museum-assets.ts: 16 artworks (3 hero 1344x768, 1 magnifier masterpiece 1344x768, 8 genre thumbnails 1024x1024, 4 portraits 864x1152) + 5 TTS audio guides (voice jam, mp3).
- Launched asset generation in background (log: /tmp/museum-assets.log).

Stage Summary:
- Foundation ready; assets generating in background while development proceeds.

---
Task ID: 4-a
Agent: full-stack-developer
Task: Build MagnifierGallery, GenreTimeline, AudioGuideRings components

Work Log:
- Read worklog.md (Task 1 done: types + assets in place) and src/types/museum.ts; verified museum Tailwind tokens are NOT yet in globals.css (another agent owns that file — I only consumed the token names as contracted).
- Checked environment: dev server on :3000 healthy (dev.log clean). Did NOT run the fullstack init script: /home/z/my-project/.zscripts/dev.sh already exists, so the script would spawn a SECOND dev server — violates Task 4-a constraint "do not start any dev server". Environment is already initialized (package.json + node_modules present, server serving GET / 200).
- Created src/components/museum/ dir + magnifier-gallery.tsx: pointer-event follow-cursor lens (176px circle, ring-2 gold, pointer-events-none), stage rect re-measured per pointermove (resize-proof), zoom segmented control 2×/4×/8× (default 4×) + "Magnifier · {zoom}×" Badge, background-position math CLAMPED to image edges (no empty parallax), crosshair % readout chip, idle hint chip with Search icon, thumbnail rail (horizontal strip on mobile via order swap / w-28 left rail on lg), figcaption block with genreName Badge. touch-action none on stage so touch lens works.
- Created genre-timeline.tsx: big serif readout (period gold + name + 2-line description) with key-based tl-fade-up crossfade, min-height reserved to avoid layout jump; rAF-throttled center-detection via getBoundingClientRect of card refs; scroller with snap-x snap-mandatory, px-[calc(50%_-_140px)] / sm:px-[calc(50%_-_160px)] centering padding, hidden native scrollbar; mouse-only drag-to-scroll with pointer capture + snap temporarily disabled via inline style during gesture, then smooth settle-to-nearest-card and snap restored after 400ms; click suppression after >8px drags (onClickCapture + draggedRef); native non-passive wheel listener (deltaY+deltaX) with edge passthrough so page scroll survives at timeline ends; active card highlighted (border-gold/60 + scale-[1.02] + panel2); controls row = shadcn outline icon Buttons (prev/next, disabled at ends, dark: overrides), h-0.5 gold progress bar with role=progressbar, "n / 8" counter chip; clickable dot rail over a hairline (active dot gold, scale-125, glow shadow); keyboard: region tabIndex + arrow-key native scroll + focus-visible ring.
- Created audio-guide-rings.tsx: grid 1/md:2/xl:3; 64px ring player = SVG (r=30, C≈188.5, track #2b251b, gold #c9a24b progress with dashoffset transition, role=progressbar + aria-valuenow) wrapping shadcn ghost icon Button (size-12, rounded-full, Play/Pause fill-current, Loader2 spin while metadata loads); audio elements in useRef<Map<string, HTMLAudioElement>> created lazily (preload=metadata) with one-time loadedmetadata/timeupdate/ended/error listeners; parent-level activeId enforces single-audio (others paused + currentTime reset + UI progress zeroed); manual pause keeps position for resume; ended → rewind + activeId null; onerror/play() rejection → amber "Audio unavailable" chip + disabled button; time display "0:12 / 0:45" with durationLabel fallback; pulsing outer ring (ag-ring-pulse keyframes) + 4 equalizer bars (ag-eq keyframes, staggered phases) while playing; narration in max-h-40 scroll area with thin gold custom scrollbar utilities; artwork thumbnail row when guide.artwork != null; Download MP3 chip (target _blank, rel noopener); pause-all cleanup on unmount.
- Ran eslint on the 3 files: 1 error (react-hooks/set-state-in-effect for synchronous measure() in mount effect) → fixed by deferring initial measurement through the rAF scheduler. Re-run: clean, exit 0.
- Ran bunx tsc --noEmit: fixed 1 error (article ref is HTMLElement, not HTMLDivElement → cardRefs typed Array<HTMLElement | null>). Now zero errors in components/museum (remaining project errors are pre-existing in examples/, scripts/, skills/ owned by other tasks).

Stage Summary:
- Files created: src/components/museum/magnifier-gallery.tsx, src/components/museum/genre-timeline.tsx, src/components/museum/audio-guide-rings.tsx (all 'use client', named exports only, no default exports, self-contained local SectionHeading per file to avoid cross-imports).
- Key decisions: pointer events (not mouse events) for the lens; lens background clamped instead of allowing edge parallax; drag-to-scroll engages for mouse/pen only (touch uses native snap scrolling — avoids fighting the browser); wheel preventDefaults only when the timeline can actually consume the delta; prev/next buttons scroll exactly one card (≈340px at sm+) so they land on snap points; unique keyframe prefixes (ml-/tl-/ag-) to avoid collisions across the three files' local <style> tags; no blue/indigo anywhere (museum tokens + amber warning only).
- Lint status: bunx eslint <3 files> → 0 problems, 0 warnings (exit 0). tsc: 0 errors in src/components/museum.
- Tokens consumed (bg-museum-*, text-museum-*, border-museum-line, font-serif) are defined in globals.css by the theme-owning agent — components render correctly once those @theme tokens land.
- Components are NOT yet wired into page.tsx (out of scope for 4-a); the integration agent imports them and passes MuseumData slices as props.

---
Task ID: 5-9 (main pipeline)
Agent: main (Z.ai Code)
Task: Database, API, design foundation, hero, 3D tour, page assembly

Work Log:
- Prisma schema: Genre, Artwork (wall/position/size for 3D), TourRoom, Hotspot (two named relations), AudioGuide. db:push + seed (8 genres, 16 artworks, 3 rooms, 6 hotspots, 5 guides).
- API route GET /api/museum returning full typed dataset (verified via curl).
- layout.tsx: Cormorant Garamond display font + museum metadata.
- globals.css: museum palette @theme tokens (bg/panel/panel2/line/gold/gold-soft/ivory/muted), gold scrollbar, kenburns/halo keyframes, grain overlay.
- site-header (sticky, blur on scroll, mobile Sheet menu) + site-footer (mt-auto sticky-footer pattern).
- hero-spotlight: 7s auto cross-fade w/ 1.8s opacity transitions, Ken Burns drift, cursor-following radial spotlight + warm glow (CSS vars --mx/--my via rAF), spotlight on/off toggle, thumbnail tabs with progress bar, artwork caption.
- virtual-tour (three.js): 3 rooms at x-offsets 0/40/80, plank-floor CanvasTexture, framed artworks w/ picture SpotLights + wall label sprites, pulsing teleport hotspot sprites (canvas ring+chevron+label textures), drag-to-look (yaw/pitch clamp, smooth lerp), wheel FOV zoom 38-78, raycast hover (gold emissive) + click (artwork info panel), teleport fade transition w/ FOV warp, dust motes, ResizeObserver, full disposal on unmount.
- museum-home: fetch /api/museum, loading + error states, stats strip; page.tsx shell (min-h-screen flex-col).
- FIXED: subagent's section IDs (#movements→#timeline, #audio-guide→#audio) to match header links.
- FIXED: critical stale-CSS issue — Turbopack served pre-rewrite globals.css; cleared .next + restarted dev server (double-fork setsid pattern to survive sandbox bash recycling).
- All 16 AI artworks generated (public/images/museum/).

Stage Summary:
- Full site functional & visually verified via agent-browser + VLM (hero, lens, timeline, 3D rooms, teleport, audio cards).
- DEV SERVER NOTE: must be launched with double-fork: `( setsid bun run dev < /dev/null > /tmp/dev-outer.log 2>&1 & )` — plain background jobs get reaped when the sandbox recycles the bash session.
- OPEN: 5 TTS audio files blocked by 429 rate limit on TTS endpoint (retrying).

---
Task ID: 11-12 (verification + audio)
Agent: main (Z.ai Code)
Task: E2E verification, TTS audio completion, final polish

Work Log:
- E2E verified via agent-browser + VLM (z-ai vision): hero (cross-fade, cursor spotlight --mx/--my tracking, tab clicks, spotlight toggle), magnifier (lens on hover, 2×/4×/8× bgSize math verified, crosshair readout), timeline (next/prev, active readout tracks cards, 8 movements), 3D tour (WebGL renders rooms/paintings/labels/spotlights; drag-to-look; wheel FOV zoom; artwork click → info panel; hotspot ring click → teleport; room chips; reset view), audio guide (play/pause, real WAV playback with advancing time 0:24→0:28, ring circumference 188.5, single-audio exclusivity, graceful error state).
- Generated 5 TTS narrations (voice "jam") as WAV after TTS rate-limit cleared; MP3 format rejected by endpoint (code 1214) → switched to WAV + updated seed audioUrls + real duration labels (0:49–0:55).
- Fixed drag-to-look yaw sign to grab-the-world convention (drag right → look left).
- Fixed stale Turbopack CSS cache (root cause of "near-black text" bug): rm -rf .next + dev server restart via double-fork.
- Final state: eslint 0 errors; 16 images + 5 WAVs served (200); GET / and /api/museum 200; no runtime errors in dev.log; mobile 390px no horizontal overflow; footer sticks via min-h-screen flex-col + mt-auto.

Stage Summary:
- Musée Lumière complete and browser-verified end-to-end. All 5 requested features working:
  1. Cross-fade spotlight hero  2. Follow-cursor 4× magnifier  3. Horizontal genre timeline  4. Drag-to-look 3D tour w/ teleport hotspots  5. Audio-guide circular progress rings.
