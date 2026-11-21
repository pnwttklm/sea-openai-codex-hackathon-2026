import type { Metadata } from "next";
import { FutureYou } from "@/features/future-you/future-you";

export const metadata: Metadata = { title: "Future You · Prik Thai AI" };

export default function FutureYouPage() {
  return <main id="main" className="full-page"><FutureYou /></main>;
}
