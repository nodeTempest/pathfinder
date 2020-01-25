import { EventEmitter } from "events";

import { Coords } from "./graph";

export enum viewEvents {
  CELL_CLICK = "CELL_CLICK"
}

export enum cellElems {
  obstacle = "obstacle",
  fringe = "fringe",
  closed = "closed",
  head = "head"
}

class View {
  private readonly ee = new EventEmitter();
  private readonly app: HTMLDivElement;
  private cells: HTMLDivElement[];

  constructor(private readonly width: number, private readonly height: number) {
    this.app = document.getElementById("app") as HTMLDivElement;

    this.generateHTML();
    this.initEvents();
  }

  private createElem(tagName: string, className: string): HTMLElement {
    const elem = document.createElement(tagName);
    elem.classList.add(className);

    return elem;
  }

  private generateHTML() {
    const fragment = document.createDocumentFragment();
    for (let h = 0; h < this.height; h++) {
      for (let w = 0; w < this.width; w++) {
        const cell = this.createElem("div", "cell");
        cell.dataset.x = "" + w;
        cell.dataset.y = "" + h;
        cell.style.width = 100 / this.width + "%";
        cell.style.height = 100 / this.height + "%";
        fragment.append(cell);
      }
    }
    this.app.append(fragment);
    this.cells = [...this.app.children] as HTMLDivElement[];
  }

  private initEvents() {
    this.app.addEventListener("click", e => {
      if ((e.target as HTMLElement).classList.contains("cell")) {
        const { x, y } = (e.target as HTMLDivElement).dataset;
        const coords = new Coords(+x, +y);

        this.ee.emit(viewEvents.CELL_CLICK, coords);
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

  onCellClick(fn: (coords: Coords) => void) {
    this.ee.on(viewEvents.CELL_CLICK, fn);
  }
}

export default View;
