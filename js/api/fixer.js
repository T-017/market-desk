const MOCK_RATES = {
  success: true,
  timestamp: Date.now(),
  base: "EUR",
  date: "9/26/2026",
  rates: {
    USD: 1.1174,
    EUR: 1.0,
    GBP: 0.8421,
    JPY: 161.35,
    CAD: 1.5122,
    AUD: 1.6488,
    CHF: 0.9412,
    CNY: 7.912,
    MXN: 21.44,
    BRL: 6.118,
    INR: 93.27,
    KRW: 1488.5,
    SEK: 11.32,
    NOK: 11.68,
    DKK: 7.461,
    NZD: 1.792,
    SGD: 1.442,
    HKD: 8.701,
    ZAR: 19.88,
    TRY: 38.12,
  },
};

const POPULAR = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "MXN", "BRL", "INR", "CNY", "KRW"];

function getKey() {
  return window.MARKET_DESK_CONFIG?.FIXER_KEY || "";
}

export function popularCurrencies() {
  return [...POPULAR];
}

export async function fetchLatestRates() {
  const key = getKey();
  if (!key || key === "YOUR_FIXER_KEY") {
    return MOCK_RATES;
  }

  try {
    const url = `https://data.fixer.io/api/latest?access_key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fixer HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.success) throw new Error(payload.error?.info || "Fixer error");
    return payload;
  } catch {
    return MOCK_RATES;
  }
}

export function convert(amount, from, to, snapshot) {
  const rates = snapshot.rates || {};
  const base = snapshot.base || "EUR";
  const fromRate = from === base ? 1 : rates[from];
  const toRate = to === base ? 1 : rates[to];
  if (!fromRate || !toRate) {
    throw new Error(`Missing rate for ${from} or ${to}`);
  }
  return (amount / fromRate) * toRate;
}

export function listSymbols(snapshot) {
  const codes = Object.keys(snapshot.rates || {});
  if (snapshot.base && !codes.includes(snapshot.base)) {
    codes.unshift(snapshot.base);
  }
  return codes.sort();
}