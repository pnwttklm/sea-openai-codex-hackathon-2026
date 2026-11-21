// Search the walkable half-metre cells so a tap across a building follows its perimeter.
export function townPath(startX: number, startZ: number, endX: number, endZ: number,
  canWalk: (x: number, z: number) => boolean): [number, number][] {
  const cell = 0.4;
  const key = (x: number, z: number) => x + "," + z;
  const start = [Math.round(startX / cell), Math.round(startZ / cell)];
  const end = [Math.round(endX / cell), Math.round(endZ / cell)];
  const parents = new Map<string, number>();
  const queue = [start];
  parents.set(key(start[0], start[1]), -1);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    if (x === end[0] && z === end[1]) {
      const path: [number, number][] = [[endX, endZ]];
      for (let j = i; j > 0;) {
        const [px, pz] = queue[j];
        path.push([px * cell, pz * cell]);
        j = parents.get(key(px, pz))!;
      }
      return path.reverse();
    }
    for (const [dx, dz] of [[1,0], [-1,0], [0,1], [0,-1]]) {
      const nx = x + dx, nz = z + dz, id = key(nx, nz);
      if (!parents.has(id) && canWalk(nx * cell, nz * cell)) {
        parents.set(id, i);
        queue.push([nx, nz]);
      }
    }
  }
  return [];
}
