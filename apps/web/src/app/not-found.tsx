import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export default function NotFound() {
  return <AppShell><section className="panel"><h1>Page not found</h1><Link href="/">Return to overview</Link></section></AppShell>;
}
