"use client";

import { useEffect, useState } from "react";
import { initialPlans, validPlan, type GoalPlan } from "./demo-goals";

const prefix = "future-you.demo.plan.v1.";

function readPlan(id: string): GoalPlan | undefined {
  try {
    const plan = JSON.parse(localStorage.getItem(prefix + id) ?? "null");
    if (plan?.id === id && validPlan(plan)) return plan;
  } catch {
    // An unavailable store or an invalid record still permits browsing the demo.
  }
}

function readPlans() {
  const plans = initialPlans.map(plan => readPlan(plan.id) ?? plan);
  try {
    const customKeys = Object.keys(localStorage).filter(key => key.startsWith(prefix + "custom-")).sort();
    for (const key of customKeys) {
      const plan = readPlan(key.slice(prefix.length));
      if (plan) plans.push(plan);
    }
  } catch {
    // The original goals are still available when storage is blocked.
  }
  return plans;
}

export function useGoalPlans() {
  const [plans, setPlans] = useState(initialPlans);
  useEffect(() => {
    function refresh() { setPlans(readPlans()); }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  function savePlan(plan: GoalPlan) {
    if (!validPlan(plan)) throw new Error("Review the goal values.");
    localStorage.setItem(prefix + plan.id, JSON.stringify(plan));
    setPlans(readPlans());
  }

  return { plans, savePlan };
}
