import { CronField, Button } from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";

import "@bezny/base/style.css";

const direction =
  new URLSearchParams(location.search).get("dir") === "rtl" ? "rtl" : "ltr";
const portal = document.querySelector<HTMLElement>("#portal");
const App = () => {
  const form = useForm({ defaultValues: { schedule: "0 0 * * *" } });
  const [saved, setSaved] = useState("");
  const [disabled, setDisabled] = useState(false);
  return (
    <main>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ schedule }) => setSaved(schedule))}
      >
        <CronField
          name="schedule"
          control={form.control}
          label="Schedule"
          help="Five-field cron expression"
          rules={{ required: "Schedule required" }}
          dir={direction}
          portalContainer={portal}
          disabled={disabled}
        />
        <Button type="submit">Save</Button>
        <Button
          variant="secondary"
          onClick={() => form.setValue("schedule", "30 8 * * 1,5")}
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
        <output aria-label="Saved expression">{saved}</output>
      </form>
    </main>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
