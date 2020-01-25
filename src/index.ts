import "./index.css";

import App from "./app";

const appRoot = document.getElementById("app") as HTMLDivElement;

const app = new App(appRoot);
app.build();
