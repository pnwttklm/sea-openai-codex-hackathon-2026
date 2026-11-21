import Image from "next/image";
import Link from "next/link";

const features = [
  { href: "/goals", title: "Goals", description: "Give your investments a direction." },
  { href: "/journal", title: "Journal", description: "Reflect on the decisions you make along the way." },
  { href: "/companion", title: "Companion", description: "Explore AI guidance for your investing habits." },
];

export default function Home() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <h1 id="home-title">Meet your <em>future self.</em></h1>
          <p>Talk to an older version of yourself about the goals that matter and what your portfolio can do for them.</p>
          <Link className="home-action" href="/future-you">Meet future me</Link>
        </div>
        <div className="home-portrait">
          <Image
            src="/future-you-demo-portrait.png"
            alt="An imagined older version of the demo profile"
            width={360}
            height={360}
            priority
          />
        </div>
      </section>
      <section className="cards home-cards" aria-label="Explore Prik Thai AI">
        {features.map(({ href, title, description }) => (
          <Link className="card home-card" href={href} key={href}>
            <span className="home-card-title">{title}</span>
            <span>{description}</span>
            <span className="home-card-preview">Preview</span>
          </Link>
        ))}
      </section>
    </>
  );
}
