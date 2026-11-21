import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/700-italic.css";
import "@fontsource/inter/800.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import "./demo.css";
import "@/styles/theme.css";

export const metadata: Metadata = { title: "Prik Thai AI", description: "A financial companion built around your goals." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
