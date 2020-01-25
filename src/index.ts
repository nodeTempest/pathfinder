import "./index.css";

const app = document.getElementById("app");

const mouseover = e => {
  console.log(e.target);
};

const mousedown = e => {
  console.log(e.button);
  app.addEventListener("mouseover", mouseover);
};

const mouseup = e => {
  console.log("up");
  app.removeEventListener("mouseover", mouseover);
};

document.addEventListener("mousedown", mousedown);
document.addEventListener("mouseup", mouseup);
document.addEventListener("contextmenu", e => e.preventDefault());
