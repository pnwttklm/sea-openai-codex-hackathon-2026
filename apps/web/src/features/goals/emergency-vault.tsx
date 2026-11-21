import { useEffect, useRef, useState } from "react";
import { Mascot } from "../companion/mascots";
import { money, type GoalPlan } from "./demo-goals";
import "./emergency-vault.css";

type Step = "fund" | "unlock" | "amount" | "review" | "done";
const baht = (value: number) => "THB " + money.format(value);
const bolts = [[47,7],[75,19],[86,47],[75,75],[47,87],[19,75],[8,47],[19,19]];

export function VaultDoor() {
  return <div className="vault-outer" aria-hidden="true"><div className="vault-cavity" /><div className="vault-door">
    {bolts.map(([x,y]) => <i className="vault-bolt" key={x + ":" + y} style={{left:x+"%",top:y+"%"}} />)}
    <div className="vault-wheel">{[0,60,120].map(angle => <i key={angle} style={{transform:`rotate(${angle}deg)`}} />)}</div>
  </div><div className="vault-hinge" /></div>;
}

export function EmergencyVault({ plan, save, busy, edit }: {
  plan: GoalPlan; save: (plan: GoalPlan) => Promise<void>; busy: boolean; edit: () => void;
}) {
  const [step, setStep] = useState<Step>("fund");
  const [phase, setPhase] = useState("Releasing the lock");
  const [amount, setAmount] = useState("");
  const [basis, setBasis] = useState(plan);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const value = Number(amount);
  const valid = /^\d+(\.\d{1,2})?$/.test(amount) && value > 0 && value <= basis.saved;
  const remaining = Math.round((basis.saved - value) * 100) / 100;
  const changed = basis.revision !== plan.revision || basis.saved !== plan.saved;

  useEffect(() => {
    if (step !== "unlock") return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function finish() { setStep("amount"); }
    if (motion.matches) { finish(); return; }
    const door = setTimeout(() => setPhase("Opening the door"), 1550);
    const opened = setTimeout(finish, 4200);
    function motionChanged() { if (motion.matches) finish(); }
    motion.addEventListener("change", motionChanged);
    return () => { clearTimeout(door); clearTimeout(opened); motion.removeEventListener("change", motionChanged); };
  }, [step]);

  function start() {
    setBasis(plan); setAmount(""); setError(""); setPhase("Releasing the lock"); setStep("unlock");
  }
  async function confirm() {
    if (!valid || changed || step !== "review" || lock.current) return;
    lock.current = true;
    try { await save({ ...basis, saved: remaining }); setStep("done"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the withdrawal. Try again."); }
    finally { lock.current = false; }
  }
  const closed = step === "fund";
  return <section className="reserve-flow" aria-label="Emergency reserve">
    <div className="vault-panel" data-phase={closed ? "closed" : step === "unlock" ? "opening" : "open"}>
      <div className="vault-caption"><b>Emergency reserve</b><span>Cash · THB</span></div>
      <div className="vault-display"><VaultDoor /></div>
      <div className="vault-readout" role="status">{closed ? "Vault locked" : step === "unlock" ? phase : "Vault open"}<i /></div>
      <div className="vault-track" aria-hidden="true"><i /></div>
    </div>
    {closed ? <><small>Available in cash</small><strong className="reserve-amount">{baht(plan.saved)}</strong>
      <p>Set aside for an unexpected bill or a gap between paychecks.</p>
      <dl><div><dt>Reserve target</dt><dd>{baht(plan.target)}</dd></div><div><dt>Monthly contribution</dt><dd>{baht(plan.monthly)}</dd></div></dl>
      <button className="vault-primary" disabled={plan.saved <= 0} onClick={start}>Withdraw</button>
      <button className="vault-secondary" onClick={edit}>Edit goal</button></>
    : step === "done" ? <div role="status"><h3>Withdrawal complete</h3><p>{baht(value)} withdrawn from your demo reserve.</p>
      <strong>{baht(remaining)} left for emergencies</strong><button className="vault-primary" onClick={() => setStep("fund")}>Done</button></div>
    : <>
      <aside className="reserve-note"><div><Mascot agent="companion" size={28} /> Doraemon</div>
        <p>You set this aside for an unexpected bill or a missed paycheck. If today is one of those days, it’s here for you.</p></aside>
      {step === "amount" && <label>Withdrawal amount (THB)<input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></label>}
      {step === "review" && <h3>Review withdrawal</h3>}
      {(step === "amount" || step === "review") && <>
        <dl><div><dt>Available now</dt><dd>{baht(plan.saved)}</dd></div>
          {step === "review" && <div><dt>Withdrawal</dt><dd>{baht(value)}</dd></div>}
          <div><dt>Left for the next emergency</dt><dd>{valid && !changed ? baht(remaining) : "—"}</dd></div></dl>
        {amount && !valid && <p role="alert">Enter a positive amount up to {baht(basis.saved)}, with at most two decimal places.</p>}
        {changed ? <><p role="alert">Your reserve changed. Review the updated balance.</p><button onClick={start}>Reload reserve</button></>
          : <button className="vault-primary" disabled={!valid || busy} onClick={() => step === "amount" ? setStep("review") : void confirm()}>
            {busy ? "Saving…" : step === "amount" ? "Review withdrawal" : "Confirm demo withdrawal"}</button>}
        {error && <p role="alert">{error}</p>}
        {step === "review" && <button className="vault-secondary" disabled={busy} onClick={() => setStep("amount")}>Edit amount</button>}
      </>}
      <button className="vault-secondary" disabled={busy} onClick={() => setStep("fund")}>Leave it in the fund</button>
    </>}
  </section>;
}
