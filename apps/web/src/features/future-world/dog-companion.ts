import * as THREE from "three";

// The three equal atlas cells contain the original front, back, and left profile drawings.
export function createDogCompanion(image: HTMLImageElement) {
  const group = new THREE.Group();
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(1 / 3, 1);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, toneMapped: false, depthWrite: false });
  const drawing = new THREE.Sprite(material);
  drawing.center.set(0.5, 0.022);
  drawing.scale.set(1.24, 1.65, 1);
  group.add(drawing);

  const shadowShape = new THREE.CircleGeometry(1, 24);
  const shadowPaint = new THREE.MeshBasicMaterial({ color: "#594044", opacity: 0.20, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowShape, shadowPaint);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.35, 0.22, 1);
  group.add(shadow);
  drawing.renderOrder = 1;

  group.position.set(1.65, 0.10, 4.85);
  group.scale.setScalar(0.81);
  function pose(action: "idle" | "walk" | "look" | "write", elapsed: number) {
    const step = action === "walk" ? elapsed * 8 : 0;
    const angle = group.rotation.y - Math.atan2(6, 15);
    const right = Math.sin(angle), forward = Math.cos(angle);
    const profile = Math.abs(right) > Math.abs(forward);
    const cell = profile ? 2 : forward < 0 ? 1 : 0;
    const mirror = profile && right > 0;
    texture.repeat.x = (mirror ? -1 : 1) / 3;
    texture.offset.x = (cell + Number(mirror)) / 3;
    drawing.position.y = 0.025 + Math.abs(Math.sin(step)) * 0.065;
    material.rotation = action === "look" ? 0.11 : Math.sin(step) * 0.034;
  }

  pose("idle", 0);
  return {
    group, pose,
    dispose() {
      texture.dispose();
      material.dispose();
      shadowShape.dispose();
      shadowPaint.dispose();
    },
  };
}
