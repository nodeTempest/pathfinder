import Graph, { Coords } from "./graph";
import Pathfinder from "./pathfinder";
import View from "./view";
import Controller from "./controller";
import AsideView from "./asideView";

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
    this.startPoint =
      options.startPoint ||
      new Coords(Math.round(this.width * 0.25), Math.round(this.height * 0.25));
    this.endPoint =
      options.endPoint ||
      new Coords(
        Math.round(this.width * 0.75) - 1,
        Math.round(this.height * 0.75) - 1
      );
  }

  build() {
    const view = new View(this.app, this.width, this.height);
    const asideView = new AsideView(this.app);
    const graph = new Graph(this.width, this.height);
    const pf = new Pathfinder(graph, this.startPoint, this.endPoint);

    new Controller(graph, pf, view, asideView);
  }
}

export default App;
