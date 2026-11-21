import * as THREE from "three";
import type { Landmark } from "./landmarks";
import { createWorldArt } from "./world-art";

import { createDogCompanion } from "./dog-companion";
import { createGuideRoutine } from "./guide-routine";
import { townPath } from "./town-path";

export type WorldScene = ReturnType<typeof mountWorld>;

type Options = {
  canvas: HTMLCanvasElement;
  houseId?: string;
  dogImage: HTMLImageElement;
  landmarks: Landmark[];
  onNearby: (id: string | null) => void;
  onInspect: (id: string) => void;
  onInterior: (id: string | null) => void;
  onAvailability: (available: boolean) => void;
};

export function mountWorld({ canvas, houseId, dogImage, landmarks, onNearby, onInspect, onInterior, onAvailability }: Options) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b8d2eb");
  const sky = new THREE.HemisphereLight("#fff7ea", "#e0b499", 1.75);
  scene.add(sky);
  const sun = new THREE.DirectionalLight("#fff0d8", 2.05);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.018;
  scene.add(sun, sun.target);

  const art = createWorldArt();
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 65);
  const player = art.nobita();
  const avatar = player.group;
  let heading = 0;
  avatar.scale.setScalar(1.12);
  const returnedHouse = landmarks.find(plot => plot.kind === "house" && plot.plan.id === houseId);
  const spawnX = returnedHouse ? returnedHouse.x + 0.55 : 0;
  const spawnZ = returnedHouse ? returnedHouse.z + 2.04 : 4.82;
  avatar.position.set(spawnX, 0.10, spawnZ);
  scene.add(avatar);
  const room = art.room();
  room.group.visible = false;
  scene.add(room.group);
  const outside = new THREE.Group();
  scene.add(outside);
  const guideArt = art.townGuide();
  const guide = guideArt.group;
  const dog = createDogCompanion(dogImage);
  dog.group.name = "shopee-dog";
  const companions = [guide, dog.group];
  const routine = createGuideRoutine(guideArt, avatar.position, canWalkTown, dog.group.position, true);
  const dogRoutine = createGuideRoutine(dog, avatar.position, canWalkTown, guide.position, false);
  guide.name = "town-guide";
  let path: [number, number][] = [];
  let north = -6.3;
  const highlights = new Map<string, THREE.Mesh>();
  const plots = new THREE.Group();
  outside.add(plots);
  let lawn: THREE.Group | undefined;
  let home: Landmark | undefined;
  let nearby: string | null = null;
  let dirty = true;
  let available = true;
  const stick = new THREE.Vector2();
  const walk = new THREE.Vector2();
  const keys = new Set<string>();
  const focus = new THREE.Vector3(0, 0, 0.55);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  function canWalk(x: number, z: number) {
    if (home) {
      if (Math.abs(x) > 4 || z < -3.5 || z > 4.1) return false;
      return !room.obstacles.some(({ min, max }) => x > min.x - 0.20 && x < max.x + 0.20 && z > min.z - 0.20 && z < max.z + 0.20);
    }
    return canWalkTown(x, z) && companions.every(({ position }) => Math.hypot(x - position.x, z - position.z) >= 0.58);
  }

  function canWalkTown(x: number, z: number) {
    if (Math.abs(x) > 6.95 || z < north + 0.62 || z > 5.57) return false;
    return landmarks.every(plot => Math.hypot(x - plot.x, z - plot.z) > plot.radius);
  }

  function updateNearby() {
    const { x, z } = avatar.position;
    let distance = 2.65;
    let id: string | null = null;
    if (home) {
      const frontDoor = Math.abs(x) < 1.12 && z >= 2.72;
      const backDoor = Math.abs(x - 0.75) < 0.82 && z < -2.36;
      id = frontDoor || backDoor ? "house-exit" : home.plan.id;
    } else {
      for (const plot of landmarks) {
        const gap = Math.hypot(x - plot.x, z - plot.z);
        if (gap < distance) { id = plot.plan.id; distance = gap; }
      }
      for (const companion of companions) {
        const gap = Math.hypot(x - companion.position.x, z - companion.position.z);
        if (gap < Math.min(distance, 2)) { id = companion.name; distance = gap; }
      }
    }
    if (id !== nearby) {
      if (nearby && highlights.has(nearby)) highlights.get(nearby)!.visible = false;
      if (id && highlights.has(id)) highlights.get(id)!.visible = true;
      nearby = id;
      onNearby(id);
    }
  }

  function placeInterior() {
    const scale = home ? 2.8 : 1;
    outside.scale.setScalar(scale);
    outside.position.set(home ? -home.x * scale : 0, 0, home ? -home.z * scale : 0);
    room.group.visible = Boolean(home);
    for (const plot of plots.children) plot.visible = plot.name !== home?.plan.id;
  }

  function enterHouse(id: string) {
    const house = landmarks.find(plot => plot.kind === "house" && plot.plan.id === id);
    if (!house) return;
    stop();
    home = house;
    avatar.position.set(0, 0.10, 1.55);
    heading = 0;
    placeInterior();
    updateNearby();
    resize();
    onInterior(id);
  }

  function exitHouse() {
    if (!home) return;
    stop();
    avatar.position.set(home.x + 0.55, 0.10, home.z + 2.04);
    home = undefined;
    heading = 0;
    placeInterior();
    updateNearby();
    resize();
    onInterior(null);
  }

  function setLandmarks(next: Landmark[]) {
    if (lawn && next.length === landmarks.length && next.every((v,i) => v.plan.id === landmarks[i].plan.id && v.kind === landmarks[i].kind)) {
      landmarks = next;
      return;
    }
    landmarks = next;
    if (home) {
      const current = next.find(plot => plot.plan.id === home?.plan.id && plot.kind === "house");
      if (current) home = current;
      else exitHouse();
    }
    plots.clear();
    path = [];
    highlights.clear();
    plots.add(...companions);
    if (lawn) outside.remove(lawn);
    north = -6.3 - Math.ceil(Math.max(0, next.length - 6) / 3) * 5.45;
    lawn = art.townGround(north);
    outside.add(lawn);
    for (const plot of next) {
      const { group, highlight } = art.landmark(plot.kind);
      highlights.set(plot.plan.id, highlight);
      highlight.visible = nearby === plot.plan.id;
      group.name = plot.plan.id;
      group.position.set(plot.x, 0, plot.z);
      plots.add(group);
    }
    routine.reset();
    dogRoutine.reset();
    placeInterior();
    if (!canWalk(avatar.position.x, avatar.position.z)) avatar.position.set(0, 0.10, home ? 1.55 : 4.82);
    dirty = true;
    updateNearby();
  }

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const height = !home ? Math.max(13.8, Math.min(19, 12.6 / aspect)) : Math.max(6.9, Math.min(9.8, 5.75 / aspect));
    camera.top = height / 2;
    camera.bottom = -camera.top;
    camera.right = height * aspect / 2;
    camera.left = -camera.right;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function stop() { path = []; stick.set(0, 0); keys.clear(); }
  function visibility() { if (document.hidden) stop(); }
  let previous = 0, phase = 0;
  function render(now: number) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!available || document.hidden) return;
    walk.copy(stick);
    if (keys.has("arrowleft") || keys.has("a")) walk.x -= 1;
    if (keys.has("arrowright") || keys.has("d")) walk.x += 1;
    if (keys.has("arrowup") || keys.has("w")) walk.y -= 1;
    if (keys.has("arrowdown") || keys.has("s")) walk.y += 1;
    walk.clampLength(0, 1).multiplyScalar(3.65 * dt);
    if (!home && walk.lengthSq()) {
      path = [];
      const angle = Math.atan2(6, 15);
      const { x, y } = walk;
      walk.set(x * Math.cos(angle) + y * Math.sin(angle), y * Math.cos(angle) - x * Math.sin(angle));
    } else if (path.length) {
      const [x, z] = path[0];
      walk.set(x - avatar.position.x, z - avatar.position.z);
      if (walk.length() <= 3.65 * dt) path.shift();
      walk.clampLength(0, 3.65 * dt);
    }
    if (walk.lengthSq() > 0) {
      const {x,z} = avatar.position;
      const throughFront = Math.abs(x) < 0.88 && z + walk.y >= 3.70 && walk.y > 0;
      const throughBack = Math.abs(x - 0.75) < 0.52 && z + walk.y < -3.21 && walk.y < 0;
      if (home && (throughFront || throughBack)) { exitHouse(); return; }
      if (canWalk(x + walk.x, z)) avatar.position.x += walk.x;
      if (canWalk(avatar.position.x, z + walk.y)) avatar.position.z += walk.y;
      if (x === avatar.position.x && z === avatar.position.z) path = [];
      heading = Math.atan2(walk.x, walk.y);
      phase += reduced.matches ? 0 : walk.length() * 4.6;
      updateNearby();
      dirty = true;
    } else if (phase) { phase = 0; dirty = true; }
    if (!home) {
      const guideMoved = routine.tick(dt, landmarks, reduced.matches);
      const dogMoved = dogRoutine.tick(dt, landmarks, reduced.matches);
      if (guideMoved || dogMoved) { updateNearby(); dirty = true; }
    }
    if (!dirty) return;
    player.pose(heading, phase);
    focus.set(avatar.position.x, 0.14, avatar.position.z - 1.48);
    if (!home) {
      focus.x *= canvas.clientWidth > canvas.clientHeight ? 0.38 : 0.87;
      const wide = canvas.clientWidth > canvas.clientHeight;
      focus.z = THREE.MathUtils.clamp(avatar.position.z - 1.05, north + 2.5, wide ? 0.3 : 2.4);
    }
    camera.position.set(focus.x + (home ? 0 : 6), home ? 14 : 16, focus.z + (home ? 10 : 15));
    camera.lookAt(focus);
    sun.target.position.copy(focus);
    sun.position.set(focus.x - 5, 11, focus.z + 3);
    renderer.render(scene, camera);
    dirty = false;
  }

  const ray = new THREE.Raycaster();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();
  function inspect(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(2 * (x - rect.left) / rect.width - 1, 1 - 2 * (y - rect.top) / rect.height), camera);
    const hit = ray.intersectObjects(home ? [room.group] : plots.children)[0];
    if (!hit) {
      if (!home && ray.ray.intersectPlane(floor, hitPoint) && canWalk(hitPoint.x, hitPoint.z)) {
        path = townPath(avatar.position.x, avatar.position.z, hitPoint.x, hitPoint.z, canWalk);
      }
      return;
    }
    if (nearby === "house-exit" && home && (hit.object.userData.exit || hit.object.parent?.userData.exit)) {
      exitHouse();
      return;
    }
    if (home) { onInspect(home.plan.id); return; }
    let root = hit.object;
    while (root.parent && root.parent !== plots) root = root.parent;
    onInspect(root.name);
  }

  function lose(event: Event) { event.preventDefault(); available = false; stop(); onAvailability(false); }
  function restore() { available = true; dirty = true; onAvailability(true); }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener("blur", stop);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", lose);
  canvas.addEventListener("webglcontextrestored", restore);
  setLandmarks(landmarks);
  resize();
  renderer.setAnimationLoop(render);
  onAvailability(true);
  return {
    setLandmarks, inspect, stop, enterHouse, exitHouse,
    startConversation(id: string) {
      dirty = true;
      return (id === dog.group.name ? dogRoutine : routine).startConversation();
    },
    endConversation() { routine.endConversation(); dogRoutine.endConversation(); dirty = true; },
    setNight(night: boolean) {
      scene.background = new THREE.Color(night ? "#27234f" : "#b8d2eb");
      sky.color.set(night ? "#b0bbff" : "#fff7ea");
      sky.intensity = night ? 1.03 : 1.75;
      sun.color.set(night ? "#ced5ff" : "#fff0d8");
      sun.intensity = night ? 0.75 : 2.05;
      dirty = true;
    },
    setStick(x: number, y: number) { stick.set(x, y); },
    key(key: string, down: boolean) { if (down) keys.add(key); else keys.delete(key); },
    dispose() {
      observer.disconnect();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", lose);
      canvas.removeEventListener("webglcontextrestored", restore);
      renderer.setAnimationLoop(null);
      sun.shadow.dispose();
      dog.dispose();
      art.dispose();
      renderer.dispose();
    },
  };
}
