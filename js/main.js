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
    // Theme toggle
    qs("#theme-toggle")?.addEventListener("click", () => {
      
  }

}