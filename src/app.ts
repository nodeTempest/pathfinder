import Graph, { Coords } from "./graph";
import Pathfinder from "./pathfinder";
import View from "./view";
import Controller from "./controller";

const width = 5;
const height = 5;

const A = new Coords(0, 0);
const B = new Coords(2, 0);

const view = new View(width, height);
const graph = new Graph(width, height);
graph.addObstacle(new Coords(1, 0));
const pf = new Pathfinder(graph, A, B);

new Controller(graph, pf, view);
