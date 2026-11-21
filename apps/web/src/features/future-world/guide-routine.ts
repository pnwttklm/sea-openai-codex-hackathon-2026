import type { Vector3 } from "three";
import type { Landmark } from "./landmarks";
import { townPath } from "./town-path";
import type { createWorldArt } from "./world-art";

type Guide = ReturnType<ReturnType<typeof createWorldArt>["townGuide"]>;
type Point = [number, number];

export function createGuideRoutine(guide: Guide, player: Vector3, walkable: (x: number, z: number) => boolean) {
  const { position, rotation } = guide.group;
  let route: Point[] = [];
  let activity: "idle" | "walk" | "look" | "write" = "idle";
  let elapsed = 0;
  let duration = 3;
  let goalId: string | undefined;
  let lastGoal: string | undefined;
  let talking = false;
  let greeted = false;
  let visits = 0;

  function begin(next: typeof activity, seconds = 0) {
    activity = next;
    elapsed = 0;
    duration = seconds;
    guide.pose(next, 0);
  }

  function reset() {
    route = [];
    goalId = undefined;
    if (!walkable(position.x, position.z)) position.set(-1.55, 0.07, 4.9);
    begin("idle", 2.5);
  }

  function face(x: number, z: number) {
    rotation.y = Math.atan2(x - position.x, z - position.z);
  }

  function chooseRoute(plots: Landmark[]) {
    let destinations: Point[];
    const candidates = plots.filter(plot => plot.plan.id !== lastGoal || plots.length === 1);
    goalId = undefined;
    if (candidates.length && (visits === 0 || Math.random() < 0.7)) {
      const plot = candidates[Math.floor(Math.random() * candidates.length)];
      const gap = plot.radius + 0.62;
      const side = position.x < plot.x ? -1 : 1;
      destinations = [[plot.x + side * gap, plot.z], [plot.x, plot.z + gap], [plot.x - side * gap, plot.z]];
      goalId = plot.plan.id;
    } else {
      const side = Math.random() < 0.5 ? -1 : 1;
      destinations = [[player.x + side * 1.35, player.z + 0.45], [side * 2.32, 0], [-side * 2.32, 4.82]];
    }
    const clear = (x: number, z: number) => walkable(x, z) && Math.hypot(x - player.x, z - player.z) > 0.75;
    for (const [x, z] of destinations) {
      if (!clear(x, z)) continue;
      route = townPath(position.x, position.z, x, z, clear);
      if (route.length) {
        visits++;
        begin("walk");
        return;
      }
    }
    reset();
  }

  function tick(dt: number, plots: Landmark[], reduced: boolean) {
    if (talking) return false;
    elapsed += dt;
    const distance = Math.hypot(position.x - player.x, position.z - player.z);
    if (distance > 2) greeted = false;
    if (activity === "walk" && distance < 1.3 && !greeted) {
      greeted = true;
      route = [];
      goalId = undefined;
      face(player.x, player.z);
      begin("idle", 3.5);
      return true;
    }
    if (activity === "walk") {
      const [x, z] = route[0];
      const dx = x - position.x, dz = z - position.z;
      const gap = Math.hypot(dx, dz);
      const fraction = gap ? Math.min(1, dt * 1.35 / gap) : 1;
      const nx = position.x + dx * fraction, nz = position.z + dz * fraction;
      if (!walkable(nx, nz) || Math.hypot(nx - player.x, nz - player.z) < 0.68) {
        reset();
        return true;
      }
      if (gap > 0.01) face(x, z);
      position.set(nx, position.y, nz);
      guide.pose("walk", reduced ? 0 : elapsed);
      if (fraction === 1) route.shift();
      if (!route.length) {
        const plot = plots.find(item => item.plan.id === goalId);
        if (plot) {
          face(plot.x, plot.z);
          lastGoal = goalId;
          begin("look", 1.6);
        } else {
          face(player.x, player.z);
          begin("idle", 3);
        }
      }
      return true;
    }
    if (elapsed >= duration) {
      if (activity === "look") begin("write", 4.8);
      else if (activity === "write") { goalId = undefined; begin("idle", 1.2); }
      else chooseRoute(plots);
      return true;
    }
    if (activity === "write" && !reduced) {
      guide.pose("write", elapsed);
      return true;
    }
    return false;
  }

  function startConversation() {
    const subject = activity === "write" || activity === "look" ? goalId : undefined;
    talking = true;
    face(player.x, player.z);
    guide.pose("idle", 0);
    return subject;
  }

  function endConversation() {
    if (!talking) return;
    talking = false;
    greeted = true;
    reset();
  }

  return { tick, reset, startConversation, endConversation };
}
