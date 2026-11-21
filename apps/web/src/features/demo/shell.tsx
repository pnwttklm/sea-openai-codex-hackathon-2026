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

export function DemoNav() {
  return (
    <nav className="demo-nav" aria-label="Main navigation">
      <Link href="/" aria-current="page"><Character name="nobita" />Portfolio</Link>
      <Link href="/stocks/AMD"><Character name="doraemon" />Invest</Link>
      <Link href="/goals"><Character name="shizuka" />Future You</Link>
    </nav>
  );
}
