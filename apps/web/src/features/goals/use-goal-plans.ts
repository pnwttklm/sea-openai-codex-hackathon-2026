"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api/client";
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
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    function refresh() { setPlans(readPlans()); }
    refresh();
    setLoaded(true);
    window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);
    return () => { controller.abort(); window.removeEventListener("pageshow", refresh); };
  }, [shared]);

  async function savePlan(plan: GoalPlan) {
    if (!validPlan(plan) || !ready) throw new Error("Review the goal values and reload your saved goals.");
    if (shared) {
      let saved: GoalPlan;
      try {
        saved = await apiPost<GoalPlan>("/api/v1/companion/goals", plan);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          setPlans(await apiGet<GoalPlan[]>("/api/v1/companion/goals"));
        }
        throw error;
      }
      setPlans(previous => [...previous.filter(p => p.id !== saved.id), saved]
        .sort((a,b) => order(a.id) - order(b.id) || a.id.localeCompare(b.id)));
    } else {
      localStorage.setItem(prefix + plan.id, JSON.stringify(plan));
      setPlans(readPlans());
    }
  }
  return { plans, savePlan, error, ready };
}

  return { plans, loaded, savePlan };
}
