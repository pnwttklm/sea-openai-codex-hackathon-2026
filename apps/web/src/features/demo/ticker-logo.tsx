const logos: Record<string, string> = { SGOV: "sgov.svg", VT: "vt.svg", SE: "se.svg", GLD: "gld.svg", BTC: "btc.svg", NVDA: "nvda.jpg", AAPL: "aapl.svg", MSTR: "mstr.jpg", MSFT: "msft.svg" };

export function TickerLogo({ symbol }: { symbol: string }) {
  return <span className={`ticker-logo ticker-${symbol.toLowerCase()}`} aria-hidden="true">
    {logos[symbol] ? <img src={`/demo/${logos[symbol]}`} alt="" /> :
      ({ VOO: "500", QQQ: "100" }[symbol] ?? symbol.slice(0, 2))}
  </span>;
}
