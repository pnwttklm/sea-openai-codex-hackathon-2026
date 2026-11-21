import { FutureWorld } from "@/features/future-world/future-world";

export const metadata = { title: "Future World · Prik Thai AI" };

export default async function Page({ searchParams }: { searchParams: Promise<{ goal?: string | string[]; house?: string | string[] }> }) {
  const { goal, house } = await searchParams;
  return <FutureWorld houseId={typeof house === "string" ? house : undefined} initialGoal={typeof goal === "string" ? goal : undefined} />;
}
