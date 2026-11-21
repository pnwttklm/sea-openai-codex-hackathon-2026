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

export function useGoalPlans(customizeLandmarks = false) {
  const [plans, setPlans] = useState<GoalPlan[]>(initialPlans);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const shared = process.env.NEXT_PUBLIC_SHARED_DEMO === "1";
  useEffect(() => {
    const controller = new AbortController();
    const pending = new Map<string, Promise<NonNullable<GoalPlan["appearance"]>>>();
    async function customize(plans: GoalPlan[]) {
      for (const plan of plans) {
        if (controller.signal.aborted) return;
        if (plan.appearance || !plan.id.startsWith("custom-")) continue;
        const key = JSON.stringify([plan.id, plan.title]);
        let result = pending.get(key);
        if (!result) {
          result = apiPost<NonNullable<GoalPlan["appearance"]>>(
            `/api/v1/future-world/landmarks/${encodeURIComponent(plan.id)}`, {}, controller.signal);
          pending.set(key, result);
        }
        try {
          const appearance = await result;
          if (!controller.signal.aborted) setPlans(current => current.map(p =>
            p.id === plan.id && p.title === plan.title ? { ...p, appearance } : p));
        } catch {
          // Keep the existing default model. A later visit retries the saved title.
          pending.delete(key);
        }
      }
    }
    async function refresh() {
      try {
        const next = shared ? await apiGet<GoalPlan[]>("/api/v1/companion/goals", controller.signal) : readPlans();
        if (controller.signal.aborted) return;
        setPlans(next);
        setError("");
        setReady(true);
        if (shared && customizeLandmarks) void customize(next);
      } catch {
        if (!controller.signal.aborted) setError("Could not load saved goals. Reload to try again.");
      }
    }
    void refresh();
    if (!shared) window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("storage", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [shared, customizeLandmarks]);

  async function savePlan(plan: GoalPlan) {
    if (!validPlan(plan) || !ready) throw new Error("Review the goal values and reload your saved goals.");
    if (shared) {
      let saved: GoalPlan;
      try {
        const { id, title, saved: balance, target, monthly, months, revision } = plan;
        saved = await apiPost<GoalPlan>("/api/v1/companion/goals", { id, title, saved: balance, target, monthly, months, revision });
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

function order(id: string) {
  const index = initialPlans.findIndex(plan => plan.id === id);
  return index < 0 ? initialPlans.length : index;
}
