import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createDemoApplication, DemoApp } from "./demo-application.js";

import "@bezny/base/style.css";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("The demo requires a root element.");
}

const application = createDemoApplication();

createRoot(root).render(
  <StrictMode>
    <DemoApp application={application} />
  </StrictMode>
);
