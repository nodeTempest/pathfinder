import "./index.css";

import App from "./app";

const appRoot = document.getElementById("app") as HTMLDivElement;

const options = {
  width: 20,
  height: 20
};

const app = new App(appRoot, options);
app.build();
