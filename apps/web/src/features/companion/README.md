# Investor Companion

The full conversation is available at `/companion`. On a stock page, the character greets the investor once per symbol per browser session. The greeting uses the shared demo portfolio to show the selected stock’s weight or that it is not held. View position opens the portfolio breakdown. Talk later dismisses the dialog and returns focus to the launcher. Specialist portraits follow the presenters returned by the API.

Four transparent GPT Image mascots are stored in [public/agents](../../../public/agents). The prompt set used a glossy 3D toy style, a full-body pose and a transparent background. The Companion is a mint-blue otter concierge with a visor and satchel, Goal Planner a coral rabbit with a flag, Portfolio Analyst a mint turtle with glasses and a pie-chart shell, and Sentiment Analyst a violet owl with headphones. The app uses 320-pixel WebP versions.

The operator page has its own server-side session check and API authorization. See the [backend contract](../../../../../docs/contracts/agent-operations.md).
