import type { AdminCommand } from "@bezny/admin/entities";
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

const CommandTextField = ({
  input,
}: {
  input: NonNullable<AdminCommand["input"]>;
}) => {
  const { t } = useTranslation("editorial");
  if (input.type === "textarea") {
    return (
      <TextareaField<{ value: string }>
        name="value"
        label={input.label}
        maxLength={input.maxLength}
      />
    );
  }
  return (
    <TextField<{ value: string }>
      name="value"
      label={input.label}
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
                t("pageInvalid"),
            }
          : {}
      }
    />
  );
};
export const EditorialCommandInput = ({
  command,
  apply,
  cancel,
}: {
  command: AdminCommand;
  apply: (value: string) => void;
  cancel: () => void;
}) => {
  const { input } = command;
  const { t } = useTranslation("editorial");
  const form = useForm<{ value: string }>({
    defaultValues: { value: input?.value ?? "" },
  });
  if (!input) {
    return null;
  }
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(({ value }) => apply(value))}
      >
        {input.options ? (
          <Controller
            name="value"
            control={form.control}
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
                    <SelectItem
                      key={option.value}
                      value={`value:${option.value}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <CommandTextField input={input} />
        )}
        <Submit>{t("applyCommand")}</Submit>
        <Button variant="secondary" onClick={cancel}>
          {t("backCommands")}
        </Button>
      </form>
    </FormProvider>
  );
};
