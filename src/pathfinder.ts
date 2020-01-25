import { EventEmitter } from "events";

import Graph, { Coords } from "./graph";

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

  constructor(
    private readonly graph: Graph,
    private _startPoint: Coords,
    private _endPoint: Coords
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

  set startPoint(coords: Coords) {
    if (!this.graph.containsObstacle(coords)) {
      this._startPoint = coords;
      this.ee.emit(pfEvents.START_POINT_CHANGE, this._startPoint);
    }
  }

  get startPoint() {
    return this._startPoint;
  }

  set endPoint(coords: Coords) {
    if (!this.graph.containsObstacle(coords)) {
      this._endPoint = coords;
      this.ee.emit(pfEvents.END_POINT_CHANGE, this._endPoint);
    }
  }

  get endtPoint() {
    return this._endPoint;
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

  onStartPointChange(fn: (coords: Coords) => void) {
    this.ee.on(pfEvents.START_POINT_CHANGE, fn);
  }

  onEndPointChange(fn: (coords: Coords) => void) {
    this.ee.on(pfEvents.END_POINT_CHANGE, fn);
  }
}

export default Pathfinder;
