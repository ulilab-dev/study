"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Compass, Loader2, Move, X } from "lucide-react";
import type { TourArtwork, TourRoom, WallSide } from "@/types/museum";

/* ── room geometry (metres) ─────────────────────────────────────── */
const ROOM_W = 10;
const ROOM_D = 8;
const ROOM_H = 3.6;
const EYE = 1.62;
const ROOM_GAP = 40;

const GOLD = "#c9a24b";

interface HotspotUD {
  kind: "hotspot";
  target: string;
  label: string;
  baseScale: THREE.Vector2;
  phase: number;
}
interface ArtworkUD {
  kind: "artwork";
  data: TourArtwork;
}

/* ── canvas texture helpers ─────────────────────────────────────── */

function makeFloorTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);
  // plank lines
  ctx.strokeStyle = "rgba(0,0,0,0.38)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * 128 + 64;
    for (let x = offset; x < 512; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, row * 64);
      ctx.lineTo(x, row * 64 + 64);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "rgba(255,240,220,0.05)";
  for (let i = 0; i < 140; i++) {
    const y = Math.random() * 512;
    const x = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 + Math.random() * 50, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHotspotTexture(label: string): THREE.CanvasTexture {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const cx = W / 2;
  const cy = 84;
  const r = 58;
  // halo ring
  ctx.strokeStyle = "rgba(201,162,75,0.4)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
  ctx.stroke();
  // main ring
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // disc
  ctx.fillStyle = "rgba(14,12,9,0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 11, 0, Math.PI * 2);
  ctx.fill();
  // teleport chevron
  ctx.strokeStyle = "#e6c883";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 19, cy + 13);
  ctx.lineTo(cx, cy - 15);
  ctx.lineTo(cx + 19, cy + 13);
  ctx.stroke();
  // label
  ctx.textAlign = "center";
  ctx.font = '600 33px Georgia, "Times New Roman", serif';
  ctx.fillStyle = "#ece3d0";
  const trimmed = label.length > 26 ? `${label.slice(0, 25)}…` : label;
  ctx.fillText(trimmed, cx, H - 58);
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillStyle = GOLD;
  ctx.fillText("TELEPORT", cx, H - 26);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function makeLabelTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const W = 640;
  const H = 200;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.font = '500 44px Georgia, "Times New Roman", serif';
  ctx.fillStyle = "#ece3d0";
  const titleLines = wrapText(ctx, title, 580);
  let y = titleLines.length > 1 ? 58 : 82;
  for (const l of titleLines) {
    ctx.fillText(l, W / 2, y);
    y += 52;
  }
  ctx.font = '400 28px system-ui, sans-serif';
  ctx.fillStyle = "#c9a24b";
  ctx.fillText(subtitle, W / 2, Math.min(y + 8, H - 18));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function placeOnWall(wall: WallSide, position: number) {
  switch (wall) {
    case "north":
      return {
        point: new THREE.Vector3(-ROOM_W / 2 + position * ROOM_W, EYE, -ROOM_D / 2),
        rotY: 0,
        normal: new THREE.Vector3(0, 0, 1),
      };
    case "south":
      return {
        point: new THREE.Vector3(ROOM_W / 2 - position * ROOM_W, EYE, ROOM_D / 2),
        rotY: Math.PI,
        normal: new THREE.Vector3(0, 0, -1),
      };
    case "east":
      return {
        point: new THREE.Vector3(ROOM_W / 2, EYE, -ROOM_D / 2 + position * ROOM_D),
        rotY: -Math.PI / 2,
        normal: new THREE.Vector3(-1, 0, 0),
      };
    case "west":
      return {
        point: new THREE.Vector3(-ROOM_W / 2, EYE, ROOM_D / 2 - position * ROOM_D),
        rotY: Math.PI / 2,
        normal: new THREE.Vector3(1, 0, 0),
      };
  }
}

/* ── component ──────────────────────────────────────────────────── */

export function VirtualTour({ rooms }: { rooms: TourRoom[] }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeSlug, setActiveSlug] = useState(rooms[0]?.slug ?? "");
  const [selected, setSelected] = useState<TourArtwork | null>(null);
  const [ready, setReady] = useState(false);
  const [fade, setFade] = useState<null | "in" | "out">(null);
  const [hint, setHint] = useState(true);
  const [webglError, setWebglError] = useState(false);

  const teleportRef = useRef<((slug: string) => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!mountRef.current || rooms.length === 0) return;
    const mount = mountRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setWebglError(true);
      setReady(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x0a0906);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      62,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      120,
    );
    camera.rotation.order = "YXZ";

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();

    /* ── global lights ── */
    scene.add(new THREE.AmbientLight(0xfff1dc, 0.42));
    const hemi = new THREE.HemisphereLight(0xfff4e0, 0x241c12, 0.55);
    scene.add(hemi);

    /* ── build all rooms ── */
    const roomGroups = new Map<string, THREE.Group>();
    const hotspotsByRoom = new Map<string, THREE.Sprite[]>();
    const artworksByRoom = new Map<string, THREE.Mesh[]>();
    const roomOffsets = new Map<string, number>();
    const disposables: Array<{ dispose: () => void }> = [];

    const texLoader = new THREE.TextureLoader();
    let pendingTextures = 0;
    let texturesDone = false;
    const markTexture = () => {
      pendingTextures--;
      if (pendingTextures <= 0 && !texturesDone) {
        texturesDone = true;
        setReady(true);
      }
    };
    const loadArt = (url: string, onLoad?: (t: THREE.Texture) => void) => {
      pendingTextures++;
      texLoader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          markTexture();
          onLoad?.(t);
        },
        undefined,
        () => markTexture(),
      );
    };

    const wallMat = (color: string) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0 });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x241a10,
      roughness: 0.55,
      metalness: 0.15,
    });
    disposables.push(frameMat);

    const labelSprite = (title: string, subtitle: string, y: number) => {
      const tex = makeLabelTexture(title, subtitle);
      disposables.push(tex);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      disposables.push(mat);
      const s = new THREE.Sprite(mat);
      s.scale.set(1.28, 0.4, 1);
      s.position.set(0, y, 0);
      return s;
    };

    rooms.forEach((room, roomIndex) => {
      const group = new THREE.Group();
      const offsetX = roomIndex * ROOM_GAP;
      roomOffsets.set(room.slug, offsetX);
      group.position.set(offsetX, 0, 0);

      /* floor */
      const floorTex = makeFloorTexture(room.floorColor);
      disposables.push(floorTex);
      const floorGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
      disposables.push(floorGeo);
      const floor = new THREE.Mesh(
        floorGeo,
        new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 }),
      );
      floor.rotation.x = -Math.PI / 2;
      group.add(floor);
      disposables.push(floor.material as THREE.Material);

      /* ceiling */
      const ceilGeo = new THREE.PlaneGeometry(ROOM_W, ROOM_D);
      disposables.push(ceilGeo);
      const ceil = new THREE.Mesh(
        ceilGeo,
        new THREE.MeshStandardMaterial({ color: 0xd9d2c2, roughness: 0.95 }),
      );
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = ROOM_H;
      group.add(ceil);
      disposables.push(ceil.material as THREE.Material);

      /* walls */
      const wallMatRoom = wallMat(room.wallColor);
      disposables.push(wallMatRoom);
      const wallGeoNS = new THREE.PlaneGeometry(ROOM_W, ROOM_H);
      const wallGeoEW = new THREE.PlaneGeometry(ROOM_D, ROOM_H);
      disposables.push(wallGeoNS, wallGeoEW);
      const walls: Array<[THREE.Mesh, THREE.Vector3, number]> = [
        [
          new THREE.Mesh(wallGeoNS, wallMatRoom),
          new THREE.Vector3(0, ROOM_H / 2, -ROOM_D / 2),
          0,
        ],
        [
          new THREE.Mesh(wallGeoNS, wallMatRoom),
          new THREE.Vector3(0, ROOM_H / 2, ROOM_D / 2),
          Math.PI,
        ],
        [
          new THREE.Mesh(wallGeoEW, wallMatRoom),
          new THREE.Vector3(ROOM_W / 2, ROOM_H / 2, 0),
          -Math.PI / 2,
        ],
        [
          new THREE.Mesh(wallGeoEW, wallMatRoom),
          new THREE.Vector3(-ROOM_W / 2, ROOM_H / 2, 0),
          Math.PI / 2,
        ],
      ];
      for (const [mesh, pos, rotY] of walls) {
        mesh.position.copy(pos);
        mesh.rotation.y = rotY;
        group.add(mesh);
      }

      /* baseboards */
      const baseGeoNS = new THREE.BoxGeometry(ROOM_W, 0.14, 0.05);
      const baseGeoEW = new THREE.BoxGeometry(ROOM_D, 0.14, 0.05);
      disposables.push(baseGeoNS, baseGeoEW);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1c130c,
        roughness: 0.5,
      });
      disposables.push(baseMat);
      const baseboards: Array<[THREE.Mesh, THREE.Vector3, number]> = [
        [new THREE.Mesh(baseGeoNS, baseMat), new THREE.Vector3(0, 0.07, -ROOM_D / 2 + 0.03), 0],
        [new THREE.Mesh(baseGeoNS, baseMat), new THREE.Vector3(0, 0.07, ROOM_D / 2 - 0.03), 0],
        [new THREE.Mesh(baseGeoEW, baseMat), new THREE.Vector3(ROOM_W / 2 - 0.03, 0.07, 0), Math.PI / 2],
        [new THREE.Mesh(baseGeoEW, baseMat), new THREE.Vector3(-ROOM_W / 2 + 0.03, 0.07, 0), Math.PI / 2],
      ];
      for (const [mesh, pos, rotY] of baseboards) {
        mesh.position.copy(pos);
        mesh.rotation.y = rotY;
        group.add(mesh);
      }

      /* ceiling point light */
      const point = new THREE.PointLight(0xffd9a0, 6, 14, 1.6);
      point.position.set(0, ROOM_H - 0.35, 0);
      group.add(point);

      /* ── artworks ── */
      const artMeshes: THREE.Mesh[] = [];
      for (const art of room.artworks) {
        const { point: wallPoint, rotY, normal } = placeOnWall(
          art.wall,
          art.position,
        );

        const frameGeo = new THREE.BoxGeometry(art.width + 0.16, art.height + 0.16, 0.07);
        disposables.push(frameGeo);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.copy(wallPoint).addScaledVector(normal, 0.045);
        frame.rotation.y = rotY;
        group.add(frame);

        const canvasGeo = new THREE.PlaneGeometry(art.width, art.height);
        disposables.push(canvasGeo);
        const canvasMat = new THREE.MeshStandardMaterial({
          color: 0x2a2115,
          roughness: 0.85,
        });
        disposables.push(canvasMat);
        const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
        canvasMesh.position.copy(wallPoint).addScaledVector(normal, 0.085);
        canvasMesh.rotation.y = rotY;
        canvasMesh.userData = { kind: "artwork", data: art } satisfies ArtworkUD;
        group.add(canvasMesh);
        artMeshes.push(canvasMesh);

        loadArt(art.imageUrl, (t) => {
          canvasMat.map = t;
          canvasMat.color.set(0xffffff);
          canvasMat.needsUpdate = true;
        });

        /* picture spotlight */
        const spot = new THREE.SpotLight(0xffe3b0, 16, 7.5, 0.52, 0.65, 1.25);
        spot.position.set(
          wallPoint.x + normal.x * 1.75,
          ROOM_H - 0.3,
          wallPoint.z + normal.z * 1.75,
        );
        const target = new THREE.Object3D();
        target.position.copy(wallPoint);
        group.add(target);
        spot.target = target;
        group.add(spot);

        /* wall label */
        const label = labelSprite(
          art.title,
          `${art.artist} · ${art.year}`,
          EYE - art.height / 2 - 0.34,
        );
        label.position.copy(wallPoint).addScaledVector(normal, 0.12);
        label.position.y = EYE - art.height / 2 - 0.34;
        group.add(label);
      }
      artworksByRoom.set(room.slug, artMeshes);

      /* ── teleport hotspots ── */
      const sprites: THREE.Sprite[] = [];
      for (const h of room.hotspots) {
        const tex = makeHotspotTexture(h.label);
        disposables.push(tex);
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
        });
        disposables.push(mat);
        const sprite = new THREE.Sprite(mat);
        const baseScale = new THREE.Vector2(1.35, 0.675);
        sprite.scale.set(baseScale.x, baseScale.y, 1);
        sprite.position.set(h.x, h.y, h.z);
        sprite.userData = {
          kind: "hotspot",
          target: h.targetRoomSlug,
          label: h.label,
          baseScale,
          phase: Math.random() * Math.PI * 2,
        } satisfies HotspotUD;
        group.add(sprite);
        sprites.push(sprite);
      }
      hotspotsByRoom.set(room.slug, sprites);

      /* ── dust motes ── */
      const dustGeo = new THREE.BufferGeometry();
      const N = 140;
      const positions = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        positions[i * 3] = Math.random() * (ROOM_W - 1) - (ROOM_W - 1) / 2;
        positions[i * 3 + 1] = 0.4 + Math.random() * (ROOM_H - 0.8);
        positions[i * 3 + 2] = Math.random() * (ROOM_D - 1) - (ROOM_D - 1) / 2;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      disposables.push(dustGeo);
      const dustMat = new THREE.PointsMaterial({
        color: 0xffe9c4,
        size: 0.022,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      disposables.push(dustMat);
      const dust = new THREE.Points(dustGeo, dustMat);
      group.add(dust);

      group.visible = roomIndex === 0;
      scene.add(group);
      roomGroups.set(room.slug, group);
    });

    /* ── camera state ── */
    const st = {
      yaw: Math.PI,
      pitch: 0,
      targetYaw: Math.PI,
      targetPitch: 0,
      fov: 62,
      targetFov: 62,
      activeRoom: rooms[0].slug,
      dragging: false,
      lastX: 0,
      lastY: 0,
      dragDist: 0,
      hovered: null as THREE.Object3D | null,
    };

    const activateRoom = (slug: string) => {
      roomGroups.forEach((g, s) => {
        g.visible = s === slug;
      });
      const off = roomOffsets.get(slug) ?? 0;
      camera.position.set(off, EYE, 0);
      st.yaw = st.targetYaw = Math.PI;
      st.pitch = st.targetPitch = 0;
      st.fov = st.targetFov = 62;
      st.activeRoom = slug;
      camera.updateProjectionMatrix();
    };
    activateRoom(rooms[0].slug);
    camera.updateProjectionMatrix();

    /* fallback readiness (slow/failed textures) */
    const readyTimeout = setTimeout(() => {
      if (!texturesDone) {
        texturesDone = true;
        setReady(true);
      }
    }, 7000);
    if (pendingTextures === 0) {
      texturesDone = true;
      setReady(true);
    }

    /* ── teleport ── */
    let busy = false;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const teleport = (slug: string) => {
      if (busy || slug === st.activeRoom) return;
      busy = true;
      setFade("in");
      st.targetFov = 48;
      fadeTimer = setTimeout(() => {
        activateRoom(slug);
        setActiveSlug(slug);
        setSelected(null);
        setFade("out");
        st.targetFov = 62;
        busy = false;
      }, 580);
    };
    teleportRef.current = teleport;

    const resetView = () => {
      st.targetYaw = Math.PI;
      st.targetPitch = 0;
      st.targetFov = 62;
    };
    resetViewRef.current = resetView;

    /* ── pointer interaction ── */
    const ndc = new THREE.Vector2();
    let ndcDirty = false;
    const canvas = renderer.domElement;

    const updateNDC = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ndcDirty = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      st.dragging = true;
      st.dragDist = 0;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      if (hint) setHint(false);
    };
    const onPointerMove = (e: PointerEvent) => {
      updateNDC(e);
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.dragDist += Math.abs(dx) + Math.abs(dy);
      // grab-the-world convention: drag right → look left (scene follows hand)
      st.targetYaw += dx * 0.0038;
      st.targetPitch = THREE.MathUtils.clamp(
        st.targetPitch + dy * 0.003,
        -0.72,
        0.72,
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      const wasDrag = st.dragDist > 7;
      st.dragging = false;
      if (wasDrag) return;
      updateNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hitList: THREE.Object3D[] = [
        ...(hotspotsByRoom.get(st.activeRoom) ?? []),
        ...(artworksByRoom.get(st.activeRoom) ?? []),
      ];
      const hits = raycaster.intersectObjects(hitList, false);
      const hit = hits[0]?.object;
      if (!hit) return;
      if (hit.userData.kind === "hotspot") {
        teleport((hit.userData as HotspotUD).target);
      } else if (hit.userData.kind === "artwork") {
        setSelected((hit.userData as ArtworkUD).data);
      }
    };
    const onPointerLeave = () => {
      st.dragging = false;
      ndcDirty = false;
      st.hovered = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      st.targetFov = THREE.MathUtils.clamp(
        st.targetFov + e.deltaY * 0.03,
        38,
        78,
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    /* ── resize ── */
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    /* ── render loop ── */
    let raf = 0;
    const setHover = (obj: THREE.Object3D | null) => {
      if (st.hovered === obj) return;
      if (st.hovered && st.hovered.userData.kind === "artwork") {
        const prevMat = (st.hovered as THREE.Mesh)
          .material as THREE.MeshStandardMaterial;
        prevMat.emissiveIntensity = 0;
      }
      st.hovered = obj;
      if (obj && obj.userData.kind === "artwork") {
        const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(0xc9a24b);
        mat.emissiveIntensity = 0.16;
      }
      canvas.style.cursor = obj ? "pointer" : st.dragging ? "grabbing" : "grab";
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      st.yaw += (st.targetYaw - st.yaw) * 0.11;
      st.pitch += (st.targetPitch - st.pitch) * 0.11;
      camera.rotation.set(st.pitch, st.yaw, 0);

      st.fov += (st.targetFov - st.fov) * 0.1;
      if (Math.abs(camera.fov - st.fov) > 0.01) {
        camera.fov = st.fov;
        camera.updateProjectionMatrix();
      }

      /* hotspot pulse */
      for (const s of hotspotsByRoom.get(st.activeRoom) ?? []) {
        const ud = s.userData as HotspotUD;
        const pulse = 1 + 0.055 * Math.sin(t * 2.4 + ud.phase);
        const hover = st.hovered === s ? 1.18 : 1;
        s.scale.set(
          ud.baseScale.x * pulse * hover,
          ud.baseScale.y * pulse * hover,
          1,
        );
      }

      /* hover raycast */
      if (ndcDirty && !st.dragging) {
        ndcDirty = false;
        raycaster.setFromCamera(ndc, camera);
        const hitList: THREE.Object3D[] = [
          ...(hotspotsByRoom.get(st.activeRoom) ?? []),
          ...(artworksByRoom.get(st.activeRoom) ?? []),
        ];
        const hits = raycaster.intersectObjects(hitList, false);
        setHover(hits[0]?.object ?? null);
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── cleanup ── */
    return () => {
      cancelAnimationFrame(raf);
      if (fadeTimer) clearTimeout(fadeTimer);
      clearTimeout(readyTimeout);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      teleportRef.current = null;
      resetViewRef.current = null;
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (canvas.parentElement === mount) mount.removeChild(canvas);
    };
  }, [rooms]);

  const activeRoom = rooms.find((r) => r.slug === activeSlug) ?? rooms[0];
  const activeIndex = rooms.findIndex((r) => r.slug === activeSlug);

  return (
    <div className="relative overflow-hidden rounded-lg border border-museum-line bg-black">
      <div
        ref={mountRef}
        className="h-[62vh] max-h-[720px] min-h-[430px] w-full"
        role="application"
        aria-label="3D virtual museum tour — drag to look around"
      />

      {/* room nameplate */}
      {activeRoom && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[16rem] rounded-md border border-museum-line bg-black/65 px-4 py-3 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
            Room {activeIndex + 1} of {rooms.length}
          </p>
          <p className="mt-1 font-serif text-lg leading-tight text-museum-ivory">
            {activeRoom.name}
          </p>
        </div>
      )}

      {/* reset view */}
      <button
        type="button"
        onClick={() => resetViewRef.current?.()}
        aria-label="Reset view"
        title="Reset view"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-museum-line bg-black/65 text-museum-muted backdrop-blur-sm transition-colors hover:border-museum-gold/60 hover:text-museum-gold-soft"
      >
        <Compass className="h-4 w-4" aria-hidden />
      </button>

      {/* artwork info panel */}
      {selected && (
        <div className="absolute bottom-16 left-4 z-20 w-[min(22rem,90%)] rounded-md border border-museum-gold/40 bg-black/80 p-4 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-museum-gold">
                On this wall
              </p>
              <p className="mt-1 font-serif text-lg leading-tight text-museum-ivory">
                {selected.title}
              </p>
              <p className="text-xs text-museum-muted">
                {selected.artist} · {selected.year}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close artwork info"
              className="rounded-sm p-1 text-museum-muted transition-colors hover:text-museum-ivory"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="museum-scroll mt-2 max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-museum-muted">
            {selected.description}
          </p>
        </div>
      )}

      {/* room teleport chips */}
      <div className="absolute inset-x-0 bottom-3 z-20 flex flex-wrap items-center justify-center gap-2 px-4">
        {rooms.map((r, i) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => teleportRef.current?.(r.slug)}
            aria-pressed={r.slug === activeSlug}
            className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] backdrop-blur-sm transition-all ${
              r.slug === activeSlug
                ? "border-museum-gold bg-museum-gold/15 text-museum-gold-soft"
                : "border-museum-line bg-black/55 text-museum-muted hover:border-museum-gold/50 hover:text-museum-ivory"
            }`}
          >
            {i + 1} · {r.name.replace("The ", "")}
          </button>
        ))}
      </div>

      {/* first-use hint */}
      {hint && !webglError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="halo flex items-center gap-2 rounded-full border border-museum-gold/50 bg-black/70 px-5 py-2.5 backdrop-blur-sm">
            <Move className="h-4 w-4 text-museum-gold" aria-hidden />
            <span className="text-xs uppercase tracking-[0.2em] text-museum-ivory">
              Drag to look around
            </span>
          </div>
        </div>
      )}

      {/* teleport fade */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity ${
          fade === "in"
            ? "opacity-100 duration-500"
            : "opacity-0 duration-700"
        }`}
      />

      {/* loading / webgl fallback */}
      {!ready && !webglError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-museum-bg">
          <Loader2 className="h-6 w-6 animate-spin text-museum-gold" aria-hidden />
          <p className="font-serif text-lg text-museum-ivory">
            Hanging the canvases…
          </p>
          <p className="text-xs text-museum-muted">
            Preparing the virtual galleries
          </p>
        </div>
      )}
      {webglError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-museum-bg px-6 text-center">
          <p className="font-serif text-lg text-museum-ivory">
            The 3D wing needs WebGL
          </p>
          <p className="max-w-sm text-xs text-museum-muted">
            Your browser could not create a 3D context. The rest of the museum
            remains open — enjoy the timeline, the lens and the audio guide.
          </p>
        </div>
      )}
    </div>
  );
}
