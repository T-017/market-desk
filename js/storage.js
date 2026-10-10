const KEYS = {
  watchlist: "desk.watchlist",
  baseCurrency: "desk.baseCurrency",
  theme: "desk.theme",
  lastTicker: "desk.lastTicker",
};

const DEFAULTS = {
  watchlist: ["AAPL", "MSFT", "NVDA"],
  baseCurrency: "USD",
  theme: "dark",
  lastTicker: "AAPL",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


