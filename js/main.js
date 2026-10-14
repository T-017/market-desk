import { storage } from "./storage.js";
import { fetchEod } from "./api/marketstack.js";
import { fetchLatestRates, convert, listSymbols, popularCurrencies } from "./api/fixer.js";
import {
  qs,
  qsa,
  toast,
  renderStockCard,
  renderEmptyState,
  formatMoney,
  setBusy,
} from "./ui.js";

class MarketDeskApp {
  constructor() {
    this.companies = [];
    this.quotes = new Map();
    this.fix = null;
    this.filler = "all";
  }

  async init() {
    this.applyTheme(storage.getTheme());
    this.bindEvents();
    this.hydrateNav();

    const year = qs("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    try {
      const res = await fetch("./js/data/companies.json");
      this.companies = await res.json();
    } catch {
      toast("Could not load company catalog.", "error");
      this.companies = [];
    }

    await Promise.all([this.refreshQuotes(), this.refreshFx()]);
    this.renderCatalog();
    this.renderWatchlist();
    this.populateConverter();
    this.updateHeroStats();
    this.restoreLastTicker();
  }

  bindEvents() {
    qs("#theme-toggle")?.addEventListener("click", () => {
      const next = storage.getTheme() === "dark" ? "light" : "dark";
      storage.setTheme(next);
      this.applyTheme(next);
    });

    qs("#nav-toggle")?.addEventListener("click", () => {
      const nav = qs("#site-nav");
      const expanded = nav.classList.toggle("is-open");
      qs("#nav-toggle").setAttribute("aria-expanded", String(expanded));
    });

    qs("#ticker-search")?.addEventListener("keyup", (event) => {
      this.filterCatalog(event.target.value);
    });

    qs("#sector-filters")?.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-sector]");
      if (!chip) return;
      this.filter = chip.dataset.sector;
      qsa("#sector-filters .chip").forEach((c) => {
        c.classList.toggle("is-active", c === chip);
      });
      this.filterCatalog(qs("#ticker-search")?.value || "");
    });

    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-action='toggle-watch']");
      if (toggle) {
        event.stopPropagation();
        this.toggleWatch(toggle.dataset.symbol);
        return;
      }
      if (event.target.closest("a")) return;
      const card = event.target.closest(".stock-card");
      if (card?.dataset.symbol) {
        card.classList.toggle("is-flipped");
        storage.setLastTicker(card.dataset.symbol);
        this.highlightTicker(card.dataset.symbol);
      }
    });

    qs("#fx-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.runConversion();
    });

    qs("#fx-from")?.addEventListener("change", (event) => {
      storage.setBaseCurrency(event.target.value);
    });

    window.addEventListener("hashchange", () => this.hydrateNav());
  }

  applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = qs("#theme-toggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    }
  }

  hydrateNav() {
    const hash = window.location.hash || "#home";
    qsa(".site-nav a").forEach((link) => {
      link.classList.toggle("is-current", link.getAttribute("href") === hash);
    });
  }

  companyBySymbol(symbol) {
    return this.companies.find((c) => c.symbol === symbol.toUpperCase());
  }

  async refreshQuotes() {
    const symbols = [
      ...new Set([
        ...this.companies.map((c) => c.symbol),
        ...storage.getWatchlist(),
      ]),
    ];
    const grid = qs("#catalog-grid");
    setBusy(grid, true);
    try {
      const rows = await fetchEod(symbols);
      this.quotes = new Map(rows.map((q) => [q.symbol, q]));
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusy(grid, false);
    }
  }

  async refreshFx() {
    this.fx = await fetchLatestRates();
    const stamp = qs("#fx-stamp");
    if (stamp && this.fx) {
      stamp.textContent = `Rates as of ${this.fx.date} · base ${this.fx.base}${this.fx === null ? "" : ""}`;
    }
  }

  renderCatalog() {
    const host = qs("#catalog-grid");
    if (!host) return;
    host.innerHTML = "";
    const watch = new Set(storage.getWatchlist());
    const sectors = ["all", ...new Set(this.companies.map((c) => c.sector))];
    this.renderSectorChips(sectors);

    const limit = host.dataset.limit ? Number(host.dataset.limit) : this.companies.length;
    this.companies.slice(0, limit).forEach((company) => {
      const quote = this.quotes.get(company.symbol) || {
        close: 0, open: 0, high: 0, low: 0, volume: 0, date: "—", source: "mock",
      };
      host.appendChild(renderStockCard(company, quote, { watched: watch.has(company.symbol) }));
    });
  }

  renderSectorChips(sectors) {
    const host = qs("#sector-filters");
    if (!host) return;
    host.innerHTML = "";
    sectors.forEach((sector) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chip${sector === this.filter ? " is-active" : ""}`;
      btn.dataset.sector = sector;
      btn.textContent = sector === "all" ? "All sectors" : sector;
      host.appendChild(btn);
    });
  }

  filterCatalog(query) {
    this.filter = query;
    this.renderCatalog();
  }
  get companies() {
    if (!this.filter || this.filter === "all") return this._companies;
    return this._companies.filter((c) => c.sector === this.filter);
  }

  renderWatchlist() {
    const host = qs("#watchlist-grid");
    if (!host) return;
    host.innerHTML = "";
    const watch = new Set(storage.getWatchlist());
    this._companies.filter((c) => watch.has(c.symbol)).forEach((company) => {
      const quote = this.quotes.get(company.symbol) || {
        close: 0, open: 0, high: 0, low: 0, volume: 0, date: "—", source: "mock",
      };
      host.appendChild(renderStockCard(company, quote, { watched: true }));
    });
  }

  toggleWatch(symbol) {
    const current = storage.getWatchlist();
    if (current.includes(symbol)) {
      storage.removeSymbol(symbol);
      toast(`${symbol} removed from watchlist`);
    } else {
      storage.addSymbol(symbol);
      toast(`${symbol} added to watchlist`);
    }
    this.renderWatchlist();
    this.renderCatalog();
    this.filterCatalog(qs("#ticker-search")?.value || "");
    this.updateHeroStats();
  }
