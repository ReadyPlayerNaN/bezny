import { DateField, MonthField, Button } from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";

import "@bezny/base/style.css";

const parameters = new URLSearchParams(location.search);
const direction = parameters.get("dir") === "rtl" ? "rtl" : "ltr";
const locale = parameters.get("locale") ?? "en-US";
const portal = document.querySelector<HTMLElement>("#portal");
const App = () => {
  const form = useForm({
    defaultValues: { date: "2024-02-29", month: "2024-02" },
  });
  const [saved, setSaved] = useState("");
  const [saves, setSaves] = useState(0);
  const [disabled, setDisabled] = useState(false);
  return (
    <main>
      <h1>Date-only controls</h1>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) => {
          setSaved(JSON.stringify(values));
          setSaves((count) => count + 1);
        })}
      >
        <DateField
          name="date"
          label="Date"
          help="Gregorian date"
          control={form.control}
          min="2020-01-01"
          max="2030-12-31"
          today="2024-03-02"
          locale={locale}
          dir={direction}
          portalContainer={portal}
          rules={{ required: "Date required" }}
          disabled={disabled}
        />
        <MonthField
          name="month"
          label="Month"
          help="Gregorian month"
          control={form.control}
          min="2020-01"
          max="2030-12"
          today="2024-03"
          locale={locale}
          dir={direction}
          portalContainer={portal}
          rules={{ required: "Month required" }}
          disabled={disabled}
        />
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            form.setValue("date", "2025-06-15");
            form.setValue("month", "2025-06");
          }}
        >
          External update
        </Button>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />
          Disabled
        </label>
        <output aria-label="Saved values">{saved}</output>
        <output aria-label="Save count">{saves}</output>
      </form>
    </main>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
