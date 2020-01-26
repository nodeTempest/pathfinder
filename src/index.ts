import "./index.css";

import App from "./app";

const appRoot = document.getElementById("app") as HTMLDivElement;

const app = new App(appRoot);
app.build();

// import Graph, { Coords } from "./graph";
// import Pathfinder from "./pathfinder";

// const w = 5;
// const h = 5;

// const gr = new Graph(w, h);
// gr.addObstacle(new Coords(1, 0));

// const A = new Coords(0, 0);
// const B = new Coords(2, 0);

// const pf = new Pathfinder(gr, A, B);

// pf.exec();

// console.log(pf);
