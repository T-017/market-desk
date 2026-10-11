const MOCK_EOD = {
  AAPL: { close: 227.52, open: 225.10, high: 228.40, low: 224.80, volume: 41200300, date: "2026-09-25" },
  MSFT: { close: 428.11, open: 426.00, high: 430.25, low: 424.90, volume: 18422000, date: "2026-09-25" },
  TSLA: { close: 248.73, open: 251.20, high: 253.00, low: 246.10, volume: 73110400, date: "2026-09-25" },
  AMZN: { close: 191.04, open: 189.55, high: 192.80, low: 188.90, volume: 32155000, date: "2026-09-25" },
  NVDA: { close: 121.38, open: 119.90, high: 122.75, low: 119.20, volume: 268441000, date: "2026-09-25" },
  JPM: { close: 214.66, open: 213.10, high: 215.80, low: 212.40, volume: 8123000, date: "2026-09-25" },
  NVO: { close: 118.42, open: 117.00, high: 119.55, low: 116.80, volume: 5401200, date: "2026-09-25" },
  SHEL: { close: 72.18, open: 71.90, high: 72.65, low: 71.40, volume: 4102300, date: "2026-09-25" },
  SONY: { close: 21.05, open: 20.88, high: 21.22, low: 20.71, volume: 3901400, date: "2026-09-25" },
  BABA: { close: 96.44, open: 95.10, high: 97.30, low: 94.80, volume: 15220300, date: "2026-09-25" },
};

function getKey() {
  return window.MARKET_DESK_CONFIG?.MARKETSTACK_KEY || "";
};

function getKey() {
  return window.MARKET_DESK_CONFIG?.MARKETSTACK_KEY || "";
}

function buildUrl(symbols) {
  const key = getKey();
  const joined = symbols.join(",");
  return `https://api.marketstack.com/v1/eod?access_key=${encodeURIComponent(key)}&symbols=${encodeURIComponent(joined)}`;
}

export async function fetchEod(symbols) {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const key = getKey();

  if (!key || key === "YOUR_MARKETSTACK_KEY") {
    return unique.map((symbol) => mockQuote(symbol));
  }

  try {
    const response = await fetch(buildUrl(unique));
    if (!response.ok) throw new Error(`Marketstack HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.data) throw new Error(payload.error?.message || "Missing data");

    const bySymbol = new Map();
    for (const row of payload.data) {
      bySymbol.set(row.symbol, {
        symbol: row.symbol,
        close: row.close,
        open: row.open,
        high: row.high,
        low: row.low,
        volume: row.volume,
        date: row.date?.slice(0, 10) || "",
      });
    }
    return unique.map((symbol) => bySymbol.get(symbol) || mockQuote(symbol));
  } catch {
    return unique.map((symbol) => mockQuote(symbol));
  }
}

function mockQuote(symbol) {
  const row = MOCK_EOD[symbol] || {
    close: 100,
    open: 99,
    high: 102,
    low: 98,
    volume: 1000000,
    date: new Date().toISOString().slice(0, 10),
  };
  return { symbol, ...row, source: "mock" };
}