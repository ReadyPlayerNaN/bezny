import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileInput } from "./FileInput";
import { ImageInput } from "./ImageInput";

afterEach(cleanup);

describe("FileInput", () => {
	it("renders an input with type file", () => {
		render(<FileInput label="Upload" />);
		expect(screen.getByLabelText("Upload")).toHaveAttribute("type", "file");
	});

	it("calls onChange with FileList", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<FileInput label="Upload" onChange={onChange} />);
		const file = new File(["content"], "test.txt", { type: "text/plain" });
		await user.upload(screen.getByLabelText("Upload"), file);
		expect(onChange).toHaveBeenCalledWith(expect.any(FileList));
	});

	it("renders validation alert", () => {
		render(<FileInput label="Upload" status="error" statusMessage="File too large" />);
		expect(screen.getByRole("alert")).toHaveTextContent("File too large");
	});

	// biome-ignore lint/nursery/useExpect: type-only test — assertion is the @ts-expect-error compile error
	it("does not expose a type prop", () => {
		// @ts-expect-error - type prop should not be accepted
		render(<FileInput type="text" />);
	});
});

describe("ImageInput", () => {
	it("renders with type file and accept image/*", () => {
		render(<ImageInput label="Photo" />);
		const input = screen.getByLabelText("Photo");
		expect(input).toHaveAttribute("type", "file");
		expect(input).toHaveAttribute("accept", "image/*");
	});

	it("allows overriding accept", () => {
		render(<ImageInput label="Photo" accept="image/png,image/jpeg" />);
		expect(screen.getByLabelText("Photo")).toHaveAttribute("accept", "image/png,image/jpeg");
	});
});
