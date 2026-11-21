"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navigation } from "./navigation";
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/future-you" || pathname.startsWith("/future-you/")) return children;
  return <div className="shell"><header><Link className="brand" href="/">Prik Thai <span>AI</span></Link><Navigation /></header><main id="main">{children}</main><footer>Hackathon development starter · No live financial data</footer></div>;
}
