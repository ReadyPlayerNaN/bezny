import { createEditorialBackendServer } from "./editorial-backend-server.js";

// Keep worker globals local instead of mixing lib.webworker and lib.dom in the app.
declare const self: {
  addEventListener: (
    type: "connect",
    listener: (event: MessageEvent) => void
  ) => void;
};

const backend = createEditorialBackendServer();
self.addEventListener("connect", (event) => {
  for (const port of event.ports) {
    backend.connect(port);
  }
});
