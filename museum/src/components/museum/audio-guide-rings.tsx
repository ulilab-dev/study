'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, Mic, Pause, Play, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AudioGuideItem } from '@/types/museum';

/* ------------------------------------------------------------------ */
/* Local constants & helpers                                           */
/* ------------------------------------------------------------------ */

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 188.5

interface PlayerState {
  progress: number;
  currentTime: number;
  duration: number | null;
  loading: boolean;
  error: boolean;
}

const INITIAL_PLAYER_STATE: PlayerState = {
  progress: 0,
  currentTime: 0,
  duration: null,
  loading: false,
  error: false,
};

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
/* GuideCard (module-private)                                          */
/* ------------------------------------------------------------------ */

interface GuideCardProps {
  guide: AudioGuideItem;
  isActive: boolean;
  state: PlayerState;
  onToggle: (guide: AudioGuideItem) => void;
}

function GuideCard({ guide, isActive, state, onToggle }: GuideCardProps) {
  const progress = Number.isFinite(state.progress) ? Math.min(1, Math.max(0, state.progress)) : 0;
  const isPlaying = isActive && !state.error;
  const durationLabel = state.duration !== null ? formatTime(state.duration) : guide.durationLabel;

  return (
    <article className="flex flex-col gap-4 rounded-md border border-museum-line bg-museum-panel p-5 transition-colors duration-300 hover:border-museum-gold/40">
      {/* Top row: ring player + title block */}
      <div className="flex items-start gap-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          {isPlaying && (
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full border border-museum-gold/50"
              style={{ animation: 'ag-ring-pulse 1.8s ease-out infinite' }}
            />
          )}
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 64 64"
            role="progressbar"
            aria-label={`${guide.title} playback progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <circle cx="32" cy="32" r={RING_RADIUS} stroke="#2b251b" strokeWidth="2.5" fill="none" />
            <circle
              cx="32"
              cy="32"
              r={RING_RADIUS}
              stroke="#c9a24b"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 250ms linear' }}
            />
          </svg>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onToggle(guide)}
            disabled={state.error}
            aria-label={`${isActive ? 'Pause' : 'Play'} guide: ${guide.title}`}
            className="relative z-10 size-12 rounded-full border border-museum-line bg-museum-panel2 text-museum-gold hover:bg-museum-gold/10 hover:text-museum-gold-soft dark:border-museum-line dark:bg-museum-panel2 dark:hover:bg-museum-gold/10"
          >
            {state.loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : isActive ? (
              <Pause className="size-4 fill-current" aria-hidden />
            ) : (
              <Play className="size-4 translate-x-[1px] fill-current" aria-hidden />
            )}
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg leading-snug text-museum-ivory">{guide.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-museum-muted">
            <Mic className="size-3 shrink-0 text-museum-gold/70" aria-hidden />
            Narrated by {guide.narrator}
          </p>
          {guide.artwork ? (
            <div className="mt-3 flex items-center gap-3 rounded-md border border-museum-line bg-museum-panel2/60 p-2">
              <img
                src={guide.artwork.imageUrl}
                alt={`${guide.artwork.title} by ${guide.artwork.artist}`}
                draggable={false}
                loading="lazy"
                className="size-10 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-museum-ivory">{guide.artwork.title}</p>
                <p className="truncate text-xs text-museum-muted">{guide.artwork.artist}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Narration transcript */}
      <div className="max-h-40 overflow-y-auto pr-2 text-sm leading-relaxed text-museum-muted [scrollbar-color:#2b251b_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-museum-line [&::-webkit-scrollbar-thumb:hover]:bg-museum-gold/50">
        <p>{guide.narration}</p>
      </div>

      {/* Footer: time / error, equalizer, download */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-museum-line pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {isPlaying && (
            <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
              {[0, 1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className="w-[3px] rounded-full bg-museum-gold"
                  style={{
                    height: '100%',
                    transformOrigin: 'bottom',
                    animation: `ag-eq ${900 + bar * 150}ms ease-in-out ${bar * 130}ms infinite`,
                  }}
                />
              ))}
            </span>
          )}
          {state.error ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
              <TriangleAlert className="size-3" aria-hidden />
              Audio unavailable
            </span>
          ) : (
            <span className="text-xs tabular-nums text-museum-muted">
              {formatTime(state.currentTime)} / {durationLabel}
            </span>
          )}
        </div>

        <a
          href={guide.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the audio file for ${guide.title} in a new tab`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-museum-line px-2.5 py-1 text-xs text-museum-muted transition-colors hover:border-museum-gold/40 hover:text-museum-gold"
        >
          <Download className="size-3" aria-hidden />
          Audio
        </a>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* AudioGuideRings                                                     */
/* ------------------------------------------------------------------ */

/**
 * "05 — Audio Guide / Voices of the Museum"
 * Circular progress-ring audio players. Only one narration plays at a time —
 * activating a guide pauses and rewinds every other one.
 */
export function AudioGuideRings({ guides }: { guides: AudioGuideItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, PlayerState>>({});
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const getPlayerState = (id: string): PlayerState => states[id] ?? INITIAL_PLAYER_STATE;

  /** Lazily creates the Audio element for a guide and wires its listeners once. */
  const ensureAudio = useCallback((guide: AudioGuideItem): HTMLAudioElement => {
    const existing = audioMapRef.current.get(guide.id);
    if (existing) return existing;

    const audio = new Audio(guide.audioUrl);
    audio.preload = 'metadata';
    audioMapRef.current.set(guide.id, audio);

    const updateState = (patch: Partial<PlayerState>) => {
      setStates((prev) => ({
        ...prev,
        [guide.id]: { ...(prev[guide.id] ?? INITIAL_PLAYER_STATE), ...patch },
      }));
    };

    audio.addEventListener('loadedmetadata', () => {
      updateState({ duration: Number.isFinite(audio.duration) ? audio.duration : null, loading: false, error: false });
    });
    audio.addEventListener('timeupdate', () => {
      const duration = audio.duration;
      updateState({ currentTime: audio.currentTime, progress: duration > 0 ? audio.currentTime / duration : 0 });
    });
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      updateState({ progress: 0, currentTime: 0 });
      setActiveId((current) => (current === guide.id ? null : current));
    });
    audio.addEventListener('error', () => {
      updateState({ error: true, loading: false });
    });

    return audio;
  }, []);

  /* Pause every narration when the section unmounts. */
  useEffect(() => {
    const map = audioMapRef.current;
    return () => {
      map.forEach((audio) => {
        audio.pause();
      });
      map.clear();
    };
  }, []);

  const handleToggle = (guide: AudioGuideItem) => {
    const audio = ensureAudio(guide);
    const state = states[guide.id] ?? INITIAL_PLAYER_STATE;
    if (state.error) return;

    /* Toggle off: pause, keep the listening position for a later resume. */
    if (activeId === guide.id) {
      audio.pause();
      setStates((prev) => ({
        ...prev,
        [guide.id]: { ...(prev[guide.id] ?? INITIAL_PLAYER_STATE), loading: false },
      }));
      setActiveId(null);
      return;
    }

    /* Pause and rewind every other guide — one voice at a time. */
    audioMapRef.current.forEach((other, id) => {
      if (id === guide.id) return;
      other.pause();
      if (other.currentTime !== 0) {
        try {
          other.currentTime = 0;
        } catch {
          /* some browsers throw while the media is not yet seekable */
        }
      }
    });
    setStates((prev) => {
      const next = { ...prev };
      audioMapRef.current.forEach((_audio, id) => {
        if (id !== guide.id) {
          next[id] = { ...(next[id] ?? INITIAL_PLAYER_STATE), progress: 0, currentTime: 0 };
        }
      });
      return next;
    });

    setActiveId(guide.id);
    if (state.duration === null) {
      setStates((prev) => ({
        ...prev,
        [guide.id]: { ...(prev[guide.id] ?? INITIAL_PLAYER_STATE), loading: true },
      }));
    }

    void audio.play().catch(() => {
      setStates((prev) => ({
        ...prev,
        [guide.id]: { ...(prev[guide.id] ?? INITIAL_PLAYER_STATE), error: true, loading: false },
      }));
      setActiveId((current) => (current === guide.id ? null : current));
    });
  };

  return (
    <section id="audio" className="relative border-t border-museum-line bg-museum-bg py-16 sm:py-24">
      <style>{`
        @keyframes ag-eq {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        @keyframes ag-ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          overline="05 — Audio Guide"
          title="Voices of the Museum"
          lede="The museum speaks. Lend it your ears — curators and keepers of the collection narrate the works you have just met, one voice at a time."
        />

        {guides.length === 0 ? (
          <p className="rounded-md border border-museum-line bg-museum-panel p-8 text-center text-sm text-museum-muted">
            The audio guide booth is quiet — narrations will arrive shortly.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                isActive={activeId === guide.id}
                state={getPlayerState(guide.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
