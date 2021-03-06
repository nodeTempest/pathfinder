import { EventEmitter } from "events";

import Graph, { Coords } from "./graph";
import { arrDiff } from "./utils";

export interface Vertex {
  prev: Vertex | null;
  coords: Coords;
  distance: number;
  heuristic: number;
  payload: number;
}

export enum pfEvents {
  HEAD_CHANGE = "HEAD_CHANGE",
  CLOSED_CHANGE = "CLOSED_CHANGE",
  FRINGE_CHANGE = "FRINGE_CHANGE",
  START_POINT_CHANGE = "START_POINT_CHANGE",
  END_POINT_CHANGE = "END_POINT_CHANGE",
  PATH_CHANGE = "PATH_CHANGE",
  FAIL = "FAIL"
}

class Pathfinder {
  private readonly ee = new EventEmitter();
  private _fringe: Vertex[] = [];
  private _closed: Vertex[] = [];
  private _head: Vertex | null = null;
  private _path: Coords[] = [];

  constructor(
    private readonly graph: Graph,
    private _startPoint: Coords,
    private _endPoint: Coords
  ) {}

  private createVertex(coords: Coords): Vertex {
    const prev = this.head || null;
    const distance = prev ? prev.distance + 1 : 0;
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

  private calcHeuristic(coords: Coords): number {
    return (
      Math.abs(this.endPoint.x - coords.x) +
      Math.abs(this.endPoint.y - coords.y)
    );
  }

  private updateVertex(vertex: Vertex) {
    const newDistance = this.head.distance + 1;

    if (newDistance < vertex.distance) {
      vertex.distance = newDistance;
      vertex.prev = this.head;
    }
  }

  private collides(coords: Coords): boolean {
    return (
      this.graph.containsObstacle(coords) ||
      this.startPoint.equal(coords) ||
      this.endPoint.equal(coords)
    );
  }

  set head(vertex: Vertex | null) {
    this._head = vertex;
    this.ee.emit(pfEvents.HEAD_CHANGE, this._head);
  }

  get head() {
    return this._head;
  }

  set fringe(vertexes: Vertex[]) {
    this._fringe = vertexes;
    this.ee.emit(pfEvents.FRINGE_CHANGE, this._fringe);
  }

  get fringe() {
    return this._fringe;
  }

  set closed(vertexes: Vertex[]) {
    this._closed = vertexes;
    this.ee.emit(pfEvents.CLOSED_CHANGE, this._closed);
  }

  get closed() {
    return this._closed;
  }

  set startPoint(coords: Coords) {
    if (!this.collides(coords)) {
      this._startPoint = coords;
      this.ee.emit(pfEvents.START_POINT_CHANGE, this._startPoint);
    }
  }

  get startPoint() {
    return this._startPoint;
  }

  set endPoint(coords: Coords) {
    if (!this.collides(coords)) {
      this._endPoint = coords;
      this.ee.emit(pfEvents.END_POINT_CHANGE, this._endPoint);
    }
  }

  get endPoint() {
    return this._endPoint;
  }

  set path(coords: Coords[]) {
    this._path = coords;
    this.ee.emit(pfEvents.PATH_CHANGE, this._path);
  }

  get path() {
    return this._path;
  }

  *findPath() {
    this.head = this.createVertex(this.startPoint);

    while (!this.head.coords.equal(this.endPoint)) {
      yield;

      const adjacentCoords = arrDiff(
        this.graph.getAdjacent(this.head.coords),
        this.closed.map(v => v.coords),
        (c1, c2) => c1.equal(c2)
      );

      adjacentCoords.forEach(adjCoords => {
        const vertex = this.fringe.find(v => v.coords.equal(adjCoords));

        if (vertex) {
          this.updateVertex(vertex);
        } else {
          const newVertex = this.createVertex(adjCoords);
          this.fringe = [...this.fringe, newVertex];
        }
      });

      yield;

      let minPayload = Infinity;
      let minIndex = -1;

      arrDiff(this.fringe, this.closed, (v1, v2) =>
        v1.coords.equal(v2.coords)
      ).forEach((vertex, index) => {
        if (vertex.payload < minPayload) {
          minPayload = vertex.payload;
          minIndex = index;
        }
      });

      this.closed = [...this.closed, this.head];

      if (minIndex === -1) {
        this.ee.emit(pfEvents.FAIL);
        return;
      }

      this.head = this.fringe[minIndex];
      this.fringe = this.fringe.filter(v => !v.coords.equal(this.head.coords));
    }

    yield;

    let tempHead = this.head;
    let tempContainer: Coords[] = [];
    do {
      tempContainer = [tempHead.coords, ...tempContainer];
      tempHead = tempHead.prev;
    } while (tempHead.prev !== null);

    this.path = tempContainer;
  }

  clear() {
    this.fringe = [];
    this.closed = [];
    this.path = [];
    this.head = null;
  }

  onHeadChange(fn: (vertex: Vertex | null) => void) {
    this.ee.on(pfEvents.HEAD_CHANGE, fn);
  }

  onFringeChange(fn: (vertex: Vertex[]) => void) {
    this.ee.on(pfEvents.FRINGE_CHANGE, fn);
  }

  onClosedChange(fn: (vertex: Vertex[]) => void) {
    this.ee.on(pfEvents.CLOSED_CHANGE, fn);
  }

  onStartPointChange(fn: (coords: Coords) => void) {
    this.ee.on(pfEvents.START_POINT_CHANGE, fn);
  }

  onEndPointChange(fn: (coords: Coords) => void) {
    this.ee.on(pfEvents.END_POINT_CHANGE, fn);
  }

  onPathChange(fn: (coords: Coords[]) => void) {
    this.ee.on(pfEvents.PATH_CHANGE, fn);
  }

  onFail(fn: () => void) {
    this.ee.on(pfEvents.FAIL, fn);
  }
}

export default Pathfinder;
