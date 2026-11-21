import type { Metadata, Viewport } from "next";
import { FutureYou } from "@/features/future-you/future-you";

export const metadata: Metadata = { title: "Future Talk | Prik Thai AI" };

export const viewport: Viewport = { viewportFit: "cover", themeColor: "#111214", colorScheme: "dark" };

export default function FutureYouPage() {
  return <FutureYou />;
}
