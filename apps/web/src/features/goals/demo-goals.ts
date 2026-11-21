export const initialPlans = [
  { id: "wedding", title: "Marry Shizuka", saved: 50_000, target: 650_000, monthly: 7_000, months: 60 },
  { id: "retirement", title: "Retirement in Thailand", saved: 250_000, target: 15_000_000, monthly: 12_000, months: 300 },
  { id: "time-machine", title: "Time machine", saved: 50_000, target: 240_000, monthly: 5_000, months: 36 },
  { id: "dream-home", title: "Dream home", saved: 150_000, target: 1_200_000, monthly: 6_000, months: 96 },
  { id: "emergency", title: "Emergency fund", saved: 100_000, target: 300_000, monthly: 10_000, months: 20 },
];

export type GoalPlan = (typeof initialPlans)[number] & { revision?: number };
export const money = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
export const compactMoney = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 });

export function duration(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years && `${years} year${years === 1 ? "" : "s"}`,
    rest && `${rest} month${rest === 1 ? "" : "s"}`,
  ].filter(Boolean).join(" ");
}

export function validPlan(plan: GoalPlan) {
  const amount = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1e12;
  return typeof plan.title === "string" && plan.title.trim().length > 0 && plan.title.length <= 80
    && amount(plan.saved) && amount(plan.target) && plan.target > 0 && amount(plan.monthly)
    && Number.isInteger(plan.months) && plan.months >= 1 && plan.months <= 1200;
}
