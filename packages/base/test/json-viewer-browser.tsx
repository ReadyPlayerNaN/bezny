import { JsonViewer } from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";

const value = {
  "a/b": { "~key": [{ "": "override" }] },
  message: "Long payload content ".repeat(50),
  status: "active",
};

const direction =
  new URLSearchParams(location.search).get("dir") === "rtl" ? "rtl" : "ltr";

const App = () => {
  const [inspected, setInspected] = useState("");
  return (
    <main>
      <JsonViewer
        value={value}
        label="Task payload"
        dir={direction}
        renderLeaf={({ path, formattedValue }) =>
          path === "/a~1b/~0key/0/" ? (
            <button type="button" onClick={() => setInspected(path)}>
              {formattedValue}
            </button>
          ) : undefined
        }
      />
      <output aria-label="Inspected pointer">{inspected}</output>
      <div className="bezny-dark">
        <div className="bezny-light">
          <JsonViewer value={{ light: true }} label="Nested light payload" />
        </div>
      </div>
    </main>
  );
};

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
