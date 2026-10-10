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

export const storage = {
  getWatchlist() {
    const list = read(KEYS.watchlist, DEFAULTS.watchlist);
    return Array.isArray(list) && list.length ? list : [...DEFAULTS.watchlist];
  },
  setWatchlist(list) {
    write(KEYS.watchlist, list);
  },
  addSymbol(symbol) {
    const upper = symbol.toUpperCase();
    const list = this.getWatchlist();
    if (!list.includes(upper)) {
      list.push(upper);
      this.setWatchlist(list);
    }
    return list;
  },
  removeSymbol(symbol) {
    const list = this.getWatchlist().filter((s) => s !== symbol.toUpperCase());
    this.setWatchlist(list);
    return list;
  },
  getBaseCurrency() {
    return read(KEYS.baseCurrency, DEFAULTS.baseCurrency);
  },
  setBaseCurrency(code) {
    write(KEYS.baseCurrency, code);
  },
  getTheme() {
    return read(KEYS.theme, DEFAULTS.theme);
  },
  setTheme(theme) {
    write(KEYS.theme, theme);
  },
  getLastTicker() {
    return read(KEYS.lastTicker, DEFAULTS.lastTicker);
  },
  setLastTicker(symbol) {
    write(KEYS.lastTicker, symbol);
  },
};
