import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createDemoApplication, DemoApp } from "./demo-application.js";

import "@bezny/base/style.css";
import "@bezny/admin/style.css";

const root = document.querySelector("#root");

if (!root) {
  throw new Error("The demo requires a root element.");
}

const renderer = createRoot(root);
const start = async () => {
  let application: ReturnType<typeof createDemoApplication> | undefined;
  let disposed = false;
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      disposed = true;
      renderer.unmount();
      application?.dispose();
    });
  }
  try {
    application = createDemoApplication();
    await application.authenticationReady;
    if (!disposed) {
      renderer.render(
        <StrictMode>
          <DemoApp application={application} />
        </StrictMode>
      );
    }
  } catch (error) {
    application?.dispose();
    if (!disposed) {
      renderer.render(
        <p role="alert">
          {error instanceof Error
            ? error.message
            : "Unable to start the demo backend."}
        </p>
      );
    }
  }
};
void start();
