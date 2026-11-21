import { faCarSide, faFlag, faHeart, faHouse, faMugHot, faPlane, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import type { GoalPlan } from "../goals/demo-goals";

export const landmarkStyles = {
  house: { name: "Home", icon: faHouse, color: "#ffd080" },
  car: { name: "Car", icon: faCarSide, color: "#ff9b8e" },
  wedding: { name: "Celebration", icon: faHeart, color: "#ffabc9" },
  retreat: { name: "Retreat", icon: faMugHot, color: "#bfe68c" },
  machine: { name: "Time machine", icon: faWandMagicSparkles, color: "#b6acff" },
  travel: { name: "Travel", icon: faPlane, color: "#9dddff" },
  personal: { name: "Personal goal", icon: faFlag, color: "#ffd080" },
};

export type LandmarkKind = keyof typeof landmarkStyles;
export type Landmark = { plan: GoalPlan; kind: LandmarkKind; x: number; z: number; radius: number };

function goalKind(plan: GoalPlan): LandmarkKind {
  switch (plan.id) {
    case "dream-home": return "house";
    case "wedding": return "wedding";
    case "retirement": return "retreat";
    case "time-machine": return "machine";
  }
  const title = plan.title.normalize("NFKC").toLowerCase();
  if (/\b(house|home|condo|apartment|property|townhouse|villa)\b|บ้าน|คอนโด/u.test(title)) return "house";
  if (/\b(car|suv|truck|vehicle|motorcycle|motorbike|tesla|ev)\b|รถยนต์|รถคัน|ซื้อรถ|^รถ$/u.test(title)) return "car";
  if (/\b(wedding|marry|marriage)\b|แต่งงาน/u.test(title)) return "wedding";
  if (/\b(retire|retirement|garden)\b|เกษียณ/u.test(title)) return "retreat";
  if (/\b(travel|trip|vacation|holiday|flight)\b|ท่องเที่ยว|เที่ยว/u.test(title)) return "travel";
  if (/\btime[ -]machine\b/u.test(title)) return "machine";
  return "personal";
}

const townPlots = [[-4.65, 2.65], [4.65, -2.8], [4.65, 2.65], [0, -2.8], [-4.65, -2.8], [0, 2.65]];

export function worldLandmarks(plans: GoalPlan[]): Landmark[] {
  return plans.filter(plan => plan.id !== "emergency").map((plan, index) => {
    const kind = plan.appearance?.kind ?? goalKind(plan);
    const [x, z] = townPlots[index] ?? [(index % 3 - 1) * 4.65, -8.25 - Math.floor((index - 6) / 3) * 5.45];
    return { plan, kind, x, z, radius: kind === "house" ? 1.75 : 1.45 };
  });
}
