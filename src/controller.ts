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
    this.view.renderCellElem(cellElems.startPoint, this.pf.startPoint);
    this.view.renderCellElem(cellElems.endPoint, this.pf.endPoint);

    this.initEvents();
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

    this.pf.onHeadChange((vertex: Vertex | null) => {
      this.view.renderCellElem(cellElems.head, vertex ? vertex.coords : null);
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

    this.pf.onPathChange(async (coords: Coords[]) => {
      let i = 1;
      for (const _ of coords) {
        await delay(33);
        this.view.renderCellElem(cellElems.path, coords.slice(0, i));
        i++;
      }
    });

    this.view.onSearchStart(async () => {
      this.view.blockEvents();

      for (const _ of this.pf.findPath()) {
        await delay(33);
      }

      // this.graph.clear();
      // this.pf.clear();
      // this.view.unblockEvents();
    });
  }
}

export default Controller;
