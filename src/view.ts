import { EventEmitter } from "events";

import { Coords } from "./graph";

export enum viewEvents {
  ADD_OBSTACLE = "ADD_OBSTACLE",
  REMOVE_OBSTACLE = "REMOVE_OBSTACLE",
  SEARCH_START = "SEARCH_START"
}

export enum cellElems {
  obstacle = "obstacle",
  fringe = "fringe",
  closed = "closed",
  head = "head"
}

export enum pressModes {
  ADD,
  REMOVE
}

class View {
  private readonly ee = new EventEmitter();
  private readonly root: HTMLDivElement;
  private pressMode: pressModes;

  constructor(private readonly width: number, private readonly height: number) {
    this.root = this.createElem("div", "graph-container") as HTMLDivElement;

    this.generateHTML();
    this.initEvents();
  }

  private createElem(tagName: string, className: string): HTMLElement {
    const elem = document.createElement(tagName);
    elem.classList.add(className);

    return elem;
  }

  private generateHTML() {
    for (let h = 0; h < this.height; h++) {
      for (let w = 0; w < this.width; w++) {
        const cell = this.createElem("div", "cell");
        cell.dataset.x = "" + w;
        cell.dataset.y = "" + h;
        cell.style.width = 100 / this.width + "%";
        cell.style.height = 100 / this.height + "%";
        this.root.append(cell);
      }
    }
  }

  private get cells(): HTMLDivElement[] {
    return [...this.root.children] as HTMLDivElement[];
  }

  private initEvents() {
    this.root.addEventListener("contextmenu", e => e.preventDefault());

    const mouseover = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".cell")) {
        const { x, y } = (e.target as HTMLDivElement).dataset;
        const coords = new Coords(+x, +y);

        this.pressMode === pressModes.ADD
          ? this.ee.emit(viewEvents.ADD_OBSTACLE, coords)
          : this.ee.emit(viewEvents.REMOVE_OBSTACLE, coords);
      }
    };

    const mouseup = (e: MouseEvent) => {
      this.root.removeEventListener("mouseover", mouseover);
      this.root.removeEventListener("mouseup", mouseup);
    };

    const mousedown = (e: MouseEvent) => {
      this.pressMode = e.button === 0 ? pressModes.ADD : pressModes.REMOVE;
      this.root.addEventListener("mouseover", mouseover);
      this.root.addEventListener("mouseup", mouseup);
    };

    this.root.addEventListener("mousedown", mousedown);

    document.addEventListener("keydown", e => {
      if (e.code === "Space") {
        this.ee.emit(viewEvents.SEARCH_START);
      }
    });
  }

  private getCells(coords: Coords | Coords[]): HTMLDivElement[] {
    if (!Array.isArray(coords)) {
      coords = [coords];
    }

    return this.cells.filter(elem => {
      const { x, y } = elem.dataset;
      const elemCoords = new Coords(+x, +y);
      return (coords as Coords[]).some(c => c.equal(elemCoords));
    });
  }

  renderCellElem(className: cellElems, coords: Coords | Coords[]) {
    this.cells.forEach(elem => elem.classList.remove(className));
    this.getCells(coords).forEach(elem => elem.classList.add(className));
  }

  onAddObstacle(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.ADD_OBSTACLE, fn);
  }

  onRemoveObstacle(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.REMOVE_OBSTACLE, fn);
  }

  onSearchStart(fn: () => void) {
    this.ee.on(viewEvents.SEARCH_START, fn);
  }
}

export default View;
