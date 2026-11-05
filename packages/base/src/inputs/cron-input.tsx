import { useId, useState } from "react";

import { Button } from "../controls/button.js";
import {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
  PopoverContent,
} from "../controls/popover.js";
import type { PopoverContentProps } from "../controls/popover.js";
import { FieldLabel } from "../fields/field-label.js";
import {
  buildCronExpression,
  describeCronExpression,
  parseCronExpression,
} from "./cron-expression.js";
import type { CronMode, CronParts } from "./cron-expression.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select.js";
import { TextInput } from "./text-input.js";
import type { TextInputProps } from "./text-input.js";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group.js";

import styles from "./cron-input.module.scss";

export type CronInputLabels = Record<CronMode, string> & {
  build: string;
  builder: string;
  mode: string;
  hour: string;
  minute: string;
  interval: string;
  weekDays: string;
  monthDays: string;
  raw: string;
  invalid: string;
  weekdays: readonly [string, string, string, string, string, string, string];
};
export type CronInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChange" | "onBlur" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  labels?: Partial<CronInputLabels>;
  describeExpression?: (value: string) => string;
  portalContainer?: PopoverContentProps["container"];
};
const defaults: CronInputLabels = {
  build: "Build",
  builder: "Cron builder",
  custom: "Custom",
  daily: "Daily",
  hour: "Hour",
  hourly: "Hourly",
  interval: "Every N hours",
  invalid: "Invalid cron expression",
  minute: "Minute",
  mode: "Schedule frequency",
  monthDays: "Days of month",
  monthly: "Monthly",
  raw: "Raw expression",
  weekDays: "Days of week",
  weekdays: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  weekly: "Weekly",
};
const modes: CronMode[] = ["hourly", "daily", "weekly", "monthly", "custom"];
const weekdays = [0, 1, 2, 3, 4, 5, 6] as const;
const isMode = (mode: string): mode is CronMode =>
  modes.some((candidate) => candidate === mode);

interface NumberChoiceProps {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  disabled: boolean;
  onValueChange: (value: number) => void;
  container: PopoverContentProps["container"];
  dir: "ltr" | "rtl";
}
const NumberChoice = ({
  label,
  value,
  minimum,
  maximum,
  disabled,
  onValueChange,
  container,
  dir,
}: NumberChoiceProps) => {
  const id = useId();
  const choices = Array.from(
    { length: maximum - minimum + 1 },
    (_, index) => index + minimum
  );
  return (
    <div className={styles.choice}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={String(value)}
        onValueChange={(next) => onValueChange(Number(next))}
        disabled={disabled}
        dir={dir}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          {choices.map((choice) => (
            <SelectItem key={choice} value={String(choice)}>
              {String(choice).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
interface BuilderProps {
  mode: CronMode;
  parts: CronParts;
  value: string;
  disabled: boolean;
  labels: CronInputLabels;
  changeMode: (mode: CronMode) => void;
  changeParts: (parts: CronParts) => void;
  changeRaw: (value: string) => void;
  container: PopoverContentProps["container"];
  dir: "ltr" | "rtl";
}
const CronBuilder = ({
  mode,
  parts,
  value,
  disabled,
  labels,
  changeMode,
  changeParts,
  changeRaw,
  container,
  dir,
}: BuilderProps) => {
  const rawId = useId();
  return (
    <>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(next) => {
          if (isMode(next)) {
            changeMode(next);
          }
        }}
        disabled={disabled}
        dir={dir}
        aria-label={labels.mode}
        className={styles.choices}
      >
        {modes.map((entry) => (
          <ToggleGroupItem key={entry} value={entry}>
            {labels[entry]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {mode === "custom" ? (
        <div className={styles.choice}>
          <FieldLabel htmlFor={rawId}>{labels.raw}</FieldLabel>
          <TextInput
            id={rawId}
            dir="ltr"
            value={value}
            disabled={disabled}
            onChange={(event) => changeRaw(event.target.value)}
          />
        </div>
      ) : (
        <>
          {mode === "hourly" ? (
            <NumberChoice
              label={labels.interval}
              value={parts.hourInterval}
              minimum={1}
              maximum={12}
              disabled={disabled}
              container={container}
              dir={dir}
              onValueChange={(hourInterval) =>
                changeParts({ ...parts, hourInterval })
              }
            />
          ) : (
            <NumberChoice
              label={labels.hour}
              value={parts.hour}
              minimum={0}
              maximum={23}
              disabled={disabled}
              container={container}
              dir={dir}
              onValueChange={(hour) => changeParts({ ...parts, hour })}
            />
          )}
          <NumberChoice
            label={labels.minute}
            value={parts.minute}
            minimum={0}
            maximum={59}
            disabled={disabled}
            container={container}
            dir={dir}
            onValueChange={(minute) => changeParts({ ...parts, minute })}
          />
          {mode === "weekly" ? (
            <div className={styles.choice}>
              <FieldLabel asComponent="span">{labels.weekDays}</FieldLabel>
              <ToggleGroup
                type="multiple"
                value={parts.daysOfWeek.map(String)}
                onValueChange={(days) =>
                  changeParts({ ...parts, daysOfWeek: days.map(Number) })
                }
                disabled={disabled}
                dir={dir}
                aria-label={labels.weekDays}
                className={styles.choices}
              >
                {weekdays.map((day) => (
                  <ToggleGroupItem key={day} value={String(day)}>
                    {labels.weekdays[day]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}
          {mode === "monthly" ? (
            <div className={styles.choice}>
              <FieldLabel asComponent="span">{labels.monthDays}</FieldLabel>
              <ToggleGroup
                type="multiple"
                value={parts.daysOfMonth.map(String)}
                onValueChange={(days) =>
                  changeParts({ ...parts, daysOfMonth: days.map(Number) })
                }
                disabled={disabled}
                dir={dir}
                aria-label={labels.monthDays}
                className={styles.monthDays}
              >
                {Array.from({ length: 31 }, (_, index) => index + 1).map(
                  (day) => (
                    <ToggleGroupItem
                      key={day}
                      value={String(day)}
                      className={styles.day}
                    >
                      {day}
                    </ToggleGroupItem>
                  )
                )}
              </ToggleGroup>
            </div>
          ) : null}
        </>
      )}
    </>
  );
};

export const CronInput = ({
  value,
  onValueChange,
  onBlur,
  labels: overrides,
  describeExpression,
  portalContainer,
  disabled = false,
  readOnly = false,
  className,
  dir,
  "aria-describedby": describedBy,
  ...props
}: CronInputProps) => {
  const labels = { ...defaults, ...overrides };
  const descriptionId = useId();
  const parsed = parseCronExpression(value);
  // Custom choice/editing is tied to this value, not a second expression owner.
  const [customValue, setCustomValue] = useState<string | null>(null);
  const mode = customValue === value ? "custom" : parsed.mode;
  const unavailable = disabled || readOnly;
  const changeRaw = (next: string) => {
    if (unavailable) {
      return;
    }
    if (mode === "custom") {
      setCustomValue(next);
    }
    onValueChange(next);
  };
  const changeMode = (next: CronMode) => {
    if (unavailable) {
      return;
    }
    if (next === "custom") {
      setCustomValue(value);
      return;
    }
    setCustomValue(null);
    onValueChange(buildCronExpression(next, parsed.parts));
  };
  const changeParts = (parts: CronParts) => {
    if (!unavailable) {
      onValueChange(buildCronExpression(mode, parts));
    }
  };
  const description = describeExpression
    ? describeExpression(value)
    : describeCronExpression(value, labels.invalid);
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      dir={dir}
    >
      <Popover>
        <PopoverAnchor asChild>
          <div className={styles.row}>
            <TextInput
              {...props}
              value={value}
              type="text"
              dir="ltr"
              disabled={disabled}
              readOnly={readOnly}
              onBlur={onBlur}
              onChange={(event) => changeRaw(event.target.value)}
              aria-describedby={[describedBy, descriptionId]
                .filter(Boolean)
                .join(" ")}
            />
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                disabled={unavailable}
                aria-label={labels.builder}
              >
                {labels.build}
              </Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          container={portalContainer}
          className={styles.panel}
          aria-label={labels.builder}
          align="start"
          dir={dir}
          onCloseAutoFocus={() => onBlur?.()}
        >
          <CronBuilder
            mode={mode}
            parts={parsed.parts}
            value={value}
            disabled={unavailable}
            labels={labels}
            changeMode={changeMode}
            changeParts={changeParts}
            changeRaw={changeRaw}
            container={portalContainer}
            dir={dir === "rtl" ? "rtl" : "ltr"}
          />
          <p>{description}</p>
          <code dir="ltr">{value || "—"}</code>
        </PopoverContent>
      </Popover>
      <output id={descriptionId} className={styles.description}>
        {description}
      </output>
    </div>
  );
};
