import { EventEmitter } from "events";

import { Coords } from "./graph";

export enum SearchModes {
  PREAPARING,
  IN_PROGRESS,
  WAITING_FOR_NEW
}

export enum viewEvents {
  ADD_OBSTACLE = "ADD_OBSTACLE",
  REMOVE_OBSTACLE = "REMOVE_OBSTACLE",
  SEARCH_START = "SEARCH_START",
  NEW_SEARCH = "NEW_SEARCH",
  MOVE_START_POINT = "MOVE_START_POINT",
  MOVE_END_POINT = "MOVE_END_POINT"
}

export enum cellElems {
  obstacle = "obstacle",
  fringe = "fringe",
  closed = "closed",
  head = "head",
  startPoint = "start-point",
  endPoint = "end-point",
  path = "path"
}

class View {
  private readonly ee = new EventEmitter();
  private eventsBlocked: boolean = false;
  private pressMode: viewEvents;
  private searchMode: SearchModes;

  private container: HTMLDivElement;
  private aside: HTMLDivElement;
  private searchButton: HTMLButtonElement;

  constructor(
    private root: HTMLDivElement,
    private readonly width: number,
    private readonly height: number
  ) {
    this.generateHTML();
    this.initEvents();
  }

  private createElem(tagName: string, className: string): HTMLElement {
    const elem = document.createElement(tagName);
    elem.classList.add(className);

    return elem;
  }

  private generateHTML() {
    this.container = this.createElem(
      "div",
      "graph-container"
    ) as HTMLDivElement;

    for (let h = 0; h < this.height; h++) {
      for (let w = 0; w < this.width; w++) {
        const cell = this.createElem("div", "cell");
        cell.dataset.x = "" + w;
        cell.dataset.y = "" + h;
        cell.style.width = 100 / this.width + "%";
        cell.style.height = 100 / this.height + "%";
        this.container.append(cell);
      }
    }

    this.root.append(this.container);

    this.aside = this.createElem("div", "aside") as HTMLDivElement;
    const msg = this.createElem("h2", "message");
    msg.innerHTML =
      "Press <b>Mouse Left</b> to add obstacle or <b>Mouse Right</b> to remove obstacle.</br>Use drag and drop to <b>move</b> start and destination points.";
    this.aside.append(msg);

    this.searchButton = this.createElem(
      "button",
      "search-button"
    ) as HTMLButtonElement;
    this.aside.append(this.searchButton);
    this.root.append(this.aside);

    // make height equal to breadth
    const minSide = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.container.style.width = minSide + "px";
    this.container.style.height = minSide + "px";
  }

  private initEvents() {
    this.root.addEventListener("dragstart", e => e.preventDefault());
    this.container.addEventListener("contextmenu", e => e.preventDefault());

    const mouseover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".cell")) {
        return;
      }
      const { x, y } = target.dataset;
      const coords = new Coords(+x, +y);

      this.ee.emit(this.pressMode, coords);
    };

    const mouseup = () => {
      document.removeEventListener("mouseover", mouseover);
      document.removeEventListener("mouseup", mouseup);
    };

    const mousedown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest(".cell")) {
        return;
      }

      if (target.classList.contains(cellElems.startPoint)) {
        this.pressMode = viewEvents.MOVE_START_POINT;
      } else if (target.classList.contains(cellElems.endPoint)) {
        this.pressMode = viewEvents.MOVE_END_POINT;
      } else {
        this.pressMode =
          e.button === 0 ? viewEvents.ADD_OBSTACLE : viewEvents.REMOVE_OBSTACLE;
      }

      const { x, y } = target.dataset;
      const coords = new Coords(+x, +y);

      this.ee.emit(this.pressMode, coords);

      document.addEventListener("mouseover", mouseover);
      document.addEventListener("mouseup", mouseup);
    };

    document.addEventListener("mousedown", mousedown);

    this.searchButton.addEventListener("click", () => {
      if (this.searchMode === SearchModes.PREAPARING) {
        this.ee.emit(viewEvents.SEARCH_START);
      } else if (this.searchMode === SearchModes.WAITING_FOR_NEW) {
        this.ee.emit(viewEvents.NEW_SEARCH);
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

  private get cells(): HTMLDivElement[] {
    return [...this.container.children] as HTMLDivElement[];
  }

  private cellsByCoords(coords: Coords | Coords[]): HTMLDivElement[] {
    coords = Array.isArray(coords) ? coords : [coords];

    return this.cells.filter(elem => {
      const { x, y } = elem.dataset;
      const elemCoords = new Coords(+x, +y);
      return (coords as Coords[]).some(c => c.equal(elemCoords));
    });
  }

  renderCellElem(className: cellElems, coords: Coords | Coords[] | null) {
    this.cells.forEach(elem => elem.classList.remove(className));
    if (coords) {
      this.cellsByCoords(coords).forEach(elem => elem.classList.add(className));
    }
  }

  onAddObstacle(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.ADD_OBSTACLE, (coords: Coords) => {
      if (!this.eventsBlocked) {
        fn(coords);
      }
    });
  }

  onRemoveObstacle(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.REMOVE_OBSTACLE, (coords: Coords) => {
      if (!this.eventsBlocked) {
        fn(coords);
      }
    });
  }

  onSearchStart(fn: () => void) {
    this.ee.on(viewEvents.SEARCH_START, () => {
      if (!this.eventsBlocked) {
        fn();
      }
    });
  }

  onNewSearch(fn: () => void) {
    this.ee.on(viewEvents.NEW_SEARCH, fn);
  }

  onMoveStartPoint(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.MOVE_START_POINT, (coords: Coords) => {
      if (!this.eventsBlocked) {
        fn(coords);
      }
    });
  }

  onMoveEndPoint(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.MOVE_END_POINT, (coords: Coords) => {
      if (!this.eventsBlocked) {
        fn(coords);
      }
    });
  }

  blockEvents() {
    this.eventsBlocked = true;
  }

  unblockEvents() {
    this.eventsBlocked = false;
  }
}

export default View;
