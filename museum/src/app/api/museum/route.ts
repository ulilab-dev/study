import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/museum
 * Returns the full museum dataset: genres, artworks, tour rooms (with
 * artworks + teleport hotspots) and audio guides.
 */
export async function GET() {
  try {
    const [genres, artworks, rooms, audioGuides] = await Promise.all([
      db.genre.findMany({ orderBy: { sortOrder: "asc" } }),
      db.artwork.findMany({
        orderBy: { slug: "asc" },
        include: { genre: { select: { name: true } } },
      }),
      db.tourRoom.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          artworks: { orderBy: { slug: "asc" } },
          hotspots: {
            include: { targetRoom: { select: { slug: true, name: true } } },
          },
        },
      }),
      db.audioGuide.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          artwork: { select: { title: true, artist: true, imageUrl: true } },
        },
      }),
    ]);

    return NextResponse.json(
      {
        genres,
        artworks: artworks.map((a) => ({
          id: a.id,
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
          genreName: a.genre?.name ?? null,
        })),
        rooms: rooms.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          description: r.description,
          wallColor: r.wallColor,
          floorColor: r.floorColor,
          sortOrder: r.sortOrder,
          artworks: r.artworks.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            artist: a.artist,
            year: a.year,
            description: a.description,
            imageUrl: a.imageUrl,
            wall: (a.wall ?? "north") as "north" | "south" | "east" | "west",
            position: a.position ?? 0.5,
            width: a.width,
            height: a.height,
          })),
          hotspots: r.hotspots.map((h) => ({
            id: h.id,
            x: h.x,
            y: h.y,
            z: h.z,
            label: h.label,
            targetRoomSlug: h.targetRoom.slug,
            targetRoomName: h.targetRoom.name,
          })),
        })),
        audioGuides: audioGuides.map((g) => ({
          id: g.id,
          slug: g.slug,
          title: g.title,
          narrator: g.narrator,
          narration: g.narration,
          audioUrl: g.audioUrl,
          durationLabel: g.durationLabel,
          artwork: g.artwork
            ? {
                title: g.artwork.title,
                artist: g.artwork.artist,
                imageUrl: g.artwork.imageUrl,
              }
            : null,
          sortOrder: g.sortOrder,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[/api/museum] failed:", error);
    return NextResponse.json(
      { error: "Failed to load museum data" },
      { status: 500 },
    );
  }
}
