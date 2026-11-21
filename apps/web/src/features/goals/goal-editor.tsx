import { useRef, useState, type FormEvent } from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { compactMoney, duration, money, type GoalPlan } from "./demo-goals";
import styles from "./goal-editor.module.css";

const maxMoney = 1e12;
const thumbnail: Record<string, string> = {
  wedding: "shizuka-wedding.png",
  retirement: "retirement-scene.jpg",
  "dream-home": "doraemon-family.png",
  "time-machine": "time-machine.png",
  emergency: "emergency-vault.webp",
};

function ValueInput({ name, label, value, change, min = 0 }: {
  name: string; label: string; value: string; change: (value: string) => void; min?: number;
}) {
  const time = name === "months";
  return (
    <div className={styles.valueRow}>
      <label htmlFor={name}>{label}</label>
      <div className={styles.value}>
        <span className={styles.unit} aria-hidden="true">{time ? "MO" : "THB"}</span>
        <div className={styles.number}>
          <input id={name} name={name} type="number" required min={min} max={time ? 1200 : maxMoney}
            step={time ? 1 : 0.01} inputMode={time ? "numeric" : "decimal"}
            aria-label={label + (time ? " (months)" : " (THB)")} value={value}
            onFocus={e => e.currentTarget.select()} onChange={e => change(e.target.value)} />
          <span key={value} aria-hidden="true">{value && money.format(Number(value))}</span>
        </div>
      </div>
    </div>
  );
}

function monthlyCeiling(value: number) {
  return Math.min(maxMoney, Math.max(10000, Math.ceil(value / 5000) * 10000));
}

export function GoalEditor({ plan, submit, cancel }: {
  plan: GoalPlan; submit: (e: FormEvent<HTMLFormElement>) => void; cancel: () => void;
}) {
  const name = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(String(plan.saved));
  const [target, setTarget] = useState(String(plan.target));
  const [monthly, setMonthly] = useState(String(plan.monthly));
  const [months, setMonths] = useState(String(plan.months));
  const [monthlyMax, setMonthlyMax] = useState(() => monthlyCeiling(plan.monthly));
  const [monthsMax, setMonthsMax] = useState(Math.min(1200, Math.max(120, plan.months * 2)));
  const balance = Number(saved);
  const goal = Number(target);
  const ratio = goal > 0 && balance >= 0 ? Math.min(1, balance / goal) : 0;
  const validBalances = saved !== "" && target !== "" && balance >= 0 && goal > 0;
  const deposit = Math.max(100, Math.min(10000, 10 ** Math.floor(Math.log10(Math.max(1, plan.saved / 10)))));
  const monthCount = Number(months);
  const validTime = Number.isInteger(monthCount) && monthCount > 0 && monthCount <= 1200;
  const percent = Math.round(ratio * 1000) / 10;

  return (
    <form className={styles.editor} onSubmit={submit}>
      <div className={styles.identity}>
        <span className={styles.portrait} aria-hidden="true" style={{backgroundImage: `url(/future-you/${thumbnail[plan.id]})`}} />
        <div className={styles.rename}>
          <label htmlFor="goal-name">Goal name</label>
          <input id="goal-name" name="title" ref={name} defaultValue={plan.title} required maxLength={80} autoComplete="off" />
        </div>
        <button type="button" className={styles.pencil} aria-label="Rename goal" onClick={() => {name.current?.focus(); name.current?.select();}}>
          <FontAwesomeIcon icon={faPen} />
        </button>
      </div>

      <div className={styles.balances}>
        <div className={styles.moneySection}>
          <ValueInput name="saved" label="Amount saved" value={saved} change={setSaved} />
          <div className={styles.chips}>
            {[deposit, deposit * 5].map(n => <button type="button" key={n} aria-label={`Add THB ${money.format(n)} to savings`}
              disabled={balance + n > maxMoney} onClick={() => setSaved(String(Math.round((Math.max(0, balance) + n) * 100) / 100))}>+{compactMoney.format(n)}</button>)}
          </div>
        </div>
        <div className={styles.moneySection}>
          <ValueInput name="target" label="Target amount" value={target} change={setTarget} min={0.01} />
          <div className={styles.chips}>
            {[-10, 10].map(n => <button type="button" key={n} disabled={goal <= 0 || (n > 0 && goal >= maxMoney)}
              aria-label={`${n > 0 ? "Increase" : "Decrease"} target by 10 percent`}
              onClick={() => setTarget(String(Math.min(maxMoney, Math.max(0.01, Math.round(goal * (100 + n)) / 100))))}>
              {n > 0 ? "+10%" : "−10%"}
            </button>)}
          </div>
        </div>
        <div className={styles.funded}>
          <span className={styles.meter} aria-hidden="true"><i style={{transform: `scaleX(${ratio})`}} /></span>
          <span>{validBalances ? `${percent}% funded` : "—"}</span>
        </div>
      </div>

      <div className={styles.adjuster}>
        <ValueInput name="monthly" label="Monthly contribution" value={monthly} change={value => {
          setMonthly(value);
          if (Number(value) > monthlyMax) setMonthlyMax(monthlyCeiling(Number(value)));
        }} />
        <div className={styles.slider}>
          <div className={styles.bars} aria-hidden="true">
            {Array.from({length: 36}, (_, i) => <i key={i} data-filled={(i + 0.5) / 36 <= Number(monthly) / monthlyMax}
              style={{height: `${25 + 75 * i / 35}%`}} />)}
          </div>
          <input type="range" aria-label="Adjust monthly contribution" aria-valuetext={`THB ${money.format(Number(monthly))} per month`}
            min={0} max={monthlyMax} step={Math.max(1, monthlyMax / 200)} value={Number(monthly)}
            onChange={e => setMonthly(e.target.value)} />
        </div>
        <div className={styles.ends}><span>THB 0</span><span>THB {compactMoney.format(monthlyMax)}</span></div>
      </div>

      <div className={styles.adjuster}>
        <ValueInput name="months" label="Time remaining" value={months} min={1} change={value => {
          setMonths(value);
          if (Number(value) > monthsMax) setMonthsMax(Math.min(1200, Math.ceil(Number(value) / 12) * 12));
        }} />
        <div className={styles.slider}>
          <div className={styles.ruler} aria-hidden="true" />
          <input type="range" aria-label="Adjust time remaining" min={1} max={monthsMax} step={1}
            aria-valuetext={validTime ? duration(monthCount) : undefined} value={monthCount}
            onChange={e => setMonths(e.target.value)} />
        </div>
        <div className={styles.ends}><span>1 month</span><strong>{validTime ? duration(monthCount) : "—"}</strong><span>{duration(monthsMax)}</span></div>
      </div>
      <div className={styles.actions}><button type="button" onClick={cancel}>Cancel</button><button type="submit">Save changes</button></div>
    </form>
  );
}
