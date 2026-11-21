import { notFound, redirect } from "next/navigation";
import { Stock } from "@/features/demo/stock";

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  if (!/^[a-zA-Z]{1,5}$/.test(symbol)) notFound();
  if (symbol !== symbol.toUpperCase()) redirect(`/stocks/${symbol.toUpperCase()}`);
  return <Stock symbol={symbol} />;
}
