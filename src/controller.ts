import Graph, { Coords } from "./graph";
import Pathfinder, { Vertex } from "./pathfinder";
import View, { cellElems } from "./view";

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

export default Controller;
