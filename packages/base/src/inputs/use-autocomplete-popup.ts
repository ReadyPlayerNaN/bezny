import { useState } from "react";

/** Reset transient popup state before children render when availability changes. Keep the native input mounted. */
export const useAutocompletePopup = (unavailable: boolean) => {
  const [state, setState] = useState({ open: false, unavailable });
  if (state.unavailable !== unavailable) {
    setState({ open: false, unavailable });
  }
  const setOpen = (open: boolean) =>
    setState({ open: open && !unavailable, unavailable });
  return [state.open && !unavailable, setOpen] as const;
};
