import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectableRow,
} from "@bezny/base";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";
import "./scroll-lock-browser.scss";

const menuLabels = Array.from(
  { length: 20 },
  (_, index) => `Action ${index + 1}`
);
const NestedMenu = ({ modal = true }: { modal?: boolean }) => (
  <ContextMenu modal={modal}>
    <ContextMenuTrigger asChild>
      <button type="button">{modal ? "Nested row" : "Modeless row"}</button>
    </ContextMenuTrigger>
    <ContextMenuContent className="scroll-lock-menu">
      {menuLabels.map((label) => (
        <ContextMenuItem key={label}>{label}</ContextMenuItem>
      ))}
    </ContextMenuContent>
  </ContextMenu>
);
const Fixture = () => {
  const [selected, setSelected] = useState(false);
  const [actions, setActions] = useState(0);
  return (
    <>
      <header id="fixed-header">Fixed header</header>
      <div id="width-probe">Document width</div>
      <section id="triggers" aria-label="Controls">
        <SelectableRow
          selected={selected}
          selectLabel="Select fixture"
          groupLabel="Fixture row"
          selectionId="fixture-row"
          onSelect={() => setSelected((value) => !value)}
          menuItems={menuLabels.map((label) => ({
            key: label,
            label,
            onSelect: () => setActions((count) => count + 1),
          }))}
        >
          Row menu
        </SelectableRow>
        <output aria-label="Completed actions">{actions}</output>
        <Dialog>
          <DialogTrigger>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Nested lock</DialogTitle>
            <DialogDescription>
              Parent stays locked until the dialog closes.
            </DialogDescription>
            <NestedMenu />
            <DialogClose>Close dialog</DialogClose>
          </DialogContent>
        </Dialog>
        <NestedMenu modal={false} />
        <DropdownMenu>
          <DropdownMenuTrigger>Open dropdown</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Dropdown action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover modal>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent>
            <button type="button">Popover action</button>
          </PopoverContent>
        </Popover>
        <Select>
          <SelectTrigger aria-label="Choose item">
            <SelectValue placeholder="Choose item" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">First choice</SelectItem>
            <SelectItem value="two">Second choice</SelectItem>
          </SelectContent>
        </Select>
      </section>
      <section id="background-scroll" aria-label="Background scrolling">
        <div>Background content</div>
      </section>
      <div id="document-space" />
    </>
  );
};
const root = document.querySelector("#root");
if (!root) {
  throw new Error("Fixture root missing.");
}
createRoot(root).render(<Fixture />);
