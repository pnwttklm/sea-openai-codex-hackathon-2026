# Design resources

## Frontend theme reference

Confirmed typography: **Inter** is the primary frontend font, explicitly chosen by the user. It is bundled locally through `@fontsource/inter`, with system fallbacks for glyphs such as Thai that Inter does not cover. Shared typography lives in `apps/web/src/styles/theme.css`. This confirmed preference applies while the rest of the Figma theme awaits inspection.

[Figma pitch deck](https://www.figma.com/slides/K6aUXQ2F5L1BGjekuZ2idF/SEA-x-OpenAI-Codex-Hackathon-2026-Pitch-Deck?node-id=0-1)

The user selected this deck as the frontend theme source. Its colors, typography, shapes, and visual hierarchy take precedence over the temporary starter styling. The Figma canvas overview shows the dark app mockups, including the violet Future You dashboard. The shared theme still needs a slide-level review.

Once inspected, record verified design tokens and representative slide references here before applying the theme across shared UI.

## Product brainstorm

The user reconfirmed this file as a companion frontend reference. Use it for product concepts, feature context, and verified screen or flow guidance alongside the pitch deck theme. The Future You notes below record the frames inspected for that feature.

[Figma brainstorm reference](https://www.figma.com/design/fxGXlNob258j5CekcAFxIH/SEA-x-OpenAI-Codex-Hackathon-2026-Brainstorm?node-id=0-1)

Keep future screen exports and design notes here, recording the source frame or node and export date. Use the [image catalog](../assets/README.md) for the assets discovered in Drive.

## Future You demo

Inspected the Future You goal dashboard `67:1974`, adult Nobita concept `72:6245`, and landscape concept `54:1927` in Figma. The full-screen conversation uses the dashboard's dark and violet palette and centers the imagined older portrait.

The built-in ImageGen tool generated the fictional demo portrait saved at [`apps/web/public/future-you-demo-portrait.png`](../../apps/web/public/future-you-demo-portrait.png). The final prompt was:

> Photorealistic app portrait asset, square. A fictional Thai man aged about 58, silver-black short hair, warm thoughtful expression and slight smile, natural visible age lines, wearing a simple dark indigo shirt. Centered eye-level face and upper shoulders, precisely centered with ample headroom for a circular mobile crop. Looking directly at the camera as if listening during a video conversation. Soft natural window light from left and faint violet rim light, an atmospheric deep midnight navy blurred background. Natural skin texture, editorial photography. One person only, no text, no logos, no interface. This is an invented person, do not imitate any face from user reference imagery.
