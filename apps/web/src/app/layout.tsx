import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/inter/wght-italic.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import "./demo.css";
import "@/styles/theme.css";

export const metadata: Metadata = { title: "Prik Thai AI", description: "A financial companion built around your goals." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
