import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Showcase } from "./showcase.js";

import "@bezny/base/style.css";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("The demo requires a root element.");
}

createRoot(root).render(
  <StrictMode>
    <Showcase />
  </StrictMode>
);
