import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { landmarkStyles, type LandmarkKind } from "./landmarks";

type Group = THREE.Group;
const cream = "#fff2db";
const bark = "#b8885c";

const pink = "#f397ac";
const dark = "#384259";
const glass = "#80c7e5";
const stone = "#ded7bd";

export function createWorldArt() {
  const geometries = new Map<string, THREE.BufferGeometry>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();

  function mesh(parent: Group, key: string, factory: () => THREE.BufferGeometry, color: string, x: number, y: number, z: number) {
    let geometry = geometries.get(key);
    if (!geometry) {
      geometry = factory();
      geometries.set(key, geometry);
    }
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.84 });
      materials.set(color, material);
    }
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }

  function box(parent: Group, color: string, x: number, y: number, z: number, w: number, h: number, d: number, radius = 0.07) {
    return mesh(parent, `b-${w}-${h}-${d}-${radius}`, () => new RoundedBoxGeometry(w, h, d, 2, radius), color, x, y, z);
  }

  function sphere(parent: Group, color: string, x: number, y: number, z: number, w: number, h = w, d = w) {
    const part = mesh(parent, "sphere", () => new THREE.SphereGeometry(1, 16, 10), color, x, y, z);
    part.scale.set(w, h, d);
    return part;
  }

  function cylinder(parent: Group, color: string, x: number, y: number, z: number, radius: number, height: number, sides = 24, bottom = radius) {
    return mesh(parent, `c-${radius}-${bottom}-${height}-${sides}`, () => new THREE.CylinderGeometry(radius, bottom, height, sides), color, x, y, z);
  }

  function ring(parent: Group, color: string, x: number, y: number, z: number, radius: number, tube: number) {
    return mesh(parent, `r-${radius}-${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 40), color, x, y, z);
  }

  function tree(parent: Group, x: number, z: number, size: number, color = "#669e61") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(size);
    parent.add(group);
    cylinder(group, bark, 0, 0.52, 0, 0.12, 1.04, 9, 0.18);
    sphere(group, color, 0, 1.23, 0, 0.60, 0.72, 0.58);
    sphere(group, color, -0.38, 1.02, 0.12, 0.36);
    sphere(group, color, 0.34, 1.18, -0.08, 0.39);
  }

  function flower(parent: Group, x: number, z: number, color: string) {
    cylinder(parent, "#668a47", x, 0.10, z, 0.022, 0.2, 6);
    sphere(parent, color, x, 0.21, z, 0.095, 0.043, 0.087);
    sphere(parent, "#ffdc78", x, 0.25, z, 0.032);
  }

  function fence(parent: Group, x: number, z: number, length: number) {
    box(parent, cream, x, 0.27, z, length, 0.085, 0.10);
    for (let offset = -length / 2; offset <= length / 2 + 0.01; offset += 0.49) {
      box(parent, cream, x + offset, 0.20, z, 0.10, 0.46, 0.12);
    }
  }

  function townGround(back: number) {
    const group = new THREE.Group();
    const depth = 6.15 - back;
    const center = back + depth / 2;
    box(group, "#697984", 0, -1.12, center, 16.45, 0.55, depth - 0.45, 0.25);
    box(group, "#b79b76", 0, -0.68, center, 16.75, 0.74, depth - 0.16, 0.30);
    box(group, "#91bc75", 0, -0.21, center, 16.9, 0.46, depth, 0.21);
    for (const x of [-2.32, 2.32]) {
      box(group, "#e6d1aa", x, 0.035, center, 0.93, 0.04, depth - 1.1);
    }
    for (let z = 0; z > back + 0.45; z -= 5.45) {
      box(group, "#eddbb8", 0, 0.04, z, 14, 0.04, 1.24);
      for (let x = -6; x <= 6; x += 0.8) box(group, "#f6e6c9", x, 0.067, z, 0.59, 0.023, 0.75);
    }
    box(group, "#e5d1a6", 0, 0.036, 4.86, 5.30, 0.04, 0.77);
    for (let z = 4.7; z >= back + 0.4; z -= 2.36) {
      tree(group, -7.55, z, 0.92, "#7ca76a");
      tree(group, 7.54, z - 0.27, 0.82, "#a3b977");
      flower(group, -6.56, z + 0.15, pink);
      flower(group, 6.61, z - 0.14, cream);
    }
    for (const x of [-4.48, 4.48]) {
      fence(group, x, 5.55, 3.92);
      fence(group, x, back + 0.3, 3.92);
    }
    cylinder(group, "#e3d4bb", 0, 0.08, 4.82, 0.86, 0.10);
    ring(group, cream, 0, 0.143, 4.82, 0.66, 0.03).rotation.x = -Math.PI / 2;
    for (const x of [-1.20, 1.20]) {
      cylinder(group, bark, x, 0.43, 5.57, 0.055, 0.86);
      sphere(group, "#fff0b5", x, 0.91, 5.57, 0.15);
    }
    return group;
  }

  function townGuide() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const feet = [-1, 1].map(side => sphere(body, cream, side * 0.16, 0.15, 0.06, 0.16, 0.12, 0.19));
    sphere(body, "#429ede", 0, 0.47, 0, 0.35, 0.37, 0.29);
    sphere(body, cream, 0, 0.45, 0.20, 0.25, 0.25, 0.12);
    const head = new THREE.Group();
    head.position.y = 0.75;
    body.add(head);
    sphere(head, "#409edf", 0, 0.19, 0, 0.44, 0.40, 0.35);
    sphere(head, cream, 0, 0.16, 0.18, 0.34, 0.28, 0.20);
    for (const side of [-1, 1]) {
      sphere(head, cream, side * 0.075, 0.31, 0.31, 0.079, 0.10, 0.05);
      sphere(head, dark, side * 0.055, 0.30, 0.356, 0.027, 0.042, 0.017);
      for (const row of [-1, 0, 1]) {
        box(head, dark, side * 0.24, 0.14 + row * 0.047, 0.33, 0.16, 0.011, 0.012, 0.004).rotation.z = row * side * 0.19;
      }
    }
    sphere(head, "#e64b50", 0, 0.21, 0.39, 0.061);
    cylinder(body, "#cf4248", 0, 0.68, 0, 0.295, 0.065);
    sphere(body, "#ffca47", 0, 0.64, 0.29, 0.062);
    const paws = [-1, 1].map(side => sphere(body, cream, side * 0.32, 0.46, 0.12, 0.095));
    const notebook = new THREE.Group();
    notebook.position.set(0, 0.49, 0.41);
    notebook.rotation.x = 0.28;
    body.add(notebook);
    box(notebook, "#31506e", 0, 0, 0, 0.49, 0.045, 0.34, 0.02);
    box(notebook, "#fff4d9", 0, 0.03, 0, 0.45, 0.025, 0.30, 0.012);
    const strokes = [-0.075, 0, 0.075].map(z =>
      box(notebook, "#526477", 0, 0.046, z, 0.23, 0.005, 0.012, 0.002));
    const pencil = cylinder(body, "#f59b37", 0, 0, 0, 0.024, 0.24, 8);
    pencil.rotation.z = -0.44;
    function pose(action: "idle" | "walk" | "look" | "write", t: number) {
      const step = action === "walk" ? Math.sin(t * 9) : 0;
      body.position.y = Math.abs(step) * 0.035;
      feet.forEach((foot, i) => { foot.position.z = 0.06 + step * (i ? 0.09 : -0.09); });
      head.rotation.x = action === "write" ? 0.30 : action === "look" ? -0.12 : 0;
      const writing = action === "write";
      notebook.visible = pencil.visible = writing;
      paws[0].position.set(writing ? -0.23 : -0.32, writing ? 0.50 : 0.46, writing ? 0.40 : 0.12 + step * 0.07);
      const stroke = (t * 0.95) % 3;
      pencil.position.set(-0.06 + (stroke % 1) * 0.23, 0.65, 0.40 + (Math.floor(stroke) - 1) * 0.075);
      if (writing) {
        paws[1].position.copy(pencil.position);
        strokes.forEach((line, i) => {
          const ink = THREE.MathUtils.clamp(stroke - i, 0.01, 1);
          line.scale.x = ink;
          line.position.x = (ink - 1) * 0.115;
        });
      } else paws[1].position.set(0.32, 0.46, 0.12 - step * 0.07);
    }
    pose("idle", 0);
    g.position.set(-1.55, 0.07, 4.9);
    g.rotation.y = 0.28;
    return { group: g, pose };
  }

  function room() {
    const g = new THREE.Group();
    const obstacles: THREE.Box3[] = [];
    function solid(part: THREE.Object3D) {
      obstacles.push(new THREE.Box3().setFromObject(part));
    }
    box(g, "#eebd85", 0, 0.035, 0, 8.4, 0.12, 7.4);
    solid(box(g, "#fff0d9", 0, 1.11, -3.61, 8.4, 2.24, 0.19));
    for (const side of [-1, 1]) {
      solid(box(g, "#fff0dc", side * 4.11, 0.61, 0, 0.18, 1.28, 7.4));
      solid(box(g, "#9ccdf3", side * 2.61, 0.44, 3.62, 3.18, 0.88, 0.19));
      box(g, cream, side * 2.61, 0.92, 3.62, 3.20, 0.12, 0.25);
      sphere(g, "#71b849", side * 2.72, 0.35, 4.0, 0.72, 0.52, 0.5);
    }
    box(g, cream, 0, 0.04, 3.96, 2.08, 0.11, 0.71).userData.exit = true;
    box(g, "#c58e64", 0, 0.11, 3.21, 1.28, 0.035, 0.54).userData.exit = true;
    // Window, built-in kitchen and refrigerator along the back wall.
    box(g, "#b68057", -2.67, 1.53, -3.46, 2.3, 1.14, 0.12);
    box(g, "#95d7de", -2.67, 1.53, -3.38, 2.1, 0.97, 0.06);
    box(g, cream, -2.67, 1.53, -3.32, 0.07, 1.02, 0.06);
    solid(box(g, "#9abd54", -3.52, 0.57, -1.9, 1.0, 1.00, 2.7));
    box(g, "#fff5d5", -3.52, 1.1, -1.9, 1.12, 0.13, 2.78);
    for (const z of [-2.7,-1.96,-1.22]) {
      box(g, "#d4df78", -2.99, 0.79, z, 0.05, 0.33, 0.61);
      sphere(g, cream, -2.94, 0.80, z, 0.045);
    }
    solid(box(g, "#ef9946", -2.05, 0.94, -2.70, 1.10, 1.76, 1.02, 0.10));
    box(g, "#ffac52", -2.05, 1.45, -2.16, 1.09, 0.71, 0.12);
    box(g, "#f69a4d", -2.05, 0.58, -2.16, 1.09, 0.96, 0.12);
    box(g, cream, -1.66, 1.34, -2.08, 0.05, 0.29, 0.07);
    box(g, "#b9cf5e", -2.21, 1.49, -2.082, 0.17, 0.19, 0.027);
    const door = new THREE.Group();
    door.userData.exit = true;
    g.add(door);
    box(door, "#b67950", 0.75, 1.08, -3.46, 1.18, 2.03, 0.14);
    box(door, "#9bc5d0", 0.75, 1.43, -3.36, 0.84, 0.94, 0.07);
    box(door, "#c99568", 0.75, 1.43, -3.31, 0.065, 0.97, 0.045);
    box(door, "#c99568", 0.75, 1.43, -3.31, 0.88, 0.075, 0.045);
    sphere(door, "#ffe2a2", 0.33, 0.94, -3.34, 0.077);
    // Pedestal fan with a perforated-looking radial guard.
    const fx = -0.49, fz = -2.86;
    solid(cylinder(g, "#67acda", fx, 0.16, fz, 0.26, 0.13));
    cylinder(g, "#6bb5e6", fx, 0.61, fz, 0.047, 0.90);
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      const blade = sphere(g, "#8bcbee", fx + 0.16 * Math.sin(angle), 1.27 + 0.16 * Math.cos(angle), fz, 0.10, 0.21, 0.045);
      blade.rotation.z = -angle;
    }
    ring(g, "#579ccc", fx, 1.27, fz + 0.07, 0.35, 0.025);
    for (let i = 0; i < 8; i++) box(g, "#72b6e6", fx, 1.27, fz + 0.085, 0.018, 0.69, 0.027).rotation.z = i * Math.PI / 8;
    sphere(g, "#65a6d7", fx, 1.27, fz + 0.11, 0.088);
    // Dining nook and upholstered sofa leave an open aisle to the front door.
    box(g, "#edc4af", -2.52, 0.11, 1.04, 2.50, 0.04, 2.7);
    solid(box(g, "#bd8074", -2.36, 0.79, 0.98, 1.60, 0.15, 1.26, 0.09));
    for (const x of [-2.98,-1.74]) for (const z of [0.50,1.46]) cylinder(g, bark, x, 0.41, z, 0.07, 0.70);
    for (const side of [-1,1]) {
      const z = 0.98 + side * 0.91;
      solid(box(g, "#e5b370", -2.35, 0.49, z, 0.68, 0.15, 0.62));
      for (const x of [-2.61,-2.09]) {
        cylinder(g, bark, x, 0.32, z, 0.054, 0.48);
        cylinder(g, "#e4b375", x, 0.73, z + side * 0.26, 0.045, 0.6);
      }
      box(g, "#f3c98c", -2.35, 1.0, z + side * 0.26, 0.68, 0.20, 0.09);
    }
    for (const z of [0.64,1.32]) {
      cylinder(g, cream, -2.40, 0.89, z, 0.21, 0.045);
      sphere(g, "#e8b960", -2.40, 0.95, z, 0.11, 0.065, 0.08);
    }
    box(g, "#e6b5a4", 2.46, 0.11, 0.46, 2.63, 0.047, 3.17);
    solid(box(g, "#e59598", 2.4, 0.48, 0.28, 1.18, 0.64, 2.55, 0.16));
    box(g, "#efa4a7", 2.94, 0.93, 0.28, 0.30, 0.94, 2.56, 0.13);
    for (const z of [-0.85,1.41]) box(g, "#eda2a2", 2.4, 0.77, z, 1.20, 0.43, 0.27, 0.12);
    for (const z of [-0.29,0.75]) {
      box(g, "#f4b1ac", 2.32, 0.80, z, 0.91, 0.17, 0.94);
      box(g, "#ffe1a3", 2.66, 1.08, z, 0.22, 0.48, 0.47, 0.10).rotation.z = -0.21;
    }
    cylinder(g, "#b78661", 3.40, 0.65, -2.75, 0.08, 1.13);
    cylinder(g, "#f3c878", 3.40, 1.34, -2.75, 0.25, 0.40, 20, 0.42);
    cylinder(g, bark, 3.40, 0.16, -2.75, 0.29, 0.13);
    return { group: g, obstacles };
  }

  function house(group: Group) {
    box(group, "#e7b987", 0, 0.22, 0, 3.05, 0.33, 2.48, 0.14);
    box(group, "#f2cc9c", 0, 0.42, 0.05, 2.90, 0.11, 2.26);
    box(group, "#b4d5eb", 0, 1.11, -1.1, 3.02, 1.36, 0.16);
    box(group, cream, 0, 1.80, -1.1, 3.10, 0.12, 0.23);
    for (const x of [-1.43, 1.43]) {
      box(group, "#b4d5eb", x, 0.95, -0.35, 0.17, 1.04, 1.51);
      box(group, cream, x, 1.51, -0.35, 0.23, 0.10, 1.62);
    }
    box(group, cream, -0.56, 1.28, -0.991, 0.99, 0.72, 0.07);
    box(group, glass, -0.56, 1.28, -0.945, 0.84, 0.57, 0.05);
    box(group, cream, -0.56, 1.28, -0.91, 0.052, 0.64, 0.04);
    box(group, "#93b988", 0.74, 0.77, -0.71, 1.10, 0.55, 0.51);
    box(group, cream, 0.74, 1.05, -0.71, 1.18, 0.09, 0.6);
    box(group, "#d8ac86", 0.93, 1.15, -0.70, 0.36, 0.11, 0.30);
    box(group, pink, -0.72, 0.57, -0.10, 1.2, 0.26, 0.60, 0.11);
    box(group, "#ed88a2", -0.72, 0.81, -0.35, 1.23, 0.40, 0.20);
    for (const x of [-1.24, -0.20]) box(group, pink, x, 0.71, -0.08, 0.19, 0.27, 0.64);
    box(group, "#f9db8f", -0.83, 0.77, -0.22, 0.27, 0.14, 0.21).rotation.y = 0.24;
    box(group, "#e5a5a5", -0.06, 0.485, 0.53, 1.83, 0.035, 0.85);
    cylinder(group, bark, 0.16, 0.59, 0.47, 0.075, 0.23);
    box(group, "#e8b56f", 0.16, 0.72, 0.47, 0.73, 0.09, 0.44);
    cylinder(group, "#81ae8c", 0.21, 0.804, 0.44, 0.073, 0.10, 12, 0.05);
    box(group, cream, 0.90, 0.24, 1.30, 0.86, 0.16, 0.36);
    cylinder(group, "#e79e79", 1.13, 0.58, 0.83, 0.16, 0.26, 12, 0.11);
    sphere(group, "#78ab72", 1.13, 0.86, 0.83, 0.21, 0.33, 0.18);
  }

  function car(group: Group) {
    box(group, "#7e8c9c", 0, 0.20, 0, 2.7, 0.18, 1.67, 0.13);
    for (const x of [-0.68, 0.68]) {
      for (const z of [-0.57, 0.57]) {
        cylinder(group, dark, x, 0.47, z, 0.28, 0.19, 20).rotation.x = Math.PI / 2;
        cylinder(group, cream, x, 0.47, z * 1.21, 0.125, 0.045, 16).rotation.x = Math.PI / 2;
      }
    }
    box(group, "#f68479", 0, 0.63, 0, 2.15, 0.43, 1.15, 0.18);
    box(group, "#f99e91", 0, 0.87, 0, 1.12, 0.46, 1.03, 0.20);
    box(group, "#567c9c", 0.06, 0.96, 0.511, 0.76, 0.22, 0.045, 0.02);
    box(group, "#f99e91", 0.04, 0.96, 0.54, 0.062, 0.22, 0.04);
    box(group, "#567c9c", 0.49, 0.96, 0, 0.10, 0.21, 0.82).rotation.z = 0.26;
    for (const z of [-0.36, 0.36]) box(group, "#fff4c0", 1.075, 0.70, z, 0.06, 0.13, 0.19);
    box(group, cream, 1.02, 0.49, 0, 0.15, 0.105, 0.99);
  }

  function wedding(group: Group) {
    cylinder(group, "#f1d5c6", 0, 0.22, 0, 1.22, 0.18, 24);
    box(group, "#e79eb3", 0, 0.26, 0.80, 0.65, 0.11, 1.3);
    const arch = ring(group, cream, 0, 1.36, -0.42, 0.72, 0.085);
    arch.scale.y = 1.09;
    for (const x of [-0.72, 0.72]) {
      cylinder(group, cream, x, 0.76, -0.42, 0.075, 0.95);
      sphere(group, "#81a66a", x, 1.82, -0.42, 0.23, 0.31, 0.23);
      for (let index = 0; index < 5; index += 1) {
        sphere(group, index % 2 ? pink : "#ffe2ac", x + Math.sin(index * 2) * 0.18, 1.58 + index * 0.12, -0.24, 0.12);
      }
    }
    for (const x of [-0.58, 0.58]) {
      box(group, "#d7a47d", x, 0.46, 0.60, 0.45, 0.11, 0.33);
      for (const leg of [-0.15, 0.15]) box(group, bark, x + leg, 0.36, 0.6, 0.07, 0.21, 0.26);
    }
  }

  function retreat(group: Group) {
    const water = cylinder(group, "#80c9cb", 0.40, 0.17, 0.15, 0.84, 0.08, 28);
    water.scale.set(1, 1, 0.77);
    for (const [x, z] of [[1, 0.63], [0.19, 0.63], [0.38, -0.36]]) {
      cylinder(group, "#79a96e", x, 0.225, z, 0.15, 0.035, 12);
      sphere(group, "#f2add0", x, 0.29, z, 0.085, 0.06, 0.085);
    }
    tree(group, -0.78, -0.4, 0.93, "#b1c77e");
    box(group, "#ce936c", -0.43, 0.41, 0.75, 0.80, 0.13, 0.32);
    box(group, "#e5af83", -0.43, 0.61, 0.61, 0.80, 0.24, 0.09);
    for (const x of [-0.70, -0.17]) box(group, bark, x, 0.26, 0.75, 0.08, 0.31, 0.27);
    sphere(group, stone, 1.14, 0.23, -0.54, 0.26, 0.17, 0.21);
    sphere(group, stone, 0.91, 0.19, -0.66, 0.16, 0.11, 0.14);
  }

  function machine(group: Group) {
    cylinder(group, "#a9a4d8", 0, 0.23, 0, 1.1, 0.27, 12);
    cylinder(group, "#6265a8", 0, 0.43, 0, 0.91, 0.22);
    ring(group, "#a3e8f1", 0, 0.49, 0, 0.88, 0.055).rotation.x = -Math.PI / 2;
    ring(group, "#7a72c9", 0, 1.31, -0.17, 0.72, 0.13);
    ring(group, "#c9c1ff", 0, 1.31, -0.048, 0.72, 0.035);
    const core = sphere(group, "#9c93e8", 0, 1.26, -0.17, 0.48, 0.54, 0.11);
    core.material.emissive.set("#5745a4");
    sphere(group, "#fff3be", 0, 1.32, 0.03, 0.22, 0.22, 0.12);
    for (const x of [-0.77, 0.77]) {
      cylinder(group, "#8b8ad1", x, 0.53, 0.31, 0.15, 0.39);
      sphere(group, "#e8efff", x, 0.78, 0.31, 0.13);
    }
  }

  function travel(group: Group) {
    box(group, "#b1c7dc", 0, 0.18, 0, 2.22, 0.17, 1.45, 0.12);
    box(group, cream, 0, 0.28, 0.16, 1.9, 0.033, 0.065);
    const plane = new THREE.Group();
    plane.rotation.y = -0.32;
    group.add(plane);
    sphere(plane, cream, 0, 0.80, 0, 0.91, 0.23, 0.25);
    sphere(plane, "#6ca8d5", 0.48, 0.94, 0, 0.28, 0.14, 0.19);
    box(plane, "#86bae1", -0.15, 0.76, 0, 0.41, 0.09, 1.85).rotation.y = -0.24;
    box(plane, "#86bae1", -0.68, 0.98, 0, 0.35, 0.47, 0.09).rotation.z = 0.27;
  }

  function personal(group: Group) {
    cylinder(group, "#d9b29a", 0, 0.22, 0, 0.91, 0.20, 12);
    cylinder(group, "#7b6b9b", -0.23, 0.94, 0, 0.05, 1.22, 12);
    box(group, "#f7c26b", 0.18, 1.36, 0, 0.78, 0.40, 0.08).rotation.y = 0.16;
    sphere(group, "#fff0b2", -0.23, 1.58, 0, 0.08);
    for (const x of [-0.65, 0.38, 0.62]) flower(group, x, 0.54, "#fff0ba");
  }

  const models = { house, car, wedding, retreat, machine, travel, personal };

  function landmark(kind: LandmarkKind) {
    const group = new THREE.Group();
    const base = cylinder(group, "#a2c874", 0, 0.083, 0, 1.75, 0.15, 32);
    base.scale.z = 0.86;
    models[kind](group);
    const highlight = ring(group, landmarkStyles[kind].color, 0, 0.16, 0, 1.70, 0.043);
    highlight.rotation.x = -Math.PI / 2;
    highlight.scale.y = 0.86;
    highlight.castShadow = false;
    highlight.visible = false;
    return { group, highlight };
  }

  function dispose() {
    for (const geometry of geometries.values()) geometry.dispose();
    for (const material of materials.values()) material.dispose();
    geometries.clear();
    materials.clear();
  }

  return { townGround, townGuide, room, landmark, dispose };
}
