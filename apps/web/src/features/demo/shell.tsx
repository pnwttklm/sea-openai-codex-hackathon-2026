import Image from "next/image";
import styles from "../goals/future-you.module.css";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export function BackLink() {
  return <Link className="demo-icon" href="/" aria-label="Back to Portfolio"><FontAwesomeIcon icon={faArrowLeft} /></Link>;
}

export function Character({ name }: { name: "nobita" | "doraemon" | "shizuka" }) {
  const filename = name === "doraemon" ? "doraemon-tab.svg" : `${name}.png`;
  return <span className={`character ${name}`}><img src={`/demo/${filename}`} alt="" /></span>;
}

export function DemoNav({ active = "portfolio" }: { active?: "portfolio" | "goals" }) {
  return (
    <nav data-active={active} className={styles.tabs} aria-label="Main navigation">
      <Link href="/" aria-current={active === "portfolio" ? "page" : undefined}>
        <span className={styles.avatar}>
          <Image className={styles.nobita} src={`/future-you/nobita.png`} alt="" width={580} height={1752} sizes="16px" />
        </span>
        Portfolio
      </Link>
      <Link href="/stocks/AMD">
        <Image src={`/future-you/doraemon-tab.svg`} alt="" width={31.605} height={28.105} />
        Invest
      </Link>
      <Link href="/goals" aria-current={active === "goals" ? "page" : undefined}>
        <span className={styles.avatar}>
          <span className={styles.shizukaCrop}>
            <Image className={styles.shizuka} src={`/future-you/shizuka.png`} alt="" width={49} height={49} sizes="49px" />
          </span>
        </span>
        Future You
      </Link>
    </nav>
  );
}
