/**
 * Musée Lumière — database seed
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const IMG = (name: string) => `/images/museum/${name}`;
const AUDIO = (name: string) => `/audio/${name}`;

async function main() {
  // wipe in dependency order
  await db.audioGuide.deleteMany();
  await db.hotspot.deleteMany();
  await db.artwork.deleteMany();
  await db.tourRoom.deleteMany();
  await db.genre.deleteMany();

  // ──────────────────────────────────────────────────────────── Genres ──
  const genres = await Promise.all(
    [
      {
        slug: "renaissance",
        name: "Renaissance",
        period: "1400–1600",
        description:
          "Reborn from classical antiquity, painters unlocked perspective, anatomy and oil — turning wooden panels into windows onto a human-centred world.",
        keyArtists: "Giotto · Botticelli · Raphael · Titian",
        imageUrl: IMG("genre-renaissance.png"),
      },
      {
        slug: "baroque",
        name: "Baroque",
        period: "1600–1750",
        description:
          "Drama as doctrine: swirling figures, theatrical light and deep shadow staged to move the faithful — and to dazzle kings.",
        keyArtists: "Caravaggio · Rembrandt · Rubens · Velázquez",
        imageUrl: IMG("genre-baroque.png"),
      },
      {
        slug: "romanticism",
        name: "Romanticism",
        period: "1780–1850",
        description:
          "Reason gave way to feeling; painters sought the sublime in storms, ruins and solitary travellers dwarfed by nature.",
        keyArtists: "Turner · Friedrich · Delacroix · Géricault",
        imageUrl: IMG("genre-romanticism.png"),
      },
      {
        slug: "impressionism",
        name: "Impressionism",
        period: "1860–1890",
        description:
          "Easels left the studio. Fleeting light, modern leisure and broken brushwork captured the instant instead of the ideal.",
        keyArtists: "Monet · Renoir · Degas · Morisot",
        imageUrl: IMG("genre-impressionism.png"),
      },
      {
        slug: "post-impressionism",
        name: "Post-Impressionism",
        period: "1885–1910",
        description:
          "Structure and symbol returned: swirling night skies, pointillist dots and chromatic experiments pushed beyond the eye's report.",
        keyArtists: "Van Gogh · Seurat · Cézanne · Gauguin",
        imageUrl: IMG("genre-post-impressionism.png"),
      },
      {
        slug: "cubism",
        name: "Cubism",
        period: "1907–1920s",
        description:
          "The window shattered. Forms fractured into geometric planes shown from many angles at once — painting became analysis.",
        keyArtists: "Picasso · Braque · Gris · Léger",
        imageUrl: IMG("genre-cubism.png"),
      },
      {
        slug: "surrealism",
        name: "Surrealism",
        period: "1924–1950s",
        description:
          "Painters couriered dreams to canvas: impossible architecture, melting time and the unconscious laid bare in daylight precision.",
        keyArtists: "Dalí · Magritte · Ernst · Miró",
        imageUrl: IMG("genre-surrealism.png"),
      },
      {
        slug: "abstract-expressionism",
        name: "Abstract Expressionism",
        period: "1943–1960s",
        description:
          "After the war, canvas became an arena: gesture, drip and chromatic field carried raw feeling without a single recognisable thing.",
        keyArtists: "Pollock · Rothko · de Kooning · Kline",
        imageUrl: IMG("genre-abstract-expressionism.png"),
      },
    ].map((g, i) => db.genre.create({ data: { ...g, sortOrder: i } })),
  );
  const genreBySlug = Object.fromEntries(genres.map((g) => [g.slug, g]));

  // ──────────────────────────────────────────────────────────── Rooms ───
  const [oldMasters, impressionist, modern] = await Promise.all(
    [
      {
        slug: "old-masters-hall",
        name: "The Old Masters Hall",
        description:
          "Gilded calm and varnished shadow — five centuries of oil, from Florentine processions to candle-lit Baroque violins.",
        wallColor: "#3a352b",
        floorColor: "#5c4430",
      },
      {
        slug: "impressionist-gallery",
        name: "The Impressionist Gallery",
        description:
          "A room of weather and light, where the walls are hung with flickers — lilies, boulevards and parasols at morning.",
        wallColor: "#4a4238",
        floorColor: "#7a6248",
      },
      {
        slug: "modern-wing",
        name: "The Modern Wing",
        description:
          "Raw canvas and hard questions — the argument that never ends, from fractured violins to fields of pure gesture.",
        wallColor: "#333333",
        floorColor: "#4a4a48",
      },
    ].map((r, i) => db.tourRoom.create({ data: { ...r, sortOrder: i } })),
  );

  // ───────────────────────────────────────────────────────── Artworks ───
  // width/height = physical metres (used by the 3D tour)
  const artworkData: {
    slug: string;
    title: string;
    artist: string;
    year: string;
    description: string;
    imageUrl: string;
    isHighlight: boolean;
    heroCaption: string | null;
    featured: boolean;
    width: number;
    height: number;
    genreSlug: string;
    roomSlug: string | null;
    wall: string | null;
    position: number | null;
  }[] = [
    {
      slug: "the-golden-hour-procession",
      title: "The Golden Hour Procession",
      artist: "Attributed to a Florentine Master",
      year: "c. 1485",
      description:
        "An entire city compressed onto one panel: crimson and gold robes crossing a marble plaza beneath a sky holding its breath. Recent cleaning revealed a second drummer, hidden by varnish for three centuries.",
      imageUrl: IMG("hero-renaissance.png"),
      isHighlight: true,
      heroCaption: "Tempera and oil on panel · The Old Masters Hall",
      featured: false,
      width: 3.36,
      height: 1.92,
      genreSlug: "renaissance",
      roomSlug: "old-masters-hall",
      wall: "west",
      position: 0.5,
    },
    {
      slug: "water-garden-at-giverny-evening",
      title: "Water Garden at Giverny, Evening",
      artist: "After Claude Monet",
      year: "1897",
      description:
        "No lines, only flickers. Up close the surface is chaos; three steps back, light congeals into lilies. Painted over sixty sittings, each lasting less than twenty minutes — the lifespan of that evening's light.",
      imageUrl: IMG("hero-impressionism.png"),
      isHighlight: true,
      heroCaption: "Oil on canvas · The Impressionist Gallery",
      featured: true,
      width: 3.36,
      height: 1.92,
      genreSlug: "impressionism",
      roomSlug: "impressionist-gallery",
      wall: "south",
      position: 0.5,
    },
    {
      slug: "chromatic-resonance-no-7",
      title: "Chromatic Resonance No. 7",
      artist: "Elena Vasquez",
      year: "1958",
      description:
        "Sweeping crimson and ochre laid down in a single afternoon session, the canvas pinned to the studio floor. Vasquez described the work as 'a heated argument between gravity and pigment'.",
      imageUrl: IMG("hero-abstract.png"),
      isHighlight: true,
      heroCaption: "Oil and enamel on canvas · The Modern Wing",
      featured: false,
      width: 3.36,
      height: 1.92,
      genreSlug: "abstract-expressionism",
      roomSlug: "modern-wing",
      wall: "south",
      position: 0.5,
    },
    {
      slug: "garden-of-eternal-spring",
      title: "The Garden of Eternal Spring",
      artist: "Master of the Botanic Wall",
      year: "c. 1560",
      description:
        "A walled garden where every species blooms at once — seventeen identifiable birds, two extinct since 1600, and blossoms painted from specimens grown in the botanist's garden at Leiden. Bring your cursor close: the panel rewards magnification.",
      imageUrl: IMG("masterpiece-garden.png"),
      isHighlight: false,
      heroCaption: null,
      featured: true,
      width: 3.2,
      height: 1.83,
      genreSlug: "renaissance",
      roomSlug: "old-masters-hall",
      wall: "south",
      position: 0.5,
    },
    {
      slug: "portrait-of-a-lady-with-a-carnation",
      title: "Portrait of a Lady with a Carnation",
      artist: "Studio of Lombardy",
      year: "c. 1508",
      description:
        "Sfumato softens her cheek as if she breathes. The carnation — a love token — was overpainted in the nineteenth century and rediscovered by X-ray in 1954.",
      imageUrl: IMG("portrait-lady.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.08,
      height: 1.44,
      genreSlug: "renaissance",
      roomSlug: "old-masters-hall",
      wall: "east",
      position: 0.28,
    },
    {
      slug: "the-violinist",
      title: "The Violinist",
      artist: "Follower of the Utrecht Caravaggisti",
      year: "c. 1621",
      description:
        "A single candle lights the whole theatre of this portrait. The bow hovers mid-phrase; the varnish of the violin catches the flame's amber — a lesson in how Baroque painters staged light like a stagehand.",
      imageUrl: IMG("portrait-violinist.png"),
      isHighlight: false,
      heroCaption: null,
      featured: true,
      width: 1.08,
      height: 1.44,
      genreSlug: "baroque",
      roomSlug: "old-masters-hall",
      wall: "east",
      position: 0.72,
    },
    {
      slug: "woman-with-a-parasol-morning",
      title: "Woman with a Parasol, Morning",
      artist: "After Pierre-Auguste Renoir",
      year: "1873",
      description:
        "Wind made visible: the parasol's tilt, the meadow's shimmer, a hem lifting. Painted outdoors in a single morning — the plein-air wager that a whole atmosphere could be caught before lunch.",
      imageUrl: IMG("portrait-parasol.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.08,
      height: 1.44,
      genreSlug: "impressionism",
      roomSlug: "impressionist-gallery",
      wall: "east",
      position: 0.5,
    },
    {
      slug: "self-portrait-with-amber-ground",
      title: "Self-Portrait with Amber Ground",
      artist: "Mara Ilves",
      year: "1912",
      description:
        "Bold planes of colour and a gaze that refuses apology. Ilves painted her own face seventeen times that year; this, the ninth, is the only one she signed.",
      imageUrl: IMG("portrait-modern.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.08,
      height: 1.44,
      genreSlug: "post-impressionism",
      roomSlug: "modern-wing",
      wall: "east",
      position: 0.5,
    },
    {
      slug: "the-school-of-arches",
      title: "The School of Arches",
      artist: "Umbrian Workshop",
      year: "c. 1479",
      description:
        "Scholars debate beneath classical arches — perspective's first classroom. The vanishing point sits precisely at the speaker's gesturing hand.",
      imageUrl: IMG("genre-renaissance.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "renaissance",
      roomSlug: "old-masters-hall",
      wall: "north",
      position: 0.3,
    },
    {
      slug: "apotheosis-of-the-storm-god",
      title: "Apotheosis of the Storm God",
      artist: "Roman Atelier, after Rubens",
      year: "c. 1635",
      description:
        "Swirling bodies on clouds, a diagonal of thunder. The commission required that the god's gaze fall directly on the patron's box in the chapel below.",
      imageUrl: IMG("genre-baroque.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "baroque",
      roomSlug: "old-masters-hall",
      wall: "north",
      position: 0.7,
    },
    {
      slug: "the-traveller-above-the-fog",
      title: "The Traveller Above the Fog",
      artist: "After Caspar David Friedrich",
      year: "1818",
      description:
        "A lone coat, a precipice, an ocean of fog. Romanticism's whole thesis in one figure: the self, small and upright, before the infinite.",
      imageUrl: IMG("genre-romanticism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "romanticism",
      roomSlug: "old-masters-hall",
      wall: "west",
      position: 0.16,
    },
    {
      slug: "boulevard-at-sunrise",
      title: "Boulevard at Sunrise",
      artist: "After Camille Pissarro",
      year: "1893",
      description:
        "Morning traffic rendered as weather: carriages, awnings and steam dissolved into one violet shimmer. The critic who mocked 'wallpaper embryos' is forgotten; the boulevard remains.",
      imageUrl: IMG("genre-impressionism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "impressionism",
      roomSlug: "impressionist-gallery",
      wall: "north",
      position: 0.3,
    },
    {
      slug: "village-under-the-swirling-sky",
      title: "Village under the Swirling Sky",
      artist: "After Vincent van Gogh",
      year: "1889",
      description:
        "Painted from an asylum window in the hour before dawn, when stars could still compete with the gas lamps. The cypress binds earth to sky like a flame running both ways.",
      imageUrl: IMG("genre-post-impressionism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "post-impressionism",
      roomSlug: "impressionist-gallery",
      wall: "north",
      position: 0.7,
    },
    {
      slug: "violin-and-guitar-in-ochre",
      title: "Violin and Guitar in Ochre",
      artist: "After Georges Braque",
      year: "1912",
      description:
        "One violin and one guitar, seen from every side at once. Analytic Cubism at its most lyrical — instruments dissolved into ochre planes, like music itself.",
      imageUrl: IMG("genre-cubism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "cubism",
      roomSlug: "modern-wing",
      wall: "north",
      position: 0.3,
    },
    {
      slug: "the-staircase-sea",
      title: "The Staircase Sea",
      artist: "Studio of Joan Farré",
      year: "1934",
      description:
        "Stone arches that float, staircases that climb to nowhere, a sea with no tide. Farré claimed he painted only what he dreamt twice.",
      imageUrl: IMG("genre-surrealism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "surrealism",
      roomSlug: "modern-wing",
      wall: "north",
      position: 0.7,
    },
    {
      slug: "ember-field-no-4",
      title: "Ember Field No. 4",
      artist: "Conrad Hale",
      year: "1951",
      description:
        "Drip over drip, ochre under crimson — a field of pure gesture with no image to hide behind. Hale worked with the canvas flat, walking around it like a gardener.",
      imageUrl: IMG("genre-abstract-expressionism.png"),
      isHighlight: false,
      heroCaption: null,
      featured: false,
      width: 1.3,
      height: 1.3,
      genreSlug: "abstract-expressionism",
      roomSlug: "modern-wing",
      wall: "west",
      position: 0.5,
    },
  ];

  const roomBySlug: Record<string, string> = {
    "old-masters-hall": oldMasters.id,
    "impressionist-gallery": impressionist.id,
    "modern-wing": modern.id,
  };

  const created: Record<string, string> = {};
  for (const a of artworkData) {
    const row = await db.artwork.create({
      data: {
        slug: a.slug,
        title: a.title,
        artist: a.artist,
        year: a.year,
        description: a.description,
        imageUrl: a.imageUrl,
        isHighlight: a.isHighlight,
        heroCaption: a.heroCaption,
        featured: a.featured,
        width: a.width,
        height: a.height,
        genreId: genreBySlug[a.genreSlug].id,
        roomId: a.roomSlug ? roomBySlug[a.roomSlug] : null,
        wall: a.wall,
        position: a.position,
      },
    });
    created[a.slug] = row.id;
  }

  // ──────────────────────────────────────────────────────── Hotspots ────
  // Teleport rings floating near the corners of each room (metres).
  const hotspotData: {
    roomSlug: string;
    x: number;
    y: number;
    z: number;
    label: string;
    targetSlug: string;
  }[] = [
    // Old Masters Hall →
    { roomSlug: "old-masters-hall", x: 4.1, y: 1.35, z: 2.7, label: "Impressionist Gallery", targetSlug: "impressionist-gallery" },
    { roomSlug: "old-masters-hall", x: -4.1, y: 1.35, z: -2.7, label: "Modern Wing", targetSlug: "modern-wing" },
    // Impressionist Gallery →
    { roomSlug: "impressionist-gallery", x: -4.1, y: 1.35, z: 2.7, label: "Old Masters Hall", targetSlug: "old-masters-hall" },
    { roomSlug: "impressionist-gallery", x: 4.1, y: 1.35, z: -2.7, label: "Modern Wing", targetSlug: "modern-wing" },
    // Modern Wing →
    { roomSlug: "modern-wing", x: -4.1, y: 1.35, z: 2.7, label: "Old Masters Hall", targetSlug: "old-masters-hall" },
    { roomSlug: "modern-wing", x: 4.1, y: 1.35, z: -2.7, label: "Impressionist Gallery", targetSlug: "impressionist-gallery" },
  ];

  for (const h of hotspotData) {
    await db.hotspot.create({
      data: {
        roomId: roomBySlug[h.roomSlug],
        x: h.x,
        y: h.y,
        z: h.z,
        label: h.label,
        targetRoomId: roomBySlug[h.targetSlug],
      },
    });
  }

  // ──────────────────────────────────────────────────── Audio guides ────
  const guideData: {
    slug: string;
    title: string;
    narrator: string;
    narration: string;
    audioUrl: string;
    durationLabel: string;
    artworkSlug: string | null;
  }[] = [
    {
      slug: "welcome",
      title: "Welcome to Musée Lumière",
      narrator: "James Whitmore",
      narration:
        "Welcome to Musée Lumière, your journey through eight centuries of painting. I am James, your audio companion. Inside these galleries, light itself becomes a curator. From the gilded calm of the Old Masters Hall, to the shimmering gardens of the Impressionists, to the bold canvases of the Modern Wing. Drag your way through our virtual rooms, linger before the masterpieces, and when a painting captures your imagination, press the ring beside it to hear its story. Shall we begin?",
      audioUrl: AUDIO("guide-welcome.wav"),
      durationLabel: "0:49",
      artworkSlug: null,
    },
    {
      slug: "old-masters-hall",
      title: "The Old Masters Hall",
      narrator: "James Whitmore",
      narration:
        "You are standing in the Old Masters Hall. Fifteenth century Florence traded heaven's stern gold icons for human warmth: perspective, anatomy, and the tender glow of oil on panel. Notice the Portrait of a Lady with a Carnation — sfumato softens her cheek as if she breathes. Behind you, The Golden Hour Procession stages an entire city on one canvas: crimson robes, marble arches, a sky holding its breath. The Renaissance taught Europe that a painting could be a window, and that we, the viewers, stand at its frame.",
      audioUrl: AUDIO("guide-old-masters.wav"),
      durationLabel: "0:55",
      artworkSlug: null,
    },
    {
      slug: "impressionist-gallery",
      title: "The Impressionist Gallery",
      narrator: "James Whitmore",
      narration:
        "Welcome to the Impressionist Gallery. In the eighteen sixties, a handful of painters carried their easels out of the studio and into the weather. They chased railway steam, laundry drying, sunlit boulevards — modern life itself. Look at the Water Garden: no lines, only flickers. Up close, chaos; three steps back, light congeals into lilies. The critics mocked them; today these canvases outdraw kings. The Impressionists proved that a painting records not what we know, but what we see in one blinking instant.",
      audioUrl: AUDIO("guide-impressionists.wav"),
      durationLabel: "0:54",
      artworkSlug: null,
    },
    {
      slug: "modern-wing",
      title: "The Modern Wing",
      narrator: "James Whitmore",
      narration:
        "Here in the Modern Wing, the window shatters. After nineteen hundred, painters stopped imitating the eye and began interrogating it. A violin dissolves into ochre planes; staircases climb to nowhere; paint itself drips and races across raw canvas. Nothing here is accidental — each gesture is a question: what is a picture made of, and who decides? Walk slowly. Modern art is not a style. It is an argument that never ends, and you have just been handed a seat at the table.",
      audioUrl: AUDIO("guide-modern-wing.wav"),
      durationLabel: "0:53",
      artworkSlug: null,
    },
    {
      slug: "garden-of-eternal-spring",
      title: "Masterpiece Close-Up: The Garden of Eternal Spring",
      narrator: "James Whitmore",
      narration:
        "Before you hangs The Garden of Eternal Spring, painted on oak panel around fifteen sixty. Move your cursor across it, and the lens will magnify the surface four times. In the lower left corner, a bee lands on a tulip; naturalists count seventeen bird species here, two of them extinct since sixteen hundred. Every blossom was painted from specimens grown in the botanist's garden at Leiden, and the fountain at the centre was modelled on one that still flows today. This panel has hung in five palaces and survived two wars. Now it hangs in front of you.",
      audioUrl: AUDIO("guide-masterpiece.wav"),
      durationLabel: "0:55",
      artworkSlug: "garden-of-eternal-spring",
    },
  ];

  for (const g of guideData) {
    await db.audioGuide.create({
      data: {
        slug: g.slug,
        title: g.title,
        narrator: g.narrator,
        narration: g.narration,
        audioUrl: g.audioUrl,
        durationLabel: g.durationLabel,
        artworkId: g.artworkSlug ? created[g.artworkSlug] : null,
        sortOrder: guideData.indexOf(g),
      },
    });
  }

  const counts = {
    genres: await db.genre.count(),
    artworks: await db.artwork.count(),
    rooms: await db.tourRoom.count(),
    hotspots: await db.hotspot.count(),
    audioGuides: await db.audioGuide.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
