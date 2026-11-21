"use client";

import Link from "next/link";
import Image from "next/image";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { duration } from "./demo-goals";
import { useGoalPlans } from "./use-goal-plans";
import styles from "./future-you.module.css";

export function TimeMachine({ id }: { id: string }) {
  const { plans } = useGoalPlans();
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
      <div className={styles.destination}><p>Your destination in {duration(plan.months)}</p><h2>{plan.title}</h2></div>
    </main>
  );
}
