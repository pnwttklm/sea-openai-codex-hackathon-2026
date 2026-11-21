"use client";

import { useEffect, useState } from "react";
import { initialPlans, validPlan, type GoalPlan } from "./demo-goals";

const prefix = "future-you.demo.plan.v1.";

function readPlan(fallback: GoalPlan): GoalPlan {
  try {
    const plan = JSON.parse(localStorage.getItem(prefix + fallback.id) ?? "null");
    if (plan?.id === fallback.id && validPlan(plan)) return plan;
  } catch {
    // An unavailable store or an invalid record still permits browsing the demo.
  }
  return fallback;
}

export function useGoalPlans() {
  const [plans, setPlans] = useState(initialPlans);
  useEffect(() => {
    function refresh() { setPlans(initialPlans.map(readPlan)); }
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
    setPlans(current => current.map(item => item.id === plan.id ? plan : item));
  }

  return { plans, savePlan };
}
