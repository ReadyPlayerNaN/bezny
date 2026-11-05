import { useDirection } from "@radix-ui/react-direction";
import { CalendarDaysIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "../controls/button.js";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "../controls/popover.js";
import { calendarInputLabels } from "./calendar-input-props.js";
import type {
  DateInputProps,
  MonthInputProps,
} from "./calendar-input-props.js";
import { CalendarPanel } from "./calendar-panel.js";
import {
  calendarBounds,
  calendarPlaceholder,
  calendarValue,
  inCalendarBounds,
  localCalendarToday,
  parseCalendarValue,
} from "./calendar-value.js";
import type { CalendarDate, CalendarKind } from "./calendar-value.js";
import { TextInput } from "./text-input.js";
import { useCalendarDraft } from "./use-calendar-draft.js";

import styles from "./calendar-input.module.scss";

export type {
  DateInputProps,
  MonthInputProps,
  CalendarInputLabels,
} from "./calendar-input-props.js";
type CalendarInputProps = DateInputProps & {
  kind: CalendarKind;
  suppressDraftFeedback?: boolean;
};
const imeKeyCode = 229;
const readToday = (value: string, kind: CalendarKind): CalendarDate => {
  const parsed = parseCalendarValue(value, kind);
  if (!parsed) {
    throw new RangeError(`Invalid ${kind} today value`);
  }
  return parsed;
};
export const CalendarInput = ({
  kind,
  value,
  onValueChange,
  onDraftChange,
  onBlur,
  locale = "en",
  min,
  max,
  minYear = 1,
  today: todayValue,
  weekStartsOn = 1,
  labels: overrides,
  portalContainer,
  disabled = false,
  readOnly = false,
  suppressDraftFeedback,
  className,
  id: suppliedId,
  ref,
  placeholder,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  "aria-invalid": externalInvalid,
  "aria-describedby": describedBy,
  ...props
}: CalendarInputProps) => {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const errorId = `${id}-draft-error`;
  const composing = useRef(false);
  const dir = useDirection(
    props.dir === "rtl" || props.dir === "ltr" ? props.dir : undefined
  );
  const labels = calendarInputLabels(kind, overrides);
  const bounds = calendarBounds(kind, min, max, minYear);
  const today = readToday(todayValue ?? localCalendarToday(kind), kind);
  const draft = useCalendarDraft({
    bounds,
    kind,
    locale,
    onDraftChange,
    onValueChange,
    today,
    value,
  });
  const unavailable = disabled || readOnly;
  const [overlay, setOverlay] = useState({ open: false, unavailable });
  if (overlay.unavailable !== unavailable) {
    setOverlay({ open: false, unavailable });
  }
  const open = overlay.open && !unavailable;
  const message =
    draft.error && !suppressDraftFeedback ? labels[draft.error] : null;
  const handleOpenChange = (next: boolean) => {
    setOverlay({ open: next && !unavailable, unavailable });
    if (!next) {
      onBlur?.();
    }
  };
  const choose = (next: string) => {
    if (unavailable) {
      return;
    }
    draft.choose(next);
    handleOpenChange(false);
  };
  const pick = (date: CalendarDate) => {
    if (inCalendarBounds(date, bounds)) {
      choose(calendarValue(date, kind));
    }
  };
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      dir={dir}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverAnchor asChild>
          <div className={styles.field}>
            <TextInput
              {...props}
              id={id}
              ref={ref}
              type="text"
              inputMode="numeric"
              value={draft.text}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder ?? calendarPlaceholder(kind, locale)}
              aria-invalid={Boolean(draft.error) || externalInvalid}
              aria-describedby={
                [describedBy, message ? errorId : undefined]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onChange={(event) => {
                if (!unavailable) {
                  draft.change(event.target.value);
                }
              }}
              onBlur={() => {
                if (!unavailable) {
                  draft.commit();
                }
                onBlur?.();
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (
                  event.defaultPrevented ||
                  unavailable ||
                  composing.current ||
                  event.nativeEvent.isComposing ||
                  event.keyCode === imeKeyCode
                ) {
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  draft.commit();
                }
              }}
              onCompositionStart={(event) => {
                composing.current = true;
                onCompositionStart?.(event);
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                onCompositionEnd?.(event);
              }}
            />
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="small"
                aria-label={labels.open}
                disabled={unavailable}
              >
                <CalendarDaysIcon aria-hidden="true" className={styles.icon} />
              </Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          container={portalContainer}
          className={styles.panel}
          aria-label={labels.open}
          dir={dir}
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <CalendarPanel
            key={JSON.stringify([kind, value, locale, min, max, minYear])}
            kind={kind}
            selected={draft.selected}
            today={today}
            bounds={bounds}
            locale={locale}
            weekStartsOn={weekStartsOn}
            labels={labels}
            disabled={unavailable}
            dir={dir}
            onPick={pick}
            onClear={() => choose("")}
          />
        </PopoverContent>
      </Popover>
      {message ? (
        <div id={errorId} role="alert" className={styles.error}>
          {message}
        </div>
      ) : null}
    </div>
  );
};
export const DateInput = (props: DateInputProps) => (
  <CalendarInput {...props} kind="date" />
);
export const MonthInput = (props: MonthInputProps) => (
  <CalendarInput {...props} kind="month" />
);
