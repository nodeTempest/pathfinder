import { EventEmitter } from "events";

import View from "./view";

export enum SearchModes {
  PREAPARING,
  IN_PROGRESS,
  WAITING_FOR_NEW
}

export enum asideViewEvents {
  SEARCH_START = "SEARCH_START",
  NEW_SEARCH = "NEW_SEARCH"
}

class AsideView extends View {
  private readonly ee = new EventEmitter();

  private searchMode: SearchModes;

  private aside: HTMLDivElement;
  private searchButton: HTMLButtonElement;

  constructor(private root: HTMLDivElement) {
    super();
    this.generateHTML();
    this.initEvents();
  }

  generateHTML() {
    this.aside = View.createElem("div", "aside") as HTMLDivElement;
    const msg = View.createElem("h2", "message");
    msg.innerHTML =
      "Press <b>Mouse Left</b> to add obstacle or <b>Mouse Right</b> to remove obstacle.</br>Use <b>drag and drop</b> to <b>move</b> start and destination points.";
    this.aside.append(msg);

    this.searchButton = View.createElem(
      "button",
      "search-button"
    ) as HTMLButtonElement;
    this.aside.append(this.searchButton);
    this.root.append(this.aside);
  }

  initEvents() {
    this.searchButton.addEventListener("click", () => {
      if (this.searchMode === SearchModes.PREAPARING) {
        this.ee.emit(asideViewEvents.SEARCH_START);
      } else if (this.searchMode === SearchModes.WAITING_FOR_NEW) {
        this.ee.emit(asideViewEvents.NEW_SEARCH);
      }
    });
  }

  setSearchMode(mode: SearchModes) {
    this.searchMode = mode;

    switch (this.searchMode) {
      case SearchModes.PREAPARING:
        this.searchButton.textContent = "Start Search";
        this.searchButton.disabled = false;
        break;
      case SearchModes.IN_PROGRESS:
        this.searchButton.textContent = "Searching...";
        this.searchButton.disabled = true;
        break;
      case SearchModes.WAITING_FOR_NEW:
        this.searchButton.textContent = "New Search";
        this.searchButton.disabled = false;
        break;
    }
  }

  onSearchStart(fn: () => void) {
    this.ee.on(asideViewEvents.SEARCH_START, fn);
  }

  onNewSearch(fn: () => void) {
    this.ee.on(asideViewEvents.NEW_SEARCH, fn);
  }
}

export default AsideView;
