import { notFound } from "next/navigation";
import { initialPlans } from "@/features/goals/demo-goals";
import { TimeMachine } from "@/features/goals/time-machine";

export const metadata = { title: "Future You · Time machine" };

export function generateStaticParams() {
  return initialPlans.filter(plan => plan.id !== "emergency").map(plan => ({ goal: plan.id }));
}

export default async function Page({ params }: { params: Promise<{ goal: string }> }) {
  const { goal } = await params;
  if (!initialPlans.some(plan => plan.id === goal && plan.id !== "emergency")) notFound();
  return <TimeMachine id={goal} />;
}
