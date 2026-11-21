import { cookies } from "next/headers";
import { OperatorConsole, SignIn, type Run } from "@/features/companion/operator";
import styles from "@/features/companion/operator.module.css";

export const dynamic = "force-dynamic";

export default async function AgentOperations() {
  const session = (await cookies()).get("prik_agent_operator")?.value;
  let runs: Run[] | null = null;
  let unavailable = false;
  if (session) {
    try {
      const response = await fetch(`${process.env.INTERNAL_API_URL ?? "http://localhost:8000"}/api/v1/ops/agent-runs`, {
        cache: "no-store", headers: { Cookie: `prik_agent_operator=${encodeURIComponent(session)}` },
      });
      if (response.ok) runs = await response.json();
      else unavailable = response.status >= 500;
    } catch { unavailable = true; }
  }
  return <main id="main" className={styles.console}>
    <h1>Agent operations</h1>
    {unavailable ? <p role="alert">Trace storage is unavailable. Reload to reconnect.</p> :
      runs ? <OperatorConsole initial={runs} /> : <SignIn />}
  </main>;
}
