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
