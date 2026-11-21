# Design resources

The [Figma pitch deck](https://www.figma.com/slides/K6aUXQ2F5L1BGjekuZ2idF/SEA-x-OpenAI-Codex-Hackathon-2026-Pitch-Deck?node-id=0-1) was inspected on 2026-11-21. Its demo slides show the dark portrait shell and saturated blue and violet gradients. The prototype applies those treatments view by view and uses the user-selected Inter font.

The [Figma brainstorm](https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=0-1) supplies the visual targets for DEMO-01. The four renders were inspected on 2026-11-21.

| View | Node | Extracted visual details |
| --- | --- | --- |
| Portfolio history | `54:1325` | Blue profile gradient, teal history, segmented ranges, score card, holdings and glass navigation |
| Portfolio allocation | `54:1541` | Black background, purple leading donut segment and shared holdings |
| Stock detail | `67:3497` | Dark AMD quote header, INVX segment and fundamentals radar |
| Investing behavior | `73:7643` | Violet header, score ring, five radar axes and factor cards |

The prototype uses synthetic market and portfolio values and displays unavailable states for views without a fixture. Original character and selected ticker assets used by the implementation are stored in the frontend public assets.

Once inspected, record verified design tokens and representative slide references here before applying the theme across shared UI.

## Product brainstorm

The user reconfirmed this file as a companion frontend reference. Use it for product concepts, feature context, and verified screen or flow guidance alongside the pitch deck theme. The Future You notes below record the frames inspected for that feature.

[Figma brainstorm reference](https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=0-1)

Keep future screen exports and design notes here, recording the source frame or node and export date. Use the [image catalog](../assets/README.md) for the assets discovered in Drive.

## Future You demo

Inspected the Future You goal dashboard `67:1974`, adult Nobita concept `72:6245`, and landscape concept `54:1927` in Figma. The full-screen conversation uses the dashboard's dark and violet palette and centers the imagined older portrait.

The built-in ImageGen tool generated the fictional demo portrait saved at [`apps/web/public/future-you-demo-portrait.png`](../../apps/web/public/future-you-demo-portrait.png). The final prompt was:

> Photorealistic app portrait asset, square. A fictional Thai man aged about 58, silver-black short hair, warm thoughtful expression and slight smile, natural visible age lines, wearing a simple dark indigo shirt. Centered eye-level face and upper shoulders, precisely centered with ample headroom for a circular mobile crop. Looking directly at the camera as if listening during a video conversation. Soft natural window light from left and faint violet rim light, an atmospheric deep midnight navy blurred background. Natural skin texture, editorial photography. One person only, no text, no logos, no interface. This is an invented person, do not imitate any face from user reference imagery.
