"use client";

import Link from "next/link";
import Image from "next/image";
import { MetalFx } from "metal-fx";
import { useEffect, useState } from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { duration, money, type GoalPlan } from "./demo-goals";
import { useGoalPlans } from "./use-goal-plans";
import styles from "./future-you.module.css";

function TripTicket({ plan }: { plan: GoalPlan }) {
  const [showSavings, setShowSavings] = useState(false);
  const [foilActive, setFoilActive] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setFoilActive(motion.matches);
    sync();
    const timer = window.setTimeout(() => setFoilActive(false), 1500);
    const stop = () => setFoilActive(false);
    motion.addEventListener("change", stop);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener("change", stop);
    };
  }, [showSavings]);

  const seal = (
    <span className={styles.bellStamp} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="16" cy="16" r="10" />
        <path d="M6.5 12.7q9.5-4 19 0m-19.5 3q10-4 20 0M16 20v6" />
        <circle cx="16" cy="19.5" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );

  return (
    <section className={styles.destination} aria-label="Time machine ticket">
      <div id="trip-face" aria-live="polite" aria-atomic="true">
        <div key={String(showSavings)} className={styles.ticketFace}>
          <p className={styles.ticketLabel}>{showSavings ? "Saved so far" : "Time machine ticket"}</p>
          {showSavings ? (
            <>
              <h2>THB {money.format(plan.saved)}</h2>
              <p>of THB {money.format(plan.target)} for {plan.title}</p>
            </>
          ) : (
            <>
              <h2>{plan.title}</h2>
              <p>{duration(plan.months)} from now</p>
            </>
          )}
        </div>
      </div>
      <div className={styles.ticketStub}>
        {foilActive ? (
          <MetalFx variant="circle" preset="gold" theme="light" disableGlow normalizeHostStyles={false}>
            {seal}
          </MetalFx>
        ) : seal}
        <button type="button" aria-controls="trip-face" onClick={() => setShowSavings(value => !value)}>
          {showSavings ? "View trip" : "View savings"}
        </button>
      </div>
    </section>
  );
}

export function TimeMachine({ id }: { id: string }) {
  const { plans, error, ready } = useGoalPlans();
  if (!ready || error) return <main id="main"><p role="status">{error || "Loading goal…"}</p></main>;
  const plan = plans.find(plan => plan.id === id)!;
  return (
    <main id="main" className={`${styles.screen} ${styles.voyage}`}>
      <Link href="/goals" className={styles.back}><FontAwesomeIcon icon={faArrowLeft} /> Goals</Link>
      <h1 className={styles.srOnly}>Future You time machine</h1>
      <div className={styles.stage} role="img" aria-label="Nobita and Doraemon boarding their time machine">
        <Image className={styles.traveller} src="/future-you/nobita.png" alt="" width={82} height={246} unoptimized />
        <Image className={styles.companion} src="/future-you/doraemon-time-machine.png" alt="" width={102} height={92} />
        <Image className={styles.machine} src="/future-you/time-machine.png" alt="" width={310} height={260} unoptimized />
      </div>
      <div className={styles.journeyBar} aria-hidden="true"><span /></div>
      <TripTicket key={plan.id} plan={plan} />
    </main>
  );
}
