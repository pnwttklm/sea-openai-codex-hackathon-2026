# Future World integration handoff

These are proposed integration points for the teammate building the backend, MongoDB, and AI services. The current frontend uses local demo goals, scripted Doraemon replies, and predefined Three.js landmarks. Backend and Frontend should agree on payloads and failure states in the [shared contracts](../contracts/README.md) before wiring them together.

## 1. Let Doraemon answer and ask back

When the player taps **Talk to Doraemon**, open a conversation where they can type a question or choose a suggested reply. If Doraemon was looking at a landmark, the scene already supplies its goal ID. Use that context for the opening exchange. When he is wandering, let him ask which goal the player wants to discuss.

- **Backend and Data** — Resolve the goal ID against the signed-in user’s goals. Keep the conversation ID, turns, and current goal together so a short reply such as “500 more” makes sense in the next turn.
- **AI** — Use the server-side OpenAI SDK to answer from the saved goal and ask a relevant follow-up. For example, after “When could I buy my car?”, Doraemon could ask “Would you like to see what happens if you save another ฿500 each month?” Trigger the model when the player engages. Wandering and notebook animations already run locally.
- **Frontend** — Replace the scripted reply in the conversation sheet. Preserve the pause while talking and resume exploring on close. If a turn fails, keep the typed question available to retry. [Conversation sheet](../../apps/web/src/features/future-world/future-world.tsx) · [Doraemon’s routine](../../apps/web/src/features/future-world/guide-routine.ts)

## 2. Make a reply interactive

Start with one graph the player can change. For the car example, show two projected savings lines against the target, one for the saved monthly contribution and one for the extra ฿500. Tapping a different contribution should update the comparison. Keep the saved plan intact while the player explores.

- **Backend** — Calculate the series and estimated dates from the same goal values used in the conversation. A first version could assume monthly contributions and zero investment growth. Return those assumptions with the figures.
- **AI and Frontend** — Agree on a structured chart response carrying the goal ID, series labels, month and THB values, and supported actions. The model can introduce the chart and ask the next question. The mobile sheet renders the graph, a readable text summary, and tappable contribution choices.
- **Demo check** — With ฿20,000 saved toward ฿50,000, a constant ฿2,000 per month reaches the target in 15 months. Choosing **Add ฿500/month** should show 12 months on both the graph and in Doraemon’s answer under the same assumptions.

## 3. Personalize the 3D object when a goal is added

For a goal named “Mint-green electric car,” the town should show a mint-green car. A practical first version is for AI to select a supported model and visual details such as body color and accessories. Three.js can render those choices with the existing art.

- **Backend and Data** — Save the goal first and return its ID so the town can show a default landmark immediately. Store the validated appearance and its revision with that goal in MongoDB. Reloads should reuse it. A delayed or retried customization should update the same goal’s object.
- **AI** — Use the goal title and any visual preferences the user supplied to produce a description the renderer supports. Agree on the available models, colors, and accessories with Frontend. Keep the default appearance usable if generation fails.
- **Frontend** — Connect goal creation to the backend at the [goal store](../../apps/web/src/features/goals/use-goal-plans.ts). Pass the appearance through the [landmark mapping](../../apps/web/src/features/future-world/landmarks.ts) into the [Three.js art](../../apps/web/src/features/future-world/world-art.ts). The [scene update](../../apps/web/src/features/future-world/world-scene.ts) currently compares goal IDs and landmark kinds, so it must also detect a new appearance for an existing object.
- **Demo check** — Add the mint-green car, enter town, and see its customization arrive in the original plot. Reload and verify the car keeps its appearance and opens the same goal. For a customized house, also check that entering and leaving returns the player to its doorstep.
