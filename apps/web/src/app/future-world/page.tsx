import { FutureWorld } from "@/features/future-world/future-world";

export const metadata = { title: "Future World · Prik Thai AI" };

export default async function Page({ searchParams }: { searchParams: Promise<{ goal?: string | string[]; house?: string | string[] }> }) {
  const { goal, house } = await searchParams;
  const houseId = typeof house === "string" ? house : undefined;
  const initialGoal = typeof goal === "string" ? goal : undefined;
  return <FutureWorld key={JSON.stringify([houseId, initialGoal])} houseId={houseId} initialGoal={initialGoal} />;
}
