import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  TextField,
  TextareaField,
  Submit,
} from "@bezny/base";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { AdminCommandMultiChoice } from "./admin-command-multi-choice.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { AdminReferenceFilterInput } from "./admin-reference-filter-input.js";

const CommandTextField = ({
  input,
}: {
  input: NonNullable<AdminCommand["input"]>;
}) => {
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  if (input.type === "textarea") {
    return (
      <TextareaField<{ value: string }>
        name="value"
        label={input.label}
        autoFocus
        maxLength={input.maxLength}
      />
    );
  }
  return (
    <TextField<{ value: string }>
      name="value"
      label={input.label}
      autoFocus
      type={input.type ?? "text"}
      min={input.min}
      max={input.max}
      maxLength={input.maxLength}
      rules={
        input.type === "number"
          ? {
              required: t("numberRequired"),
              validate: (value: string) =>
                (Number.isSafeInteger(Number(value)) &&
                  Number(value) >= (input.min ?? 1) &&
                  Number(value) <= (input.max ?? Number.MAX_SAFE_INTEGER)) ||
                t("numberInvalid"),
            }
          : {}
      }
    />
  );
};
const CommandSelectField = ({
  input,
}: {
  input: NonNullable<AdminCommand["input"]>;
}) => {
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  return (
    <Controller<{ value: string }>
      name="value"
      render={({ field }) => (
        <Select
          name={field.name}
          value={field.value ? `value:${field.value}` : "empty"}
          onValueChange={(value) =>
            field.onChange(
              value === "empty" ? "" : value.slice("value:".length)
            )
          }
        >
          <SelectTrigger
            ref={field.ref}
            autoFocus
            onBlur={() => field.onBlur()}
            aria-label={input.label}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {input.allowEmpty && (
              <SelectItem value="empty">{t("all")}</SelectItem>
            )}
            {input.options?.map((option) => (
              <SelectItem key={option.value} value={`value:${option.value}`}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
};
export const AdminCommandInput = ({
  command,
  apply,
  cancel,
}: {
  command: AdminCommand;
  apply: (value: string) => void;
  cancel: () => void;
}) => {
  const { input } = command;
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const form = useForm<{ value: string }>({
    defaultValues: { value: input?.value ?? "" },
  });
  if (!input) {
    return null;
  }
  let editor = <CommandTextField input={input} />;
  if (input.options) {
    editor = <CommandSelectField input={input} />;
  }
  if (input.multiple) {
    editor = <AdminCommandMultiChoice input={input} />;
  }
  if (input.reference) {
    const { reference } = input;
    editor = (
      <Controller<{ value: string }>
        name="value"
        render={({ field }) => (
          <AdminReferenceFilterInput
            reference={reference}
            label={input.label}
            multiple={input.multiple ?? false}
            value={field.value}
            onChange={(value) => field.onChange(value)}
            onBlur={() => field.onBlur()}
            name={field.name}
            inputRef={field.ref}
          />
        )}
      />
    );
  }
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ value }) => apply(value))}
      >
        {editor}
        <Submit>{t("applyCommand")}</Submit>
        <Button variant="secondary" onClick={cancel}>
          {t("backCommands")}
        </Button>
      </form>
    </FormProvider>
  );
};
