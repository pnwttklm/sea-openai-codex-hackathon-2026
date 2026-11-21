# Investor Companion

The full conversation is available at `/companion`. On a stock page, the character greets the investor once per symbol per browser session. The greeting uses the shared demo portfolio to show the selected stock’s weight or that it is not held. View position opens the portfolio breakdown. Talk later dismisses the dialog and returns focus to the launcher. Specialist portraits follow the presenters returned by the API.

The four Doraemon illustrations in [public/agents](../../../public/agents) identify the Companion (broom), Goal Planner (bow), Portfolio Analyst (crown), and Sentiment Analyst (red cape). The shared mascot component selects the portrait by agent role.

The operator page has its own server-side session check and API authorization. See the [backend contract](../../../../../docs/contracts/agent-operations.md).
