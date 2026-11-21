"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { faCircleCheck, faPen, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { duration, money, validPlan, type GoalPlan } from "./demo-goals";
import { EmergencyVault } from "./emergency-vault";
import { GoalEditor } from "./goal-editor";
import styles from "./future-you.module.css";

const savedMessage = process.env.NEXT_PUBLIC_SHARED_DEMO === "1" ? "Changes saved to your demo profile." : "Changes saved in this browser.";

export function GoalDetails({ plan, creating, onSave, onClose }: {
  plan: GoalPlan;
  creating: boolean;
  onSave: (plan: GoalPlan) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousHeight = useRef<number | null>(null);
  const resize = useRef<Animation | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(creating);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => { if (editing) heading.current?.focus({ preventScroll: true }); }, [editing]);

  function switchPanel(toEditor: boolean) {
    previousHeight.current = dialog.current?.offsetHeight ?? null;
    setEditing(toEditor);
  }

  useLayoutEffect(() => {
    const sheet = dialog.current;
    const from = previousHeight.current;
    previousHeight.current = null;
    if (!sheet || from === null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    resize.current?.cancel();
    const to = sheet.offsetHeight;
    resize.current = sheet.animate([{ height: from + "px" }, { height: to + "px" }], {
      duration: 220, easing: "cubic-bezier(.22, 1, .36, 1)",
    });
  }, [editing]);

  async function dismiss() {
    const sheet = dialog.current;
    if (saving || !sheet?.open || sheet.dataset.closing) return;
    sheet.dataset.closing = "true";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const current = getComputedStyle(sheet);
      const exit = sheet.animate([
        { opacity: current.opacity, transform: current.transform },
        { opacity: 0, transform: "translateY(36px) scale(.985)" },
      ], { duration: 150, easing: "ease-in", fill: "forwards" });
      await exit.finished.catch(() => {});
    }
    if (sheet.isConnected && sheet.open) sheet.close();
  }

  function endEdit() {
    switchPanel(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  function cancelEdit() {
    setNotice("");
    if (creating) void dismiss();
    else endEdit();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || dialog.current?.dataset.closing) return;
    const form = new FormData(event.currentTarget);
    const next = {
      ...plan, title: String(form.get("title")).trim(), saved: Number(form.get("saved")),
      target: Number(form.get("target")), monthly: Number(form.get("monthly")), months: Number(form.get("months")),
    };
    if (!validPlan(next)) { setNotice("Enter a name and valid plan amounts."); return; }
    try {
      setSaving(true);
      await onSave(next);
      setNotice(savedMessage);
      endEdit();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save. Please try again.");
    } finally { setSaving(false); }
  }

  const ratio = Math.min(plan.saved / plan.target, 1);
  const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(ratio);
  return (
    <dialog ref={dialog} data-goal={plan.id} className={styles.preview} aria-labelledby="detail-title" onClose={onClose}
      onCancel={e => { e.preventDefault(); void dismiss(); }}
      onClick={e => { if (e.target === e.currentTarget) void dismiss(); }}>
      <div className={styles.previewContent}>
        {editing ? (
          <div className={styles.editToolbar}>
            <button type="button" disabled={saving} onClick={cancelEdit}>Cancel</button>
            <h2 ref={heading} tabIndex={-1} id="detail-title">{creating ? "New goal" : "Edit goal"}</h2>
            <button type="submit" form="goal-form" disabled={saving}>{creating ? "Add" : "Save"}</button>
          </div>
        ) : (
          <div className={styles.previewHeading}>
            <h2 ref={heading} tabIndex={-1} id="detail-title">{plan.title}</h2>
            <button type="button" aria-label="Close goal details" onClick={() => void dismiss()}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
        )}
        {editing ? (
          <GoalEditor plan={plan} creating={creating} submit={submit} />
        ) : plan.id === "emergency" ? (
          <EmergencyVault plan={plan} busy={saving} edit={() => { setNotice(""); switchPanel(true); }} save={async next => {
            setSaving(true);
            try { await onSave(next); } finally { setSaving(false); }
          }} />
        ) : (
          <>
            <div className={styles.funding}>
              <div className={styles.ring}>
                <svg viewBox="0 0 88 88" aria-hidden="true">
                  <circle cx="44" cy="44" r="40" />
                  <circle cx="44" cy="44" r="40" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - ratio)} />
                </svg>
                <span>{percent}<small>funded</small></span>
              </div>
              <div><small>Amount saved</small><strong>THB {money.format(plan.saved)}</strong><small>of THB {money.format(plan.target)}</small></div>
            </div>
            <dl>
              <div><dt>Still to save</dt><dd>THB {money.format(Math.max(0, plan.target - plan.saved))}</dd></div>
              <div><dt>Monthly contribution</dt><dd>THB {money.format(plan.monthly)}</dd></div>
              <div><dt>Time remaining</dt><dd>{duration(plan.months)}</dd></div>
            </dl>
            <button className={styles.editAction} ref={editButton} onClick={() => {setNotice(""); switchPanel(true);}}>
              <FontAwesomeIcon icon={faPen} /> Edit goal
            </button>
          </>
        )}
        <p role="status" className={styles.storageNote}>
          {notice === savedMessage && <FontAwesomeIcon className={styles.saveCheck} icon={faCircleCheck} />}
          {notice}</p>
      </div>
    </dialog>
  );
}
