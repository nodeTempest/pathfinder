import { EventEmitter } from "events";

import { arrDiff } from "./utils";

export class Coords {
  constructor(public x: number, public y: number) {}

  equal(coords: Coords): boolean {
    return this.x === coords.x && this.y === coords.y;
  }
}

export enum graphEvents {
  OBSTACLES_CHANGE = "OBSTACLES_CHANGE"
}

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

  containsObstacle(coords: Coords): boolean {
    return this.obstacles.some(o => o.equal(coords));
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

export default Graph;
