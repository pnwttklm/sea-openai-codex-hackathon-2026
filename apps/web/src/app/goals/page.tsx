import type { Metadata, Viewport } from "next";
import { FutureYou } from "@/features/goals/future-you";

export const metadata: Metadata = { title: "Future You | Prik Thai AI" };

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#4245f4",
  colorScheme: "dark",
};

export default function Page() {
  return <FutureYou />;
}
