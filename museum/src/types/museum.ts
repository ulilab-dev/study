export interface Genre {
  id: string;
  slug: string;
  name: string;
  /** e.g. "1860–1890" */
  period: string;
  description: string;
  imageUrl: string;
  keyArtists: string;
  sortOrder: number;
}

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  imageUrl: string;
  /** shown in the hero spotlight carousel */
  isHighlight: boolean;
  /** one-line caption for the hero (e.g. "Oil on canvas · Room I") */
  heroCaption: string | null;
  /** available in the magnifier section */
  featured: boolean;
  /** physical size in meters (used by the 3D tour) */
  width: number;
  height: number;
  genreName: string | null;
}

export type WallSide = "north" | "south" | "east" | "west";

export interface TourArtwork {
  id: string;
  slug: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  imageUrl: string;
  wall: WallSide;
  /** 0..1 position along the wall */
  position: number;
  width: number;
  height: number;
}

export interface TourHotspot {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  targetRoomSlug: string;
  targetRoomName: string;
}

export interface TourRoom {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** hex colors for the 3D room */
  wallColor: string;
  floorColor: string;
  sortOrder: number;
  artworks: TourArtwork[];
  hotspots: TourHotspot[];
}

export interface AudioGuideItem {
  id: string;
  slug: string;
  title: string;
  narrator: string;
  narration: string;
  audioUrl: string;
  /** display fallback, e.g. "0:42" */
  durationLabel: string;
  artwork: {
    title: string;
    artist: string;
    imageUrl: string;
  } | null;
  sortOrder: number;
}

export interface MuseumData {
  genres: Genre[];
  artworks: Artwork[];
  rooms: TourRoom[];
  audioGuides: AudioGuideItem[];
}
