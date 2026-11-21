import type { Metadata } from "next";
import { Behavior } from "@/features/demo/behavior";

export const metadata: Metadata = { title: "Investing Behavior Score | Prik Thai AI" };

export default function BehaviorPage() {
  return <Behavior />;
}
