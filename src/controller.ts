import Graph, { Coords } from "./graph";
import Pathfinder, { Vertex } from "./pathfinder";
import View, { cellElems } from "./view";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class Controller {
  constructor(
    private readonly graph: Graph,
    private readonly pf: Pathfinder,
    private readonly view: View
  ) {
    this.initEvents();
    this.view.renderCellElem(cellElems.startPoint, this.pf.startPoint);
    this.view.renderCellElem(cellElems.endPoint, this.pf.endPoint);
    this.view.renderCellElem(cellElems.obstacle, this.graph.obstacles);
  }

  private initEvents() {
    this.view.onAddObstacle((coords: Coords) => {
      this.graph.addObstacle(coords);
    });

    this.view.onRemoveObstacle((coords: Coords) => {
      this.graph.removeObstacle(coords);
    });

    this.graph.onObstacleChange((coords: Coords[]) => {
      this.view.renderCellElem(cellElems.obstacle, coords);
    });

    this.pf.onFringeChange((vertex: Vertex[]) => {
      this.view.renderCellElem(cellElems.fringe, vertex.map(v => v.coords));
    });

    this.pf.onClosedChange((vertex: Vertex[]) => {
      this.view.renderCellElem(cellElems.closed, vertex.map(v => v.coords));
    });

    this.pf.onHeadChange((vertex: Vertex) => {
      this.view.renderCellElem(cellElems.head, vertex.coords);
    });

    this.view.onMoveStartPoint((coords: Coords) => {
      this.pf.startPoint = coords;
    });

    this.view.onMoveEndPoint((coords: Coords) => {
      this.pf.endPoint = coords;
    });

    this.pf.onStartPointChange((coords: Coords) => {
      this.view.renderCellElem(cellElems.startPoint, coords);
    });

    this.pf.onEndPointChange((coords: Coords) => {
      this.view.renderCellElem(cellElems.endPoint, coords);
    });

    this.view.onSearchStart(() => {
      this.view.blockEvents();
      const algorithm = this.pf.generate();
      algorithm.next();
      document.addEventListener("keydown", e => {
        if (e.code === "KeyR") {
          const { done } = algorithm.next();
          if (done) {
            this.graph.clear();
            this.pf.clear();
          }
        }
      });
      this.view.unblockEvents();
    });
  }
}

export default Controller;
