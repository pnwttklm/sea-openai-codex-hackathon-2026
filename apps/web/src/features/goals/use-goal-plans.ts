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
  const [plans, setPlans] = useState<GoalPlan[]>(initialPlans);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const shared = process.env.NEXT_PUBLIC_SHARED_DEMO === "1";
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const next = shared ? await apiGet<GoalPlan[]>("/api/v1/companion/goals", controller.signal) : readPlans();
        if (!next.some(p => p.id === "emergency")) throw new Error("Demo goals need to be seeded.");
        if (!controller.signal.aborted) { setPlans(next); setError(""); setReady(true); }
      } catch {
        if (!controller.signal.aborted) setError("Could not load saved goals. Reload to try again.");
      }
    }
    void refresh();
    window.addEventListener("pageshow", refresh);
    if (!shared) window.addEventListener("storage", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("storage", refresh);
    };
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
      const write = () => {
        const current = readPlan(plan.id);
        if ((current?.revision ?? 0) !== (plan.revision ?? 0)) {
          setPlans(readPlans());
          throw new Error("This goal changed. Review the latest balance.");
        }
        localStorage.setItem(prefix + plan.id, JSON.stringify({ ...plan, revision: (plan.revision ?? 0) + 1 }));
      };
      if (navigator.locks) await navigator.locks.request(prefix + plan.id, write);
      else write();
      setPlans(readPlans());
    }
  }
  return { plans, savePlan, error, ready };
}

function order(id: string) {
  const index = initialPlans.findIndex(plan => plan.id === id);
  return index < 0 ? initialPlans.length : index;
}
