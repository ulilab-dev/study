/**
 * Musée Lumière — asset generator
 * Generates 16 AI artworks + 5 TTS audio-guide narrations.
 * Run: bun scripts/generate-museum-assets.ts
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const IMG_DIR = path.join(process.cwd(), "public", "images", "museum");
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

interface ImageSpec {
  file: string;
  prompt: string;
  size: string;
}

const images: ImageSpec[] = [
  // ── Hero masterpieces (landscape 1344x768) ─────────────────────────────
  {
    file: "hero-renaissance.png",
    prompt:
      "Grand Renaissance oil painting of a solemn procession of figures in crimson and gold robes crossing a sunlit marble plaza, architectural arches and a dramatic clouded sky beyond, old master style, rich varnished tones, fine craquelure, museum masterpiece quality, highly detailed",
    size: "1344x768",
  },
  {
    file: "hero-impressionism.png",
    prompt:
      "Impressionist oil painting of a water garden with lilies and a wooden footbridge at evening, dappled reflections, loose visible brushstrokes, soft violet rose and amber palette, museum masterpiece quality",
    size: "1344x768",
  },
  {
    file: "hero-abstract.png",
    prompt:
      "Bold abstract expressionist painting with sweeping gestural strokes of crimson, ochre, ivory and black, dripping paint texture, monumental canvas composition, museum masterpiece quality",
    size: "1344x768",
  },
  // ── Magnifier masterpiece (very dense detail) ──────────────────────────
  {
    file: "masterpiece-garden.png",
    prompt:
      "Dense Flemish Renaissance oil painting on oak panel of a walled garden in eternal spring, hundreds of meticulously detailed tulips roses and irises, exotic birds, figures in sixteenth-century costume around a stone fountain, minute brushwork, Bruegel-esque density, museum masterpiece quality, extremely detailed",
    size: "1344x768",
  },
  // ── Portraits (864x1152) for the 3D gallery walls ─────────────────────
  {
    file: "portrait-lady.png",
    prompt:
      "Renaissance oil portrait of a young lady holding a carnation, dark green dress with gold embroidery, soft sfumato modelling, deep umber background, old master style, museum quality",
    size: "864x1152",
  },
  {
    file: "portrait-violinist.png",
    prompt:
      "Baroque chiaroscuro oil portrait of a violinist mid-performance lit by a single candle, deep shadows, warm amber tones, visible brushwork, old master style, museum quality",
    size: "864x1152",
  },
  {
    file: "portrait-parasol.png",
    prompt:
      "Impressionist portrait of a woman with a parasol in a windswept meadow, morning light, loose luminous brushstrokes, pale blue and cream palette, museum quality",
    size: "864x1152",
  },
  {
    file: "portrait-modern.png",
    prompt:
      "Modern expressionist self-portrait against an amber background, bold planes of colour, confident impasto strokes, early twentieth century avant-garde style, museum quality",
    size: "864x1152",
  },
  // ── Genre timeline thumbnails (1024x1024) ──────────────────────────────
  {
    file: "genre-renaissance.png",
    prompt:
      "Renaissance fresco-style painting of scholars debating under classical arches, balanced harmonious composition, warm tempera tones, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-baroque.png",
    prompt:
      "Baroque oil painting of a dramatic mythological ascension, swirling figures on clouds, intense chiaroscuro contrast, theatrical diagonal composition, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-romanticism.png",
    prompt:
      "Romanticism oil painting of a lone traveller in a dark coat on a foggy mountain precipice overlooking a vast stormy valley, sublime atmosphere, muted greens and greys, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-impressionism.png",
    prompt:
      "Impressionist painting of a sunlit Parisian boulevard cafe terrace with figures, fluttering broken brushwork, afternoon light and violet shadows, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-post-impressionism.png",
    prompt:
      "Post-impressionist night scene of a small village beneath a swirling starry sky with a tall cypress tree, thick rhythmic brushstrokes, vivid ultramarine and gold, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-cubism.png",
    prompt:
      "Analytic cubist painting of a violin and a guitar fractured into interlocking geometric planes, muted ochre umber and grey palette, faceted light, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-surrealism.png",
    prompt:
      "Surrealist painting of impossible floating stone arches and staircases above a calm mirror sea under a twilight sky, dreamlike stillness, precise rendering, museum quality",
    size: "1024x1024",
  },
  {
    file: "genre-abstract-expressionism.png",
    prompt:
      "Abstract expressionist canvas with layered drips, spatters and vigorous gestural strokes in ochre crimson black and ivory, raw expressive energy, museum quality",
    size: "1024x1024",
  },
];

interface AudioSpec {
  file: string;
  text: string;
}

const audios: AudioSpec[] = [
  {
    file: "guide-welcome.mp3",
    text: "Welcome to Musée Lumière, your journey through eight centuries of painting. I am James, your audio companion. Inside these galleries, light itself becomes a curator. From the gilded calm of the Old Masters Hall, to the shimmering gardens of the Impressionists, to the bold canvases of the Modern Wing. Drag your way through our virtual rooms, linger before the masterpieces, and when a painting captures your imagination, press the ring beside it to hear its story. Shall we begin?",
  },
  {
    file: "guide-old-masters.mp3",
    text: "You are standing in the Old Masters Hall. Fifteenth century Florence traded heaven's stern gold icons for human warmth: perspective, anatomy, and the tender glow of oil on panel. Notice the Portrait of a Lady with a Carnation. Sfumato softens her cheek as if she breathes. Behind you, The Golden Hour Procession stages an entire city on one canvas: crimson robes, marble arches, a sky holding its breath. The Renaissance taught Europe that a painting could be a window, and that we, the viewers, stand at its frame.",
  },
  {
    file: "guide-impressionists.mp3",
    text: "Welcome to the Impressionist Gallery. In the eighteen sixties, a handful of painters carried their easels out of the studio and into the weather. They chased railway steam, laundry drying, sunlit boulevards, modern life itself. Look at the Water Garden: no lines, only flickers. Up close, chaos. Three steps back, and light congeals into lilies. The critics mocked them; today these canvases outdraw kings. The Impressionists proved that a painting records not what we know, but what we see in one blinking instant.",
  },
  {
    file: "guide-modern-wing.mp3",
    text: "Here in the Modern Wing, the window shatters. After nineteen hundred, painters stopped imitating the eye and began interrogating it. A violin dissolves into ochre planes. Staircases climb to nowhere. Paint itself drips and races across raw canvas. Nothing here is accidental. Each gesture is a question: what is a picture made of, and who decides? Walk slowly. Modern art is not a style. It is an argument that never ends, and you have just been handed a seat at the table.",
  },
  {
    file: "guide-masterpiece.mp3",
    text: "Before you hangs The Garden of Eternal Spring, painted on oak panel around fifteen sixty. Move your cursor across it, and the lens will magnify the surface four times. In the lower left corner, a bee lands on a tulip; naturalists count seventeen bird species here, two of them extinct since sixteen hundred. Every blossom was painted from specimens grown in the botanist's garden at Leiden, and the fountain at the centre was modelled on one that still flows today. This panel has hung in five palaces and survived two wars. Now it hangs in front of you.",
  },
];

const VOICES = ["jam", "kazi", "tongtong"];

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function genImage(zai: Awaited<ReturnType<typeof ZAI.create>>, spec: ImageSpec) {
  const out = path.join(IMG_DIR, spec.file);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await zai.images.generations.create({
        prompt: spec.prompt,
        size: spec.size,
      });
      const b64 = response?.data?.[0]?.base64;
      if (!b64) throw new Error("empty base64 in response");
      const buffer = Buffer.from(b64, "base64");
      if (buffer.length < 20000) throw new Error(`suspiciously small (${buffer.length} bytes)`);
      fs.writeFileSync(out, buffer);
      log(`OK image ${spec.file} (${(buffer.length / 1024).toFixed(0)} KB)`);
      return;
    } catch (err) {
      log(`image ${spec.file} attempt ${attempt} failed: ${(err as Error).message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`image ${spec.file} failed after 3 attempts`);
}

async function genAudio(zai: Awaited<ReturnType<typeof ZAI.create>>, spec: AudioSpec) {
  const out = path.join(AUDIO_DIR, spec.file);
  for (const voice of VOICES) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await zai.audio.tts.create({
          input: spec.text,
          voice,
          speed: 0.92,
          response_format: "mp3",
          stream: false,
        });
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(arrayBuffer));
        if (buffer.length < 20000) throw new Error(`suspiciously small (${buffer.length} bytes)`);
        fs.writeFileSync(out, buffer);
        log(`OK audio ${spec.file} voice=${voice} (${(buffer.length / 1024).toFixed(0)} KB)`);
        return;
      } catch (err) {
        log(`audio ${spec.file} voice=${voice} attempt ${attempt} failed: ${(err as Error).message}`);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  throw new Error(`audio ${spec.file} failed for all voices`);
}

async function main() {
  const mode = process.env.MUSEUM_MODE ?? "all"; // all | images | audio
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const zai = await ZAI.create();
  log(
    `ZAI ready (mode=${mode}). ${images.length} images, ${audios.length} audio guides to generate.`,
  );

  let imgFail = 0;
  let audFail = 0;

  if (mode === "all" || mode === "images") {
    for (const spec of images) {
      const out = path.join(IMG_DIR, spec.file);
      if (fs.existsSync(out) && fs.statSync(out).size > 20000) {
        log(`SKIP image ${spec.file} (exists)`);
        continue;
      }
      try {
        await genImage(zai, spec);
      } catch {
        imgFail++;
      }
    }
  }

  if (mode === "all" || mode === "audio") {
    for (const spec of audios) {
      const out = path.join(AUDIO_DIR, spec.file);
      if (fs.existsSync(out) && fs.statSync(out).size > 20000) {
        log(`SKIP audio ${spec.file} (exists)`);
        continue;
      }
      try {
        await genAudio(zai, spec);
      } catch {
        audFail++;
      }
    }
  }

  log(`DONE. image failures: ${imgFail}, audio failures: ${audFail}`);
  process.exit(imgFail + audFail > 0 ? 1 : 0);
}

main().catch((err) => {
  log(`FATAL ${err.message}`);
  process.exit(1);
});
