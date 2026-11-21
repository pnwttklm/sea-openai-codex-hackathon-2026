"use client";

import { BotAvatar } from "bot-avatars";

export function AgentAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <span className="agent-mark" aria-hidden="true">
      <BotAvatar type="clover" state={busy ? "working" : "default"} size={40} theme="dark" interactive={false} />
    </span>
  );
}
