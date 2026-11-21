import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api/client";
import type { components } from "@/lib/api/demo.generated";
import { Mascot } from "../companion/mascots";

type News = components["schemas"]["StockNews"];

export function StockNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<News>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await apiPost<News>(`/api/v1/companion/news/${symbol}`, {}, controller.signal);
        if (!controller.signal.aborted) setNews(data);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load news.");
      }
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [symbol, attempt]);
  function retry() { setError(""); setNews(undefined); setAttempt(value => value + 1); }

  return <section className="stock-news" aria-label={symbol + " news"}>
    <h2>{symbol} news</h2>
    {error ? <p role="alert">{error} <button onClick={retry}>Retry</button></p>
      : !news ? <p role="status">Loading headlines and analysis…</p>
      : <>
        <p className="source-label">{news.source === "demo" ? "Illustrative demo headlines" : "Webull headlines"} · Past 7 days</p>
        {news.items.length === 0 ? <p>No recent headlines for {symbol}.</p> : <>
          <ul>{news.items.map(item => <li key={item.title}>
            <small>{[item.publisher, new Date(item.published).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), item.tone].filter(Boolean).join(" · ")}</small>
            <h3>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</h3>
          </li>)}</ul>
          <section className="news-analysis" aria-label="Headline analysis"><div>
            <Mascot agent="sentiment_analyst" size={42} /><h3>{news.analysis_source === "ai" ? "AI analysis" : "Headline analysis"}</h3>
          </div>{news.summary ? <p>{news.summary}</p> : <p>Analysis is unavailable. <button onClick={retry}>Try again</button></p>}
          </section>
        </>}
      </>}
  </section>;
}
