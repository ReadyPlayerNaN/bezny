import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  TextField,
  Button,
} from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";

import "@bezny/base/style.css";

const App = () => {
  const form = useForm({
    defaultValues: { draft: "" },
    shouldUnregister: true,
  });
  const [saved, setSaved] = useState("");
  return (
    <main>
      <form onSubmit={form.handleSubmit(({ draft }) => setSaved(draft))}>
        <Accordion type="single" collapsible defaultValue="draft">
          <AccordionItem value="draft">
            <AccordionHeader>
              <AccordionTrigger>Draft</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent forceMount>
              <TextField
                name="draft"
                control={form.control}
                label="Draft text"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="other">
            <AccordionHeader>
              <AccordionTrigger>Other</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>Other body</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button type="submit">Save</Button>
        <output aria-label="Saved">{saved}</output>
      </form>
    </main>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing fixture root");
}
createRoot(root).render(<App />);
