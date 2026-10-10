import { useEffect, useRef } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";

const getSelectionRow = (event: MouseEvent<HTMLDivElement>) => {
  if (!(event.target instanceof Element)) {
    return null;
  }
  const row = event.target.closest<HTMLElement>("[data-selection-id]");
  return row?.closest("[data-selection-active]") === event.currentTarget &&
    row.dataset.selectDisabled !== "true" &&
    row.dataset.selectable !== "false"
    ? row
    : null;
};

export const useRowSelectionDrag = (
  selectedIds: readonly string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>
) => {
  const drag = useRef<{
    startId: string;
    lastId: string;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    const handleStop = () => {
      drag.current = null;
    };
    window.addEventListener("mouseup", handleStop);
    window.addEventListener("blur", handleStop);
    return () => {
      window.removeEventListener("mouseup", handleStop);
      window.removeEventListener("blur", handleStop);
    };
  }, []);
  return {
    "data-selection-active": selectedIds.length > 0,
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onMouseDownCapture: (event: MouseEvent<HTMLDivElement>) => {
      drag.current = null;
      suppressClick.current = false;
      if (
        event.button !== 0 ||
        selectedIds.length === 0 ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const control = event.target.closest(
        "a,button,input,textarea,select,[contenteditable=true]"
      );
      if (control && !control.matches("[data-selection-control]")) {
        return;
      }
      const id = getSelectionRow(event)?.dataset.selectionId;
      if (!id) {
        return;
      }
      event.preventDefault();
      drag.current = { lastId: id, moved: false, startId: id };
    },
    onMouseOver: (event: MouseEvent<HTMLDivElement>) => {
      const { current } = drag;
      if (!current) {
        return;
      }
      if (event.buttons % 2 === 0) {
        drag.current = null;
        return;
      }
      const id = getSelectionRow(event)?.dataset.selectionId;
      if (!id || id === current.lastId) {
        return;
      }
      const ids = current.moved ? [id] : [current.startId, id];
      current.lastId = id;
      current.moved = true;
      suppressClick.current = true;
      const affectedIds = new Set(ids);
      setSelectedIds((previous) =>
        event.shiftKey
          ? previous.filter((selectedId) => !affectedIds.has(selectedId))
          : [...new Set([...previous, ...ids])]
      );
    },
  };
};
