"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [{ href: "/", label: "Overview" }, { href: "/goals", label: "Goals" }, { href: "/journal", label: "Journal" }, { href: "/companion", label: "Companion" }];
export function Navigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation">{links.map(({ href, label }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
