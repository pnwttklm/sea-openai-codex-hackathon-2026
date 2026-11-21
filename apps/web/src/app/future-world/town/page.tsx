import { redirect } from "next/navigation";

export default async function TownPage({ searchParams }: { searchParams: Promise<{ house?: string | string[] }> }) {
  const { house } = await searchParams;
  redirect(typeof house === "string" ? "/future-world?house=" + encodeURIComponent(house) : "/future-world");
}
