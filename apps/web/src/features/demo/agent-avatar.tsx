"use client";

import { Mascot } from "../companion/mascots";

export function AgentAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <span className="agent-mark" aria-hidden="true" data-busy={busy}>
      <Mascot agent="portfolio_analyst" size={40} />
    </span>
  );
}
