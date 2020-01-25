import "./index.css";

import { EventEmitter } from "events";

// util
const arrDiff = <T>(
  minuend: T[],
  subtrahend: T[],
  compare?: (valM: T, valS: T) => boolean
): T[] =>
  subtrahend.reduce(
    (acc, valS) =>
      acc.filter(valM => (compare ? !compare(valM, valS) : valM !== valS)),
    minuend
  );

class Coords {
  constructor(public x: number, public y: number) {}

  equal(coords: Coords): boolean {
    return this.x === coords.x && this.y === coords.y;
  }
}

enum graphEvents {
  OBSTACLES_CHANGE = "OBSTACLES_CHANGE"
}

// Graph model
// in this particular case graph is two dimensional matrix
class Graph {
  private readonly ee = new EventEmitter();
  private _obstacles: Coords[] = [];

  constructor(
    private readonly width: number,
    private readonly height: number
  ) {}

  private isOut({ x, y }: Coords): boolean {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  private set obstacles(coords: Coords[]) {
    this._obstacles = coords;
    this.ee.emit(graphEvents.OBSTACLES_CHANGE, this._obstacles);
  }

  private get obstacles() {
    return this._obstacles;
  }

  getAdjacent({ x, y }: Coords): Coords[] {
    const up = new Coords(x, y - 1);
    const right = new Coords(x + 1, y);
    const bottom = new Coords(x, y + 1);
    const left = new Coords(x - 1, y);

    return arrDiff(
      [up, right, bottom, left].filter(coords => !this.isOut(coords)),
      this.obstacles,
      (coords1, coords2) => coords1.equal(coords2)
    );
  }

  containsObstacle(coords: Coords): boolean {
    return this.obstacles.some(o => o.equal(coords));
  }

  addObstacle(coords: Coords) {
    if (!this.containsObstacle(coords)) {
      this.obstacles = [...this.obstacles, coords];
    }
  }

  removeObstacle(coords: Coords) {
    if (this.containsObstacle(coords)) {
      this.obstacles = this.obstacles.filter(o => coords.equal(o));
    }
  }

  onObstacleChange(fn: (coords: Coords) => void) {
    this.ee.on(graphEvents.OBSTACLES_CHANGE, fn);
  }
}

// Node is reserved =(
interface Vertex {
  prev: Vertex | null;
  coords: Coords;
  distance: number;
  heuristic: number;
  payload: number;
}

enum pfEvents {
  HEAD_CHANGE = "HEAD_CHANGE",
  CLOSED_CHANGE = "CLOSED_CHANGE",
  FRINGE_CHANGE = "FRINGE_CHANGE"
}

class Pathfinder {
  private readonly ee = new EventEmitter();
  private _fringe: Vertex[] = [];
  private _closed: Vertex[] = [];
  private _head: Vertex;

  constructor(
    private readonly graph: Graph,
    private readonly startPoint: Coords,
    private readonly endPoint: Coords
  ) {
    this.head = this.createVertex(this.startPoint);
    this.fringe = [this.head];
  }

  private createVertex(coords: Coords): Vertex {
    const prev = this.head || null;
    const distance = prev && prev.distance ? prev.distance + 1 : 0;
    const heuristic = this.calcHeuristic(coords);

    return {
      prev,
      coords,
      distance,
      heuristic,
      get payload() {
        return distance + heuristic;
      }
    };
  }

  private isClosed(vertex: Vertex): boolean {
    return this.closed.some(v => v.coords.equal(vertex.coords));
  }

  private calcHeuristic(coords: Coords): number {
    return (
      Math.abs(this.endPoint.x - coords.x) +
      Math.abs(this.endPoint.y - coords.y)
    );
  }

  private updateVertex(vertex: Vertex) {
    if (!this.isClosed(vertex)) {
      vertex.distance = this.head.distance + 1;
    }
  }

  private set head(vertex: Vertex) {
    this._head = vertex;
    this.ee.emit(pfEvents.HEAD_CHANGE, this._head);
  }

  private get head() {
    return this._head;
  }

  private set fringe(vertexes: Vertex[]) {
    this._fringe = vertexes;
    this.ee.emit(pfEvents.FRINGE_CHANGE, this._head);
  }

  private get fringe() {
    return this._fringe;
  }

  private set closed(vertexes: Vertex[]) {
    this._closed = vertexes;
    this.ee.emit(pfEvents.CLOSED_CHANGE, this._closed);
  }

  private get closed() {
    return this._closed;
  }

  calcAdjacent() {
    const adjacentCoords = this.graph.getAdjacent(this.head.coords);

    adjacentCoords.forEach(adjCoords => {
      const vertex = this.fringe.find(v => v.coords.equal(adjCoords));

      if (vertex) {
        this.updateVertex(vertex);
      } else {
        const newVertex = this.createVertex(adjCoords);
        this.fringe.push(newVertex);
      }
    });
  }

  nextVertex() {
    let minPayload = Infinity;
    let minIndex = 0;

    this.fringe.forEach((vertex, index) => {
      if (vertex.payload < minPayload && !this.isClosed(vertex)) {
        minPayload = vertex.payload;
        minIndex = index;
      }
    });

    this.fringe = this.fringe.filter(v => !v.coords.equal(this.head.coords));
    this.closed = [...this.closed, this.head];
    this.head = this.fringe[minIndex];
  }

  exec() {
    console.log(this.head);
    debugger;
    while (!this.head.coords.equal(this.endPoint)) {
      this.calcAdjacent();
      this.nextVertex();
    }
  }

  onHeadChange(fn: (vertex: Vertex) => void) {
    this.ee.on(pfEvents.HEAD_CHANGE, fn);
  }

  onFringeChange(fn: (vertex: Vertex) => void) {
    this.ee.on(pfEvents.FRINGE_CHANGE, fn);
  }

  onClosedChange(fn: (vertex: Vertex) => void) {
    this.ee.on(pfEvents.CLOSED_CHANGE, fn);
  }
}

enum viewEvents {
  CELL_CLICK = "CELL_CLICK"
}

enum cellElems {
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

class Controller {
  constructor(
    private readonly graph: Graph,
    private readonly pf: Pathfinder,
    private readonly view: View
  ) {
    this.initEvents();
    this.view.renderCellElem(cellElems.head, new Coords(0, 0));
    this.view.renderCellElem(cellElems.obstacle, new Coords(1, 0));
  }

  initEvents() {
    this.view.onCellClick((coords: Coords) => {
      this.graph.addObstacle(coords);
    });
    this.graph.onObstacleChange((coords: Coords) => {
      this.view.renderCellElem(cellElems.obstacle, coords);
    });
    document.addEventListener("keydown", e => {
      if (e.code === "Space") {
        this.pf.exec();
      }
    });
    this.pf.onFringeChange((vertex: Vertex) => {
      this.view.renderCellElem(cellElems.fringe, vertex.coords);
    });
    this.pf.onClosedChange((vertex: Vertex) => {
      this.view.renderCellElem(cellElems.closed, vertex.coords);
    });
    this.pf.onHeadChange((vertex: Vertex) => {
      this.view.renderCellElem(cellElems.head, vertex.coords);
    });
  }
}

const width = 5;
const height = 5;

const A = new Coords(0, 0);
const B = new Coords(2, 0);

const view = new View(width, height);
const graph = new Graph(width, height);
graph.addObstacle(new Coords(1, 0));
const pf = new Pathfinder(graph, A, B);

new Controller(graph, pf, view);
