import { EventEmitter } from "events";

import View from "./view";
import { Coords } from "./graph";

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

class GraphView extends View {
  private readonly ee = new EventEmitter();
  private eventsBlocked: boolean = false;
  private pressMode: viewEvents;

  private container: HTMLDivElement;

  constructor(
    private root: HTMLDivElement,
    private readonly width: number,
    private readonly height: number
  ) {
    super();
    this.generateHTML();
    this.initEvents();
  }

  protected generateHTML() {
    this.container = View.createElem(
      "div",
      "graph-container"
    ) as HTMLDivElement;

    for (let h = 0; h < this.height; h++) {
      for (let w = 0; w < this.width; w++) {
        const cell = View.createElem("div", "cell");
        cell.dataset.x = "" + w;
        cell.dataset.y = "" + h;
        cell.style.width = 100 / this.width + "%";
        cell.style.height = 100 / this.height + "%";
        this.container.append(cell);
      }
    }

    this.root.append(this.container);

    // make height equal to breadth
    const minSide = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.container.style.width = minSide + "px";
    this.container.style.height = minSide + "px";
  }

  protected initEvents() {
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

  showFailMsg() {
    alert("No path found");
  }

  blockEvents() {
    this.eventsBlocked = true;
  }

  unblockEvents() {
    this.eventsBlocked = false;
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
}

export default GraphView;
