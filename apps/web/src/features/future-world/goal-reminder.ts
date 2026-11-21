import { money, type GoalPlan } from "../goals/demo-goals";
import type { Landmark } from "./landmarks";

export type GoalReminder = { id: string; reason: "nearby" | "notebook" | "curiosity" };

export function nextReminderGoal(plots: Landmark[], mentioned: ReadonlySet<string>,
  player: { x: number; z: number }, lastInspected?: string): GoalReminder | undefined {
  const remaining = plots.filter(plot => !mentioned.has(plot.plan.id));
  if (!remaining.length) return;

  // Pick a conversation from things happening in town. A goal at any balance can come up.
  const nearby = remaining.filter(plot => Math.hypot(plot.x - player.x, plot.z - player.z) <= plot.radius + 1.4);
  const options: GoalReminder[] = [];
  if (nearby.length) {
    options.push({ id: nearby[Math.floor(Math.random() * nearby.length)].plan.id, reason: "nearby" });
  }
  if (remaining.some(plot => plot.plan.id === lastInspected) && lastInspected) {
    options.push({ id: lastInspected, reason: "notebook" });
  }
  if (options.length && Math.random() < 0.75) return options[Math.floor(Math.random() * options.length)];
  return { id: remaining[Math.floor(Math.random() * remaining.length)].plan.id, reason: "curiosity" };
}

export function reminderMessage(plan: GoalPlan, reason: GoalReminder["reason"]) {
  const goal = `“${plan.title}”`;
  const left = plan.target - plan.saved;
  if (left <= 0) return `Nobita, you did it! You saved enough for ${goal}. Shall we take a look?`;
  if (!plan.saved) return `Hey, Nobita. How would you like to get started on ${goal}?`;
  if (reason === "nearby") return `Since we’re here, Nobita… want to see how ${goal} is coming along?`;
  if (reason === "notebook") return `I was just looking at ${goal}. Got a moment to look at it with me?`;
  if (plan.monthly >= left) return `Guess what, Nobita? One more planned contribution would cover the ฿${money.format(left)} left for ${goal}!`;
  if (plan.monthly > 0) return `I was thinking about ${goal}. Want to see where your next ฿${money.format(plan.monthly)} could take you?`;
  return `You've put ฿${money.format(plan.saved)} toward ${goal}, Nobita. Shall we see what’s left?`;
}

export function goalFollowUp(plan: GoalPlan) {
  const goal = `“${plan.title}”`;
  if (plan.saved >= plan.target) return `Look at that, Nobita. You set out to save ฿${money.format(plan.target)} for ${goal}, and you did it!`;
  if (!plan.monthly) return plan.saved
    ? `You have ฿${money.format(plan.target - plan.saved)} left for ${goal}. What amount would feel comfortable to set aside next?`
    : `Let’s start small. What would feel comfortable as a first contribution to ${goal}?`;
  const next = plan.saved + plan.monthly;
  if (next >= plan.target) return `Your plan sets aside ฿${money.format(plan.monthly)} a month. You only need ฿${money.format(plan.target - plan.saved)} more for ${goal}.`;
  return `If you put aside your planned ฿${money.format(plan.monthly)}, you’d have ฿${money.format(next)} toward ${goal}.`;
}
