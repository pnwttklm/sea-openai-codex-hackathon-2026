"use client";

import { faFlag, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

function SavingsOverview({ goals }: { goals: GoalPlan[] }) {
  const saved = goals.reduce((total, goal) => total + goal.saved, 0);
  const target = goals.reduce((total, goal) => total + goal.target, 0);
  const funded = goals.reduce((total, goal) => total + Math.min(goal.saved, goal.target), 0);
  const percent = target ? 100 * funded / target : 0;
  return (
    <div className={styles.overview}>
      <div>
        <p>Saved toward life goals</p>
        <Amount value={numberFormat.format(saved)} />
        <p>of THB {compactMoney.format(target)} planned</p>
      </div>
      <div className={styles.overviewDial}>
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="35" />
          <circle cx="40" cy="40" r="35" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percent} />
        </svg>
        <span>{Number(percent.toFixed(1))}%<small>funded</small></span>
      </div>
    </div>
  );
}

function GoalArt({ id }: { id: string }) {
  return (
    <div className={styles.goalArt} data-goal={id} aria-hidden="true">
      <div className={styles.scenery}>{id.startsWith("custom-") && <FontAwesomeIcon icon={faFlag} />}</div>
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
          <p>of THB {compactMoney.format(goal.target)}</p>
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
  const [draft, setDraft] = useState<GoalPlan | null>(null);
  const detail = plans.find(plan => plan.id === detailId) ?? draft;

  function addGoal(button: HTMLButtonElement) {
    const id = `custom-${Date.now()}-${crypto.getRandomValues(new Uint32Array(2)).join("-")}`;
    setDraft({ id, title: "", saved: 0, target: 0, monthly: 0, months: 12 });
    openDetails(id, button);
  }

  function openDetails(id: string, button: HTMLButtonElement) {
    trigger.current = button;
    setDetailId(id);
  }

  return (
    <main id="main" className={styles.screen} tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="future-you-title">
        <div className={styles.heroScene}>
          <Image src={`${assets}/two-nobitas.webp`} alt="Young Nobita sitting beside his older self" width={1280} height={720} preload unoptimized />
          <h1 id="future-you-title">Future You</h1>
        </div>
        <SavingsOverview goals={goals} />
        <FutureActions goals={goals.filter(goal => !goal.id.startsWith("custom-"))} />
      </section>

      <section className={styles.goals} aria-label="Your life goals">
        <header className={styles.goalsHeading}>
          <h2>Life goals</h2>
          <button type="button" aria-haspopup="dialog" onClick={e => addGoal(e.currentTarget)}>
            <FontAwesomeIcon icon={faPlus} /> Add goal
          </button>
        </header>
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

      {detail && <GoalDetails plan={detail} creating={draft !== null} onSave={plan => { savePlan(plan); setDraft(null); }} onClose={() => {
        setDraft(null);
        setDetailId(null);
        trigger.current?.focus({ preventScroll: true });
      }} />}
    </main>
  );
}
