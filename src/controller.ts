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
    this.view.onAddObstacle((coords: Coords) => {
      this.graph.addObstacle(coords);
    });

    this.view.onRemoveObstacle((coords: Coords) => {
      this.graph.removeObstacle(coords);
    });

    this.view.onSearchStart(() => {
      this.pf.exec();
    });

    this.graph.onObstacleChange((coords: Coords) => {
      this.view.renderCellElem(cellElems.obstacle, coords);
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
