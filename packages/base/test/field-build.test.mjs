/* oxlint-disable vitest/no-import-node-test, vitest/prefer-importing-vitest-globals -- These test the published ESM entry and its RHF context. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CheckboxField,
  EmailField,
  FieldFeedback,
  FieldLabel,
  RadioField,
  TextareaField,
  TextField,
  TextInput,
  ToggleField,
  ToggleInput,
} from "@bezny/base";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormProvider, useForm } from "react-hook-form";

const BoundFieldSnapshot = () => {
  const form = useForm({ defaultValues: { name: "Ada", notifications: true } });
  return createElement(
    FormProvider,
    form,
    createElement(
      "div",
      null,
      createElement(TextField, { label: "Name", name: "name" }),
      createElement(ToggleField, {
        label: "Notifications",
        name: "notifications",
      })
    )
  );
};

test("built package exports all requested field and input components", () => {
  for (const component of [
    FieldLabel,
    FieldFeedback,
    TextInput,
    TextField,
    EmailField,
    CheckboxField,
    RadioField,
    TextareaField,
    ToggleField,
    ToggleInput,
  ]) {
    assert.equal(typeof component, "function");
  }
});

test("built fields use the consumer's RHF provider context", () => {
  const html = renderToStaticMarkup(createElement(BoundFieldSnapshot));
  assert.ok(html.includes('value="Ada"'));
  assert.ok(html.includes('name="name"'));
  assert.match(html, /role="switch"[^>]+aria-checked="true"/u);
});

test("RHF remains an external dependency in the built module", () => {
  const javascript = readFileSync(
    new URL(import.meta.resolve("@bezny/base")),
    "utf-8"
  );
  assert.ok(javascript.includes('from "react-hook-form"'));
  assert.ok(javascript.includes('from "@radix-ui/react-switch"'));
});
