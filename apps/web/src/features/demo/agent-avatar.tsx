"use client";

export function AgentAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <span className="agent-mark" aria-hidden="true" data-busy={busy}>
      <img src="/agents/research.webp" alt="" width={40} height={40} style={{ objectFit: "contain" }} />
    </span>
  );
}
