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
  END_POINT_CHANGE = "END_POINT_CHANGE"
}

class Pathfinder {
  private readonly ee = new EventEmitter();
  private _fringe: Vertex[] = [];
  private _closed: Vertex[] = [];
  private _head: Vertex;
  private _startPoint: Coords;
  private _endPoint: Coords;

  constructor(
    private readonly graph: Graph,
    startPoint: Coords,
    endPoint: Coords
  ) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
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

  private collides(coords: Coords): boolean {
    return (
      this.graph.containsObstacle(coords) ||
      (this.startPoint && this.startPoint.equal(coords)) ||
      (this.endPoint && this.endPoint.equal(coords))
    );
  }

  set head(vertex: Vertex) {
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

  calcAdjacent() {
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

    const nextHead = this.fringe[minIndex];

    this.fringe = this.fringe.filter(v => !v.coords.equal(nextHead.coords));

    this.head = nextHead;

    this.closed = [...this.closed, this.head.prev];
  }

  exec() {
    this.head = this.createVertex(this.startPoint);
    while (!this.head.coords.equal(this.endPoint)) {
      this.calcAdjacent();
      this.nextVertex();
    }
  }

  onHeadChange(fn: (vertex: Vertex) => void) {
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
}

export default Pathfinder;
