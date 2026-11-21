"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import { FutureActions } from "./future-actions";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { duration, compactMoney, type GoalPlan } from "./demo-goals";
import { GoalDetails } from "./goal-details";
import { useGoalPlans } from "./use-goal-plans";
import styles from "./future-you.module.css";

config.autoAddCss = false;

const assets = "/future-you";
const numberFormat = new Intl.NumberFormat("en");

function Amount({ value }: { value: string }) {
  return <span className={styles.amount}><span className={styles.currency}>THB</span> <span className={styles.digits} key={value}>{value}</span></span>;
}

function GoalArt({ id }: { id: string }) {
  return (
    <div className={styles.goalArt} data-goal={id} aria-hidden="true">
      <div className={styles.scenery} />
      {id === "wedding" && (
        <Image className={styles.weddingFigure} src={`${assets}/shizuka-wedding.png`} alt="" width={120} height={120} unoptimized />
      )}
      {id === "time-machine" && (
        <Image className={styles.machineFigure} src={`${assets}/time-machine.png`} alt="" width={118} height={100} unoptimized />
      )}
      {id === "dream-home" && (
        <Image className={styles.homeFigure} src={`${assets}/doraemon-family.png`} alt="" width={1000} height={536} unoptimized />
      )}
    </div>
  );
}

function GoalCard({ goal, open }: { goal: GoalPlan; open: (trigger: HTMLButtonElement) => void }) {
  return (
    <article className={styles.goalCard} data-goal={goal.id}>
      <button className={styles.openCard} aria-haspopup="dialog" aria-label={`View ${goal.title} details`} onClick={e => open(e.currentTarget)} />
      <GoalArt id={goal.id} />
      <div className={styles.cardContent}>
        <h2>
          {goal.title === "Retirement in Thailand" ? (
            <>Retirement in <span aria-hidden="true">🇹🇭</span><span className={styles.srOnly}>Thailand</span></>
          ) : goal.title}
        </h2>
        <div className={styles.saved}>
          <Amount value={numberFormat.format(goal.saved)} />
          <p>of THB {compactMoney.format(goal.target)} saved</p>
        </div>
        <div className={styles.progress} aria-hidden="true"><span style={{ transform: `scaleX(${Math.min(1, goal.saved / goal.target)})` }} /></div>
        <p>{duration(goal.months)} left</p>
      </div>
    </article>
  );
}

function FutureYouTabs() {
  return (
    <nav className={styles.tabs} aria-label="Main navigation">
      <Link href="/">
        <span className={styles.avatar}>
          <Image className={styles.nobita} src={`${assets}/nobita.png`} alt="" width={580} height={1752} sizes="16px" />
        </span>
        Portfolio
      </Link>
      <button type="button" disabled aria-label="Invest, coming soon">
        <Image src={`${assets}/doraemon-tab.svg`} alt="" width={31.605} height={28.105} />
        Invest
      </button>
      <Link href="/goals" aria-current="page">
        <span className={styles.avatar}>
          <span className={styles.shizukaCrop}>
            <Image className={styles.shizuka} src={`${assets}/shizuka.png`} alt="" width={49} height={49} sizes="49px" />
          </span>
        </span>
        Future You
      </Link>
    </nav>
  );
}

export function FutureYou() {
  const { plans, savePlan } = useGoalPlans();
  const goals = plans.filter(plan => plan.id !== "emergency");
  const reserve = plans.find(plan => plan.id === "emergency")!;
  const [detailId, setDetailId] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const detail = plans.find(plan => plan.id === detailId);

  function openDetails(id: string, button: HTMLButtonElement) {
    trigger.current = button;
    setDetailId(id);
  }

  return (
    <main id="main" className={styles.screen} tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="future-you-title">
        <div className={styles.eclipse} aria-hidden="true">
          <Image className={styles.eclipseViolet} src={`${assets}/eclipse-violet.svg`} alt="" width={165.823} height={169.293} />
          <Image className={styles.eclipseBlue} src={`${assets}/eclipse-blue.svg`} alt="" width={151.203} height={167.775} />
          <Image className={styles.eclipseIndigo} src={`${assets}/eclipse-indigo.svg`} alt="" width={291.669} height={352.857} />
          <Image className={styles.eclipseLight} src={`${assets}/eclipse-light.svg`} alt="" width={403.308} height={206.175} />
          <Image className={styles.eclipseBlend} src={`${assets}/eclipse-blend.svg`} alt="" width={403.308} height={206.175} />
          <Image className={styles.eclipseGlow} src={`${assets}/eclipse-glow.svg`} alt="" width={439.77} height={262.997} />
          <Image className={styles.eclipseDisc} src={`${assets}/eclipse-disc.svg`} alt="" width={444.34} height={433.714} />
        </div>
        <div className={styles.heroTop}>
          <h1 id="future-you-title">Future You</h1>
          <Image className={styles.family} src={`${assets}/doraemon-family.png`} alt="" width={1000} height={536} unoptimized preload />
        </div>
        <FutureActions goals={goals} />
      </section>

      <section className={styles.goals} aria-label="Your life goals">
        {goals.map(goal => <GoalCard key={goal.id} goal={goal} open={button => openDetails(goal.id, button)} />)}
        <article className={styles.reserve}>
          <button className={styles.openCard} aria-haspopup="dialog" aria-label={`View ${reserve.title} details`} onClick={e => openDetails(reserve.id, e.currentTarget)} />
          <Image src="/future-you/emergency-vault.webp" alt="" width={335} height={137} className={styles.vault} />
          <div className={styles.cardContent}>
            <h2>{reserve.title}</h2>
            <div className={styles.saved}><Amount value={numberFormat.format(reserve.saved)} /><p>Use during emergency only</p></div>
          </div>
        </article>
      </section>

      <FutureYouTabs />

      {detail && <GoalDetails plan={detail} onSave={savePlan} onClose={() => {
        setDetailId(null);
        trigger.current?.focus({ preventScroll: true });
      }} />}
    </main>
  );
}
