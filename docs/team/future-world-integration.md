# Future World integration handoff

These are proposed integration points for the teammate building the backend, MongoDB, and AI services. The current frontend uses local demo goals, scripted Doraemon replies, and predefined Three.js landmarks. Backend and Frontend should agree on payloads and failure states in the [shared contracts](../contracts/README.md) before wiring them together.

## Who the player is talking to

Nobita is the playable avatar in town and inside houses. The authenticated account owns the goals and conversations. All players appear as Nobita, so use the account identity from the session for MongoDB reads and writes.

| Character | Current interaction | Backend integration |
| --- | --- | --- |
| Doraemon (`town-guide`) | **Talk to Doraemon** opens his sheet. When he is inspecting a landmark or writing in his notebook, the scene returns that goal’s ID. | Connect this interaction to the proposed LLM conversation and chart flow below. Treat the goal ID as optional and verify ownership before loading its data. |
| Shopee dog (`shopee-dog`) | **Say hi to Shopee dog** and **Pet the dog** give local responses. The dog pauses during the interaction and resumes wandering afterward. | Keep greeting and petting client-side. They require zero model calls or conversation writes. |

The two companions share the same sheet component. Wire the model request inside the Doraemon branch of `discover`, where both the companion and optional goal are known. A sheet opening on its own is ambiguous. The current identifiers are scene object names; agree on any API fields in the shared contract. [Frontend interaction handler](../../apps/web/src/features/future-world/future-world.tsx) · [Scene interaction dispatch](../../apps/web/src/features/future-world/world-scene.ts)

To check the integration, open a Doraemon conversation at a goal, close it, then greet and pet the dog. Doraemon’s conversation history should still contain only his exchange. Start another conversation while Doraemon is wandering and verify that the previous landmark is not silently attached to the new exchange.

## 1. Let Doraemon answer and ask back

Doraemon can also walk up to Nobita and bring up a landmark near Nobita, one he recently inspected, or another goal he is curious about. Any goal in town can come up, including a goal awaiting its first contribution or one already funded. The frontend uses that context and the saved amounts to choose an opening line. The accepted conversation shows a progress bar for the same goal. If the player chooses **Let’s talk**, the same Doraemon conversation handler receives that goal ID. Use it to continue the topic when wiring the LLM. Dismissing or walking away ends the invitation locally.

When the player taps **Talk to Doraemon**, open a conversation where they can type a question or choose a suggested reply. If Doraemon was looking at a landmark, the scene already supplies its goal ID. Use that context for the opening exchange. When he is wandering, let him ask which goal the player wants to discuss.

- **Backend and Data** — Resolve the goal ID against the signed-in user’s goals. Keep the conversation ID, turns, and current goal together so a short reply such as “500 more” makes sense in the next turn.
- **AI** — Use the server-side OpenAI SDK to answer from the saved goal and ask a relevant follow-up. For example, after “When could I buy my car?”, Doraemon could ask “Would you like to see what happens if you save another ฿500 each month?” Trigger the model when the player engages. Wandering and notebook animations already run locally.
- **Frontend** — Replace the scripted reply in the conversation sheet. Preserve the pause while talking and resume exploring on close. If a turn fails, keep the typed question available to retry. [Conversation sheet](../../apps/web/src/features/future-world/future-world.tsx) · [Doraemon’s routine](../../apps/web/src/features/future-world/guide-routine.ts)

## 2. Include a visual in every Doraemon AI reply

**Every Doraemon AI reply must include a visual that helps answer the question, alongside a short, accessible caption.** This applies to player-initiated chats, follow-up turns, and AI replies after the player accepts a town reminder. Show the visual directly in the conversation.

| What the player asks | What Doraemon shows |
| --- | --- |
| “How close am I to my car?” | A progress bar labeled with the amount saved, target, and THB remaining. |
| “What if I save ฿500 more each month?” | A graph comparing the current and proposed savings paths against the target. Tapping a contribution updates the graph and caption while preserving the saved plan. |
| “Which goal should we look at?” | Tappable cards for the player’s saved goals. Each card names the goal and shows its landmark icon. If there are no saved goals, show an illustrated **Add a goal** card. |

- **Backend** — Calculate the series and estimated dates from the same goal values used in the conversation. A first version could assume monthly contributions and zero investment growth. Return those assumptions with the figures.
- **API acceptance check** — Require a caption and at least one supported visual in each successful AI reply. Validate the data for that visual before returning it. For a savings graph, include labeled series, units, and backend-calculated values. When information is missing, return a card that lets the player supply it. Cover a caption-only response as a validation failure.
- **Demo check** — With ฿20,000 saved toward ฿50,000, a constant ฿2,000 per month reaches the target in 15 months. Choosing **Add ฿500/month** should show 12 months on both the graph and in Doraemon’s answer under the same assumptions.

## 3. Personalize the 3D object when a goal is added

For a goal named “Mint-green electric car,” the town should show a mint-green car. A practical first version is for AI to select a supported model and visual details such as body color and accessories. Three.js can render those choices with the existing art.

- **Backend and Data** — Save the goal first and return its ID so the town can show a default landmark immediately. Store the validated appearance and its revision with that goal in MongoDB. Reloads should reuse it. A delayed or retried customization should update the same goal’s object.
- **AI** — Use the goal title and any visual preferences the user supplied to produce a description the renderer supports. Agree on the available models, colors, and accessories with Frontend. Keep the default appearance usable if generation fails.
- **Frontend** — Connect goal creation to the backend at the [goal store](../../apps/web/src/features/goals/use-goal-plans.ts). Pass the appearance through the [landmark mapping](../../apps/web/src/features/future-world/landmarks.ts) into the [Three.js art](../../apps/web/src/features/future-world/world-art.ts). The [scene update](../../apps/web/src/features/future-world/world-scene.ts) currently compares goal IDs and landmark kinds, so it must also detect a new appearance for an existing object.
- **Demo check** — Add the mint-green car, enter town, and see its customization arrive in the original plot. Reload and verify the car keeps its appearance and opens the same goal. For a customized house, also check that entering and leaving returns the player to its doorstep.
