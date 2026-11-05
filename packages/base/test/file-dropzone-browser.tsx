import { FileDropzone } from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";

const App = () => {
  const [value, setValue] = useState<File | null>(null);
  const [count, setCount] = useState(0);
  const [disabled, setDisabled] = useState(false);
  return (
    <main>
      <FileDropzone
        value={value}
        disabled={disabled}
        accept="application/pdf"
        onValueChange={(file) => {
          setValue(file);
          setCount((current) => current + 1);
        }}
      />
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />
        Disable upload
      </label>
      <output aria-label="Changes">{count}</output>
    </main>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
