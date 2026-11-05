import {
  AutocompleteInput,
  MultiItemPicker,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";

interface Item {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}
const alpha: Item = {
  detail:
    "A descriptive label that wraps within a narrow suggestion panel without horizontal scrolling",
  id: "alpha",
  label: "Alpha",
};
const items: Item[] = [
  alpha,
  { disabled: true, id: "disabled", label: "Unavailable" },
  { id: "beta", label: "Beta" },
  { id: "gamma", label: "Gamma" },
];
const longItem: Item = {
  id: "long",
  label: "A long selected skill name that must wrap on a narrow screen",
};
const key = (item: Item) => item.id;
const label = (item: Item) => item.label;
const detail = (item: Item) => item.detail;
const isDisabled = (item: Item) => item.disabled ?? false;
const direction =
  new URLSearchParams(location.search).get("dir") === "rtl" ? "rtl" : "ltr";
const portal = document.querySelector<HTMLElement>("#portal");
const optionProps = {
  dir: direction,
  getOptionDisabled: isDisabled,
  getOptionKey: key,
  getOptionLabel: label,
  getOptionSublabel: detail,
  portalContainer: portal,
};
const NestedPicker = () => {
  const [value, setValue] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <AutocompleteInput
        {...optionProps}
        portalContainer={container}
        aria-label="Dialog company"
        value={value}
        onValueChange={setValue}
        query={query}
        onQueryChange={setQuery}
        options={items}
      />
      <div ref={setContainer} />
    </>
  );
};
const App = () => {
  const [value, setValue] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item[]>([alpha, longItem]);
  const [multiQuery, setMultiQuery] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [submits, setSubmits] = useState(0);
  const [queryCalls, setQueryCalls] = useState(0);
  const [delivered, setDelivered] = useState(false);
  const loading = query === "loading" || (query === "late" && !delivered);
  const error = query === "error" ? "Search unavailable" : undefined;
  let options: Item[] = [];
  if (!loading && !error && query !== "missing") {
    options = items;
  }
  const handleQueryChange = (next: string) => {
    setQuery(next);
    setQueryCalls((count) => count + 1);
  };
  return (
    <main>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((count) => count + 1);
        }}
      >
        <h1>Controlled remote selections</h1>
        <label htmlFor="company">Company</label>
        <AutocompleteInput
          {...optionProps}
          id="company"
          value={value}
          onValueChange={setValue}
          query={query}
          onQueryChange={handleQueryChange}
          options={options}
          loading={loading}
          {...(error ? { error } : {})}
          disabled={disabled}
        />
        <label htmlFor="skills">Skills</label>
        <MultiItemPicker
          {...optionProps}
          id="skills"
          selectionLabel="Selected skills"
          value={selected}
          onValueChange={setSelected}
          query={multiQuery}
          onQueryChange={setMultiQuery}
          options={items}
          maxItems={3}
          disabled={disabled}
        />
        <Button variant="secondary" onClick={() => setDelivered(true)}>
          Deliver results
        </Button>
        <Button type="submit">Save</Button>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disabled
        </label>
        <output aria-label="Submits">{submits}</output>
        <output aria-label="Query calls">{queryCalls}</output>
        <output aria-label="Selected company">{value?.id ?? "none"}</output>
      </form>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Choose company</DialogTitle>
          <DialogDescription>
            Nested autocomplete keyboard ownership
          </DialogDescription>
          <NestedPicker />
        </DialogContent>
      </Dialog>
    </main>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
