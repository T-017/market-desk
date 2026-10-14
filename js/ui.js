export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function formatMoney(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function percentChange(open, close) {
  if (!open) return 0;
  return ((close - open) / open) * 100;
}

export function setBusy(el, busy) {
  if (!el) return;
  el.setAttribute("aria-busy", busy ? "true" : "false");
}

export function toast(message, kind = "info") {
  const host = qs("#toast-host");
  if (!host) return;
  const node = document.createElement("div");
  node.className = `toast toast--${kind}`;
  node.textContent = message;
  host.appendChild(node);
  requestAnimationFrame(() => node.classList.add("is-visible"));
  setTimeout(() => {
    node.classList.remove("is-visible");
    setTimeout(() => node.remove(), 320);
  }, 2800);
}

export function renderStockCard(company, quote, { watched } = {}) {
  const change = percentChange(quote.open, quote.close);
  const up = change >= 0;
  const article = document.createElement("article");
  article.className = "stock-card";
  article.dataset.symbol = company.symbol;
  article.style.setProperty("--accent", company.accent || "#7dd3fc");

  article.innerHTML = `
    <div class="stock-card__inner">
      <div class="stock-card__face stock-card__face--front">
        <header class="stock-card__head">
          <span class="stock-card__ticker">${company.symbol}</span>
          <span class="pill ${up ? "pill--up" : "pill--down"}">
            ${up ? "▲" : "▼"} ${change.toFixed(2)}%
          </span>
        </header>
        <h3 class="stock-card__name">${company.name}</h3>
        <p class="stock-card__price">${formatMoney(quote.close, company.currency)}</p>
        <dl class="stock-card__meta">
          <div><dt>Open</dt><dd>${formatMoney(quote.open, company.currency)}</dd></div>
          <div><dt>High</dt><dd>${formatMoney(quote.high, company.currency)}</dd></div>
          <div><dt>Low</dt><dd>${formatMoney(quote.low, company.currency)}</dd></div>
          <div><dt>Vol</dt><dd>${formatNumber(quote.volume)}</dd></div>
        </dl>
        <p class="stock-card__source">${quote.source === "live" ? "Live EOD" : "Demo quote"} · ${quote.date}</p>
      </div>
      <div class="stock-card__face stock-card__face--back">
        <h3>${company.name}</h3>
        <p class="stock-card__tagline">${company.tagline}</p>
        <ul class="stock-card__facts">
          <li><strong>Exchange</strong> ${company.exchange}</li>
          <li><strong>Sector</strong> ${company.sector}</li>
          <li><strong>Industry</strong> ${company.industry}</li>
          <li><strong>Country</strong> ${company.country}</li>
          <li><strong>Founded</strong> ${company.founded}</li>
          <li><strong>HQ</strong> ${company.headquarters}</li>
          <li><strong>Risk</strong> ${company.riskLevel}</li>
        </ul>
        <div class="stock-card__actions">
          <button type="button" class="btn btn--ghost" data-action="toggle-watch" data-symbol="${company.symbol}">
            ${watched ? "Remove from watchlist" : "Add to watchlist"}
          </button>
          <a class="btn btn--link" href="${company.website}" target="_blank" rel="noopener noreferrer">Website</a>
        </div>
      </div>
    </div>
  `;
  return article;
}

export function renderEmptyState(message) {
  const p = document.createElement("p");
  p.className = "empty-state";
  p.textContent = message;
  return p;
}
