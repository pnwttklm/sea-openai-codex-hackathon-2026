import { useState } from "react";
import { FutureContextPanel } from "./future-context";
import styles from "./system-map.module.css";

const workflows = [
  {
    label: "Future Talk",
    title: "Speak with your future self",
    steps: [
      ["Goals → Future Talk · /future-you", "GET /api/v1/future-you/context loads the saved profile and goals and reports whether voice is enabled."],
      ["Microphone → FastAPI", "Starting a call requests microphone access. The browser sends its WebRTC offer to POST /api/v1/future-you/voice."],
      ["Profile, goals and portfolio", "The API reads the profile, goals and latest available portfolio snapshot. It adds the goal projections from assess_plan to the session instructions."],
      ["OpenAI Realtime → browser", "The server creates a short-lived session credential and exchanges the offer at /realtime/calls. WebRTC carries the audio and transcript events."],
    ],
  },
  {
    label: "Goal chat",
    title: "Ask Doraemon about a goal",
    steps: [
      ["Companion · /companion", "The chat loads saved goal choices from GET /api/v1/future-you/context."],
      ["Doraemon router", "POST /api/v1/companion/turns sends the question and optional goal ID. The router assigns goal questions to Goal Planner."],
      ["Goal Planner · FastMCP", "assess_my_goal reads a saved goal from MongoDB. For a proposed monthly amount, preview_my_contribution compares it with the saved plan."],
      ["Projection and run trace", "assess_plan calculates projected savings, the shortfall and the required monthly contribution. Open the turn in Recent runs to inspect its tool and database calls."],
    ],
  },
  {
    label: "Future portrait",
    title: "Generate a future portrait",
    steps: [
      ["Selfie → PNG", "When media is enabled, the investor can choose a photo. prepareSelfie converts it to PNG in the browser."],
      ["FastAPI → OpenAI Images", "POST /api/v1/future-you/portrait checks the saved profile and validates the upload. images.edit generates the imagined older portrait."],
      ["Portrait → voice style", "match_portrait_voice uses responses.parse to suggest a voice style when available. The browser displays the returned PNG and can pass the style into a voice call."],
    ],
  },
  {
    label: "Goal plans",
    title: "Load and update a goal",
    steps: [
      ["Goals · /goals", "useGoalPlans loads the shared demo with GET /api/v1/companion/goals. In browser-only mode it reads saved plans from localStorage."],
      ["Confirm changes", "In shared mode, POST /api/v1/companion/goals submits the edited plan and its revision. Browser-only mode saves the change locally."],
      ["MongoDB · future_you_demo", "The API saves the shared goal and returns its new revision. A conflicting edit returns HTTP 409 and the editor reloads the latest goals."],
    ],
  },
  {
    label: "Future World",
    title: "Explore a goal in town",
    steps: [
      ["Goals → Future World", "The town at /future-world reads the same plans through useGoalPlans. Each eligible goal becomes a landmark through worldLandmarks."],
      ["Three.js · browser", "The browser renders the town. nextReminderGoal picks a goal and reminderMessage builds Doraemon’s prompt from its savings and target."],
      ["Landmark → trip ticket", "Opening a landmark shows its funding progress. Supported goals open /future-you/[goal] to show the time horizon and savings."],
    ],
  },
];

export function FutureYouMap() {
  const [selected, setSelected] = useState(workflows[0]);
  return <>
    <div className={styles.workflowButtons} role="group" aria-label="Future You workflows">
      {workflows.map(flow => <button key={flow.label} type="button" aria-pressed={selected === flow}
        aria-controls="future-workflow" onClick={() => setSelected(flow)}>{flow.label}</button>)}
    </div>
    <section id="future-workflow" className={styles.tools} aria-live="polite" aria-atomic="true">
      <h3>{selected.title}</h3>
      <ol className={styles.steps}>
        {selected.steps.map(([title, detail]) => <li key={title}><strong>{title}</strong><small>{detail}</small></li>)}
      </ol>
    </section>
    <FutureContextPanel />
    <details className={styles.apiRoutes}>
      <summary>Additional Future You API tools</summary>
      <p>These endpoints are available to API clients under <code>/api/v1/future-you</code>.</p>
      <dl>
        <dt>POST /assessment</dt><dd>Calculates a projection from the submitted plan using assess_plan.</dd>
        <dt>POST /image</dt><dd>Edits a selfie for the supplied goal type and time horizon.</dd>
        <dt>POST /portrait/&#123;goal_id&#125;</dt><dd>Reads the selected saved goal to set the portrait scene and time horizon.</dd>
        <dt>POST /video</dt><dd>OpenAI Images animates the portrait, then FFmpeg converts the GIF to a silent MP4.</dd>
      </dl>
    </details>
  </>;
}
