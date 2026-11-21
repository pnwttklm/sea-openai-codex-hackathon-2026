import type { Metadata } from "next";
import { Behavior } from "@/features/demo/behavior";

export const metadata: Metadata = { title: "Investor Health Score | Prik Thai AI" };

export default function BehaviorPage() {
  return <Behavior />;
}
