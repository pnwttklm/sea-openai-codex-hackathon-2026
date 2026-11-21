import Link from "next/link";
import styles from "./future-you.module.css";

function TalkIcon() {
  return (
    <svg viewBox="0 0 36 32" fill="none" aria-hidden="true">
      <path d="M21 9.5h4.5a7.4 7.4 0 0 1 7.4 7.4v.9a7.4 7.4 0 0 1-2.8 5.8l.8 4.1-5.1-2.4H21a7.9 7.9 0 1 1 0-15.8Z" fill="currentColor" opacity=".36"/>
      <path d="M12 3.5h5.8a9.6 9.6 0 0 1 0 19.2h-5.1l-6 3 .9-5.1A9.5 9.5 0 0 1 12 3.5Z" fill="currentColor"/>
      <path d="M9.1 12v2.2m3.6-5.3v8.1m3.6-6.6v5.1m3.5-3.4v1.9" stroke="#454254" strokeWidth="1.9" strokeLinecap="round"/>
    </svg>
  );
}

function WorldIcon() {
  return (
    <svg viewBox="0 0 36 32" fill="none" aria-hidden="true">
      <circle cx="18" cy="16" r="10.7" fill="currentColor" opacity=".18"/>
      <circle cx="18" cy="16" r="10.7" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M21.7 6.1c-5.9 1.1-9.8 4.3-9.7 7.5.1 2.8 4.5 1.6 4.9 4.4.3 2.1-2.6 4.6-2.1 8.1M27.9 12.1c-2.7-.5-5.5.5-5.8 2.6-.4 2.7 3.6 2.2 4.7 4.5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/>
      <path d="M7.2 16.1c-3.3 2.8-4.8 5.3-3.9 6.7 1.5 2.5 9.3.7 17.4-4s13.6-10.7 12.1-13.1c-.8-1.2-3-.9-6.1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function FutureActions() {
  return (
    <div className={styles.futureActions}>
      <Link href="/future-you" className={styles.futureAction}>
        <TalkIcon /><span>Future Talk</span>
      </Link>
      <Link href="/future-world" className={styles.futureAction}>
        <WorldIcon /><span>Future World</span>
      </Link>
    </div>
  );
}
