"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { faArrowLeft, faHouse, faMoon, faSun, faTicket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { duration, initialPlans, money } from "../goals/demo-goals";
import { useGoalPlans } from "../goals/use-goal-plans";
import { landmarkStyles, worldLandmarks, type Landmark } from "./landmarks";
import { goalFollowUp, reminderMessage, type GoalReminder } from "./goal-reminder";
import type { WorldScene } from "./world-scene";
import styles from "./future-world.module.css";

const ticketGoals = new Set(initialPlans.filter(plan => plan.id !== "emergency").map(plan => plan.id));

function WorldSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} className={styles.sheet} aria-label={label}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      {children}
    </dialog>
  );
}

function FundingDetails({ landmark, onEnter, onClose }: { landmark: Landmark; onEnter?: () => void; onClose: () => void }) {
  const { plan, kind } = landmark;
  const funded = Math.round(Math.min(1, plan.saved / plan.target) * 1000) / 10;
  const theme = landmarkStyles[kind];
  return (
    <WorldSheet label={`${plan.title} funding`} onClose={onClose}>
      <div className={styles.detailsHeading}>
        <span className={styles.landmarkIcon} style={{ backgroundColor: theme.color }}><FontAwesomeIcon icon={theme.icon} /></span>
        <div>
          <h2>{plan.title}</h2>
          <span>{duration(plan.months)} from now</span>
        </div>
        <button className={styles.iconButton} type="button" aria-label="Close goal details" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <dl className={styles.funding}>
        <div><dt>Saved</dt><dd>THB {money.format(plan.saved)}</dd></div>
        <div><dt>Target</dt><dd>THB {money.format(plan.target)}</dd></div>
      </dl>
      <div className={styles.progress} role="progressbar" aria-label="Goal funded" aria-valuenow={funded}>
        <span style={{ width: `${funded}%`, background: theme.color }} />
      </div>
      <div className={styles.detailsFooter}>
        <span>{funded}% funded</span>
        {onEnter && <button onClick={onEnter}><FontAwesomeIcon icon={faHouse} /> Enter house</button>}
        {ticketGoals.has(plan.id) && (
          <Link href={`/future-you/${plan.id}`}><FontAwesomeIcon icon={faTicket} /> Trip ticket</Link>
        )}
      </div>
    </WorldSheet>
  );
}

export function FutureWorld({ initialGoal, houseId }: { initialGoal?: string; houseId?: string }) {
  const [interiorId, setInteriorId] = useState<string | null>(null);
  const town = interiorId === null;
  const [night, setNight] = useState(false);
  const [reminder, setReminder] = useState<GoalReminder | null>(null);
  const [conversationGoalId, setConversationGoalId] = useState<string | undefined>(undefined);
  const [guideReply, setGuideReply] = useState("");
  const { plans, loaded } = useGoalPlans();
  const landmarks = useMemo(() => worldLandmarks(plans), [plans]);
  const [selectedId, setSelectedId] = useState(initialGoal ?? null);
  const [nearbyId, setNearbyId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<"loading" | "ready" | "fallback">("loading");
  const pointer = useRef<number | null>(null);
  const pad = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<WorldScene | null>(null);
  const latestLandmarks = useRef(landmarks);
  const activeTrigger = useRef<HTMLElement | null>(null);
  const selected = landmarks.find(plot => plot.plan.id === selectedId);
  const dogOpen = selectedId === "shopee-dog";
  const companionName = dogOpen ? "Shopee dog" : "Doraemon";
  const guideOpen = dogOpen || selectedId === "town-guide";
  const panelOpen = Boolean(selected || guideOpen);
  const invitation = landmarks.find(plot => plot.plan.id === reminder?.id);
  const conversationGoal = landmarks.find(plot => plot.plan.id === conversationGoalId);
  const nearby = landmarks.find(plot => plot.plan.id === nearbyId);
  const enterNearby = town && nearby?.kind === "house";
  const nearbyLabel = nearbyId === "house-exit" ? "Exit to town"
    : enterNearby ? "Enter house"
    : nearbyId === "shopee-dog" ? "Say hi to Shopee dog"
    : nearbyId === "town-guide" ? "Talk to Doraemon"
    : town && nearby ? "Explore " + nearby.plan.title : null;
  const discover = useCallback((id: string, trigger?: HTMLElement) => {
    if (id === "shopee-dog") {
      scene.current?.startConversation(id);
      setGuideReply("Woof! The little dog perks up and wags his tail at Nobita.");
    } else if (id === "town-guide") {
      const subject = scene.current?.startConversation(id);
      const plan = latestLandmarks.current.find(plot => plot.plan.id === subject)?.plan;
      setConversationGoalId(subject);
      setGuideReply(plan
        ? goalFollowUp(plan)
        : "Hi! I’m taking a walk around your town. Come look at the goals with me!");
    }
    activeTrigger.current = trigger ?? null;
    setSelectedId(id);
    releaseStick();
    scene.current?.stop();
  }, []);

  useEffect(() => {
    latestLandmarks.current = landmarks;
    scene.current?.setLandmarks(landmarks);
  }, [landmarks]);

  useEffect(() => {
    if (!loaded || !canvas.current) return;
    const element = canvas.current;
    let cancelled = false;
    const dogImage = new Image();
    dogImage.src = "/future-world/player-turnaround.webp";
    Promise.all([import("./world-scene"), dogImage.decode()]).then(([{ mountWorld }]) => {
      if (cancelled) return;
      scene.current = mountWorld({
        canvas: element, houseId, dogImage,
        landmarks: latestLandmarks.current,
        onReminder: setReminder,
        onNearby: setNearbyId,
        onInspect: discover,
        onInterior: setInteriorId,
        onAvailability: available => setAvailability(available ? "ready" : "fallback"),
      });
    }).catch(() => {
      if (!cancelled) setAvailability("fallback");
    });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [houseId, discover, loaded]);

  useEffect(() => {
    if (town && availability === "ready") scene.current?.setNight(night);
  }, [town, availability, night]);

  useEffect(() => {
    if (availability === "ready") scene.current?.setPanelOpen(panelOpen);
  }, [availability, panelOpen]);

  const closeDetails = useCallback(() => {
    scene.current?.endConversation();
    setConversationGoalId(undefined);
    setSelectedId(null);
    const trigger = activeTrigger.current;
    activeTrigger.current = null;
    requestAnimationFrame(() => (trigger?.isConnected ? trigger : pad.current)?.focus({ preventScroll: true }));
  }, []);

  const interactNearby = useCallback((trigger?: HTMLElement) => {
    if (!nearbyId) return;
    if (nearbyId === "house-exit" || enterNearby) {
      releaseStick();
      scene.current?.stop();
      if (enterNearby) scene.current?.enterHouse(nearbyId);
      else scene.current?.exitHouse();
    } else {
      discover(nearbyId, trigger);
    }
  }, [discover, enterNearby, nearbyId]);

  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      const target = event.target;
      if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented ||
        (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, select, textarea")))) return;
      const key = event.key.toLowerCase();
      if (!panelOpen && /^(arrow(left|right|up|down)|[wasd])$/.test(key) && availability === "ready") {
        event.preventDefault();
        scene.current?.key(key, true);
      }
      if (key === "e" && !event.repeat && availability === "ready" && !panelOpen) interactNearby();
      if (event.key === "Escape" && selectedId) closeDetails();
    }
    function keyUp(event: KeyboardEvent) { scene.current?.key(event.key.toLowerCase(), false); }
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [availability, closeDetails, interactNearby, panelOpen, selectedId]);

  function releaseStick() {
    pointer.current = null;
    scene.current?.setStick(0, 0);
    pad.current?.style.removeProperty("--dx");
    pad.current?.style.removeProperty("--dy");
  }

  useEffect(() => {
    window.addEventListener("blur", releaseStick);
    return () => window.removeEventListener("blur", releaseStick);
  }, []);

  function steer(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointer.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const radius = rect.width * 0.27;
    const length = Math.max(radius, Math.hypot(dx, dy));
    const x = dx / length, y = dy / length;
    event.currentTarget.style.setProperty("--dx", x * radius + "px");
    event.currentTarget.style.setProperty("--dy", y * radius + "px");
    scene.current?.setStick(x, y);
  }

  return (
    <main id="main" className={styles.page} aria-label="Future World">
      <canvas ref={canvas} className={styles.canvas} aria-label={town ? "Walk through your goal town" : "Walk through your future home"}
        onClick={event => { if (!panelOpen) scene.current?.inspect(event.clientX, event.clientY); }} />
      <Link href="/goals" className={styles.back} aria-label="Back to Future You"><FontAwesomeIcon icon={faArrowLeft} /></Link>
      <div className={styles.travel}>
        {town && availability === "ready" && <button type="button" aria-label="Night mode" aria-pressed={night} onClick={() => setNight(value => !value)}>
          <FontAwesomeIcon icon={night ? faSun : faMoon} />
        </button>}
      </div>
      {town && availability === "ready" && !panelOpen && invitation && reminder && (
        <aside className={styles.invitation} aria-label="Message from Doraemon">
          <span className={styles.portrait} aria-hidden="true" />
          <div>
            <strong>Doraemon</strong>
            <p role="status">{reminderMessage(invitation.plan, reminder.reason)}</p>
            <div className={styles.answers}>
              <button onClick={() => discover("town-guide")}>Let’s talk</button>
              <button onClick={() => scene.current?.dismissReminder()}>Maybe later</button>
            </div>
          </div>
        </aside>
      )}
      {availability === "ready" && !panelOpen && nearbyId && nearbyLabel && !(invitation && nearbyId === "town-guide") && (
        <button className={styles.interact} title={enterNearby ? nearby?.plan.title : undefined} onClick={event => interactNearby(event.currentTarget)}>{nearbyLabel}</button>
      )}
      {availability === "ready" && !panelOpen && (
        <div ref={pad} className={styles.stick} tabIndex={0} role="group"
          aria-label="Move Nobita with the joystick or arrow keys. Press E to interact."
          onPointerDown={event => {
            if (event.button !== 0 || pointer.current !== null) return;
            pointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            steer(event);
          }}
          onPointerMove={steer}
          onPointerUp={event => { if (event.pointerId === pointer.current) releaseStick(); }}
          onPointerCancel={event => { if (event.pointerId === pointer.current) releaseStick(); }}
          onLostPointerCapture={event => { if (event.pointerId === pointer.current) releaseStick(); }}>
          <span />
        </div>
      )}
      {availability === "loading" && <p className={styles.message} role="status">Opening your world…</p>}
      {availability === "fallback" && !selected && (
        <section className={styles.message}><h2>3D view unavailable</h2><p>Explore your saved goals here.</p>
          {landmarks.map(({ plan }) => <button key={plan.id} onClick={event => discover(plan.id, event.currentTarget)}>{plan.title}</button>)}
        </section>
      )}
      {guideOpen && <WorldSheet label={companionName} onClose={closeDetails}>
        <div className={styles.guideHeading}><h2>{companionName}</h2>
          <button className={styles.iconButton} onClick={closeDetails} aria-label="Close conversation"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <p aria-live="polite">{guideReply}</p>
        {!dogOpen && conversationGoal && <label className={styles.goalMeter}>
          <span>{conversationGoal.plan.title} · ฿{money.format(conversationGoal.plan.saved)} of ฿{money.format(conversationGoal.plan.target)}</span>
          <progress value={Math.min(conversationGoal.plan.saved, conversationGoal.plan.target)} max={conversationGoal.plan.target} />
        </label>}
        <div className={styles.answers}>
          {dogOpen ? <button onClick={() => setGuideReply("The little dog leans into your hand. Woof!")}>Pet the dog</button> :
          conversationGoal ? <button onClick={() => {
            scene.current?.endConversation();
            setSelectedId(conversationGoal.plan.id);
            setConversationGoalId(undefined);
          }}>Show my progress</button> :
          <button onClick={() => setGuideReply("Save a goal in Future You and a new landmark appears here. Tap it to see your progress.")}>How do goals appear?</button>}
          <button onClick={closeDetails}>Back to exploring</button>
        </div>
      </WorldSheet>}
      {selected && <FundingDetails landmark={selected} onEnter={town && selected.kind === "house" && availability === "ready" ? () => {
        setSelectedId(null);
        scene.current?.enterHouse(selected.plan.id);
      } : undefined} onClose={closeDetails} />}
    </main>
  );
}
