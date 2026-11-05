import { useState } from "react";

import {
  calendarValue,
  formatCalendarValue,
  inCalendarBounds,
  parseCalendarDraft,
  parseCalendarValue,
} from "./calendar-value.js";
import type {
  CalendarBounds,
  CalendarDate,
  CalendarKind,
} from "./calendar-value.js";

interface CalendarDraftOptions {
  value: string;
  kind: CalendarKind;
  locale: string;
  bounds: CalendarBounds;
  today: CalendarDate;
  onValueChange: (value: string) => void;
  onDraftChange: ((value: string) => void) | undefined;
}
type DraftError = "invalid" | "outOfRange" | null;
interface DraftState {
  source: string;
  raw: string | null;
  error: DraftError;
}
export const useCalendarDraft = ({
  value,
  kind,
  locale,
  bounds,
  today,
  onValueChange,
  onDraftChange,
}: CalendarDraftOptions) => {
  const source = JSON.stringify([value, kind, locale]);
  const [draft, setDraft] = useState<DraftState>({
    error: null,
    raw: null,
    source,
  });
  if (source !== draft.source) {
    setDraft({ error: null, raw: null, source });
  }
  const selected = parseCalendarValue(value, kind);
  const text = draft.raw ?? formatCalendarValue(value, kind, locale);
  const error =
    draft.error ??
    (selected && !inCalendarBounds(selected, bounds) ? "outOfRange" : null);
  const change = (raw: string) => {
    setDraft({ error: null, raw, source });
    onDraftChange?.(raw);
  };
  const choose = (next: string) => {
    setDraft({ error: null, raw: null, source });
    onValueChange(next);
  };
  const commit = () => {
    if (draft.raw === null && selected && inCalendarBounds(selected, bounds)) {
      return;
    }
    if (text.trim() === "") {
      setDraft({ error: null, raw: null, source });
      if (value !== "") {
        onValueChange("");
      }
      return;
    }
    const parsed = parseCalendarDraft(text, kind, locale, today.year);
    if (!parsed) {
      setDraft({ error: "invalid", raw: text, source });
      return;
    }
    if (!inCalendarBounds(parsed, bounds)) {
      setDraft({ error: "outOfRange", raw: text, source });
      return;
    }
    choose(calendarValue(parsed, kind));
  };
  return { change, choose, commit, error, selected, text };
};
