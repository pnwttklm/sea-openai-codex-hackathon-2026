import type { Metadata } from "next";
import { Behavior } from "@/features/demo/behavior";

export const metadata: Metadata = { title: "Financial Score | Nobi Invest" };

export default function BehaviorPage() {
  return <Behavior />;
}
