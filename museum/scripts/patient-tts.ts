/**
 * Patient TTS generator — one request at a time with long cooldowns,
 * designed for a heavily rate-limited endpoint. Resumable: skips
 * files that already exist.
 * Run: MUSEUM_PATIENT=1 bun scripts/generate-museum-assets.ts
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

const audios: { file: string; text: string }[] = [
  {
    file: "guide-welcome.wav",
    text: "Welcome to Musée Lumière, your journey through eight centuries of painting. I am James, your audio companion. Inside these galleries, light itself becomes a curator. From the gilded calm of the Old Masters Hall, to the shimmering gardens of the Impressionists, to the bold canvases of the Modern Wing. Drag your way through our virtual rooms, linger before the masterpieces, and when a painting captures your imagination, press the ring beside it to hear its story. Shall we begin?",
  },
  {
    file: "guide-old-masters.wav",
    text: "You are standing in the Old Masters Hall. Fifteenth century Florence traded heaven's stern gold icons for human warmth: perspective, anatomy, and the tender glow of oil on panel. Notice the Portrait of a Lady with a Carnation. Sfumato softens her cheek as if she breathes. Behind you, The Golden Hour Procession stages an entire city on one canvas: crimson robes, marble arches, a sky holding its breath. The Renaissance taught Europe that a painting could be a window, and that we, the viewers, stand at its frame.",
  },
  {
    file: "guide-impressionists.wav",
    text: "Welcome to the Impressionist Gallery. In the eighteen sixties, a handful of painters carried their easels out of the studio and into the weather. They chased railway steam, laundry drying, sunlit boulevards, modern life itself. Look at the Water Garden: no lines, only flickers. Up close, chaos; three steps back, and light congeals into lilies. The critics mocked them; today these canvases outdraw kings. The Impressionists proved that a painting records not what we know, but what we see in one blinking instant.",
  },
  {
    file: "guide-modern-wing.wav",
    text: "Here in the Modern Wing, the window shatters. After nineteen hundred, painters stopped imitating the eye and began interrogating it. A violin dissolves into ochre planes. Staircases climb to nowhere. Paint itself drips and races across raw canvas. Nothing here is accidental. Each gesture is a question: what is a picture made of, and who decides? Walk slowly. Modern art is not a style. It is an argument that never ends, and you have just been handed a seat at the table.",
  },
  {
    file: "guide-masterpiece.wav",
    text: "Before you hangs The Garden of Eternal Spring, painted on oak panel around fifteen sixty. Move your cursor across it, and the lens will magnify the surface four times. In the lower left corner, a bee lands on a tulip; naturalists count seventeen bird species here, two of them extinct since sixteen hundred. Every blossom was painted from specimens grown in the botanist's garden at Leiden, and the fountain at the centre was modelled on one that still flows today. This panel has hung in five palaces and survived two wars. Now it hangs in front of you.",
  },
];

const WAIT_MS = 80_000; // cooldown between failed attempts
const MAX_ATTEMPTS = 6;

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const zai = await ZAI.create();

  for (const spec of audios) {
    const out = path.join(AUDIO_DIR, spec.file);
    if (fs.existsSync(out) && fs.statSync(out).size > 20000) {
      log(`SKIP ${spec.file} (exists)`);
      continue;
    }

    let ok = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++) {
      try {
        const response = await zai.audio.tts.create({
          input: spec.text,
          voice: "jam",
          speed: 0.92,
          response_format: "wav",
          stream: false,
        });
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(new Uint8Array(arrayBuffer));
        if (buffer.length < 20000) {
          throw new Error(`suspiciously small (${buffer.length} bytes)`);
        }
        fs.writeFileSync(out, buffer);
        log(`OK ${spec.file} (${(buffer.length / 1024).toFixed(0)} KB)`);
        ok = true;
      } catch (err) {
        log(
          `${spec.file} attempt ${attempt}/${MAX_ATTEMPTS} failed: ${(err as Error).message}`,
        );
        if (attempt < MAX_ATTEMPTS) {
          log(`waiting ${WAIT_MS / 1000}s before retry...`);
          await new Promise((r) => setTimeout(r, WAIT_MS));
        }
      }
    }
    if (!ok) log(`GIVING UP on ${spec.file} for this run`);
    // small pause between files even on success
    await new Promise((r) => setTimeout(r, 3000));
  }

  const remaining = audios.filter(
    (a) =>
      !fs.existsSync(path.join(AUDIO_DIR, a.file)) ||
      fs.statSync(path.join(AUDIO_DIR, a.file)).size < 20000,
  ).length;
  log(`DONE. remaining: ${remaining}`);
  process.exit(remaining > 0 ? 1 : 0);
}

main().catch((e) => {
  log(`FATAL ${e.message}`);
  process.exit(1);
});
