// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileDropzone, FieldFeedback } from "../src/index.js";

const file = new File(["PDF"], "invoice.pdf", { type: "application/pdf" });
const Controlled = () => {
  const [value, setValue] = useState<File | null>(null);
  return (
    <FileDropzone
      value={value}
      onValueChange={setValue}
      accept="application/pdf"
    />
  );
};
const Form = ({
  save,
}: {
  save: (values: { document: File | null }) => void;
}) => {
  const form = useForm<{ document: File | null }>({
    defaultValues: { document: null },
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(save)}>
      <Controller
        control={form.control}
        name="document"
        rules={{ required: "Document required" }}
        render={({ field, fieldState }) => (
          <>
            <FileDropzone
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              ref={field.ref}
              name={field.name}
              onBlur={() => field.onBlur()}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? "file-error" : undefined}
            />
            <FieldFeedback
              error={fieldState.error?.message}
              errorId="file-error"
            />
          </>
        )}
      />
      <button type="submit">Save</button>
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
};

describe(FileDropzone, () => {
  afterEach(cleanup);

  it("shows selected name/size, clears and restores native-input focus", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByLabelText("Choose a file") as HTMLInputElement;
    await user.upload(input, file);
    expect(screen.getByText("invoice.pdf")).toBeTruthy();
    expect(screen.getByText("3 bytes")).toBeTruthy();
    expect(input.value).toBe("");
    await user.click(screen.getByRole("button", { name: "Clear file" }));
    expect(screen.queryByText("invoice.pdf")).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("allows same-file reselection without requiring clear, and preserves selection on cancellation", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(file: File | null) => void>();
    render(<FileDropzone value={file} onValueChange={change} />);
    const input = screen.getByLabelText("Choose a file") as HTMLInputElement;
    await user.upload(input, file);
    await user.upload(input, file);
    expect(change).toHaveBeenCalledTimes(2);
    fireEvent.change(input, { target: { files: [] } });
    expect(change).toHaveBeenCalledTimes(2);
    expect(screen.getByText("invoice.pdf")).toBeTruthy();
  });

  it("takes only the first dropped file and leaves MIME/size validation to the host", () => {
    const change = vi.fn<(file: File | null) => void>();
    const { container } = render(
      <FileDropzone value={null} onValueChange={change} accept="image/png" />
    );
    const input = screen.getByLabelText("Choose a file");
    fireEvent.dragOver(input, {
      dataTransfer: { dropEffect: "none", files: [file] },
    });
    expect(container.querySelector('[data-dragging="true"]')).toBeTruthy();
    fireEvent.drop(input, {
      dataTransfer: { files: [file, new File(["second"], "other.pdf")] },
    });
    expect(change).toHaveBeenCalledExactlyOnceWith(file);
    expect(container.querySelector("[data-dragging]")).toBeNull();
    fireEvent.drop(input, { dataTransfer: { files: [] } });
    expect(change).toHaveBeenCalledOnce();
  });

  it("blocks browse, drop and clear while disabled", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(file: File | null) => void>();
    render(<FileDropzone value={file} onValueChange={change} disabled />);
    const input = screen.getByLabelText("Choose a file");
    await user.upload(input, file);
    fireEvent.drop(input, { dataTransfer: { files: [file] } });
    await user.click(screen.getByRole("button", { name: "Clear file" }));
    expect(change).not.toHaveBeenCalled();
    expect(input.hasAttribute("disabled")).toBeTruthy();
  });

  it("forwards native refs/props, composes description IDs, and supports external values and labels", () => {
    const ref = createRef<HTMLInputElement>();
    const change = vi.fn<(file: File | null) => void>();
    const { rerender } = render(
      <>
        <p id="help">PDF only</p>
        <FileDropzone
          ref={ref}
          id="document"
          name="document"
          accept="application/pdf"
          value={file}
          onValueChange={change}
          aria-describedby="help"
          labels={{ choose: "Browse", clear: "Remove" }}
          formatSize={(bytes) => `${bytes} B`}
        />
      </>
    );
    expect(ref.current).toBe(screen.getByLabelText("Browse"));
    expect(ref.current?.getAttribute("aria-describedby")?.split(" ")).toContain(
      "help"
    );
    expect(ref.current?.accept).toBe("application/pdf");
    expect(screen.getByText("3 B")).toBeTruthy();
    rerender(<FileDropzone value={null} onValueChange={change} />);
    expect(screen.queryByRole("button", { name: "Clear file" })).toBeNull();
  });

  it("integrates RHF required validation, error focus, submission and reset without owning uploads", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(values: { document: File | null }) => void>();
    render(<Form save={save} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const input = screen.getByLabelText("Choose a file");
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(screen.getByRole("alert").textContent).toBe("Document required");
    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save.mock.calls[0]?.[0].document).toBe(file);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("invoice.pdf")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
