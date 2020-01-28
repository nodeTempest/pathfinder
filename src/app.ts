import Graph, { Coords } from "./graph";
import Pathfinder from "./pathfinder";
import View from "./view";
import Controller from "./controller";

interface AppOptions {
  width?: number;
  height?: number;
  startPoint?: Coords;
  endPoint?: Coords;
}

class App {
  private readonly width: number;
  private readonly height: number;
  private readonly startPoint: Coords;
  private readonly endPoint: Coords;

  constructor(private readonly app: HTMLDivElement, options: AppOptions = {}) {
    this.width = options.width || 5;
    this.height = options.height || 5;
    this.startPoint = options.startPoint || new Coords(0, 0);
    this.endPoint =
      options.endPoint || new Coords(this.width - 1, this.height - 1);
  }

  build() {
    const view = new View(this.app, this.width, this.height);
    const graph = new Graph(this.width, this.height);
    const pf = new Pathfinder(graph, this.startPoint, this.endPoint);

    new Controller(graph, pf, view);
  }
}

export default App;
