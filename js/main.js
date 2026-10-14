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
    // 1. Theme toggle
    qs("#theme-toggle")?.addEventListener("click", () => {
      const next = storage.getTheme() === "dark" ? "light" : "dark";
      storage.setTheme(next);
      this.applyTheme(next);
    });

    // 2. Mobile nav
    qs("#nav-toggle")?.addEventListener("click", () => {
      const nav = qs("#site-nav");
      const expanded = nav.classList.toggle("is-open");
      qs("#nav-toggle").setAttribute("aria-expanded", String(expanded));
    });

    // 3. Search (keyup)
    qs("#ticker-search")?.addEventListener("keyup", (event) => {
      this.filterCatalog(event.target.value);
    });

    // 4. Sector chips (click)
    qs("#sector-filters")?.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-sector]");
      if (!chip) return;
      this.filter = chip.dataset.sector;
      qsa("#sector-filters .chip").forEach((c) => {
        c.classList.toggle("is-active", c === chip);
      });
      this.filterCatalog(qs("#ticker-search")?.value || "");
    });

    // 5. Watchlist add / remove + card inspect (delegated click)
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
