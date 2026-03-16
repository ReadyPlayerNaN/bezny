import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateInput } from "./DateInput";
import { DateTimeInput } from "./DateTimeInput";
import { EmailInput } from "./EmailInput";
import { MonthInput } from "./MonthInput";
import { NumberInput } from "./NumberInput";
import { PasswordInput } from "./PasswordInput";
import { SearchInput } from "./SearchInput";
import { TimeInput } from "./TimeInput";
import { UrlInput } from "./UrlInput";
import { WeekInput } from "./WeekInput";
import { YearInput } from "./YearInput";

afterEach(cleanup);

describe("NumberInput", () => {
	it("renders with type number", () => {
		render(<NumberInput label="Amount" />);
		expect(screen.getByLabelText("Amount")).toHaveAttribute("type", "number");
	});

	it("calls onChange with string value", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<NumberInput label="Amount" onChange={onChange} />);
		await user.type(screen.getByLabelText("Amount"), "5");
		expect(onChange).toHaveBeenCalledWith("5");
	});
});

describe("DateInput", () => {
	it("renders with type date", () => {
		render(<DateInput label="Birthday" />);
		expect(screen.getByLabelText("Birthday")).toHaveAttribute("type", "date");
	});
});

describe("DateTimeInput", () => {
	it("renders with type datetime-local", () => {
		render(<DateTimeInput label="Meeting" />);
		expect(screen.getByLabelText("Meeting")).toHaveAttribute("type", "datetime-local");
	});
});

describe("TimeInput", () => {
	it("renders with type time", () => {
		render(<TimeInput label="Start" />);
		expect(screen.getByLabelText("Start")).toHaveAttribute("type", "time");
	});
});

describe("EmailInput", () => {
	it("renders with type email", () => {
		render(<EmailInput label="Email" />);
		expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
	});
});

describe("MonthInput", () => {
	it("renders with type month", () => {
		render(<MonthInput label="Month" />);
		expect(screen.getByLabelText("Month")).toHaveAttribute("type", "month");
	});
});

describe("YearInput", () => {
	it("renders with type number", () => {
		render(<YearInput label="Year" />);
		expect(screen.getByLabelText("Year")).toHaveAttribute("type", "number");
	});

	it("has year-appropriate defaults", () => {
		render(<YearInput label="Year" />);
		const input = screen.getByLabelText("Year");
		expect(input).toHaveAttribute("min", "1900");
		expect(input).toHaveAttribute("max", "2100");
		expect(input).toHaveAttribute("step", "1");
	});

	it("allows overriding defaults", () => {
		render(<YearInput label="Year" min={2000} max={2050} />);
		const input = screen.getByLabelText("Year");
		expect(input).toHaveAttribute("min", "2000");
		expect(input).toHaveAttribute("max", "2050");
	});
});

describe("PasswordInput", () => {
	it("renders with type password", () => {
		render(<PasswordInput label="Password" />);
		expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
	});
});

describe("SearchInput", () => {
	it("renders with type search", () => {
		render(<SearchInput label="Search" />);
		expect(screen.getByLabelText("Search")).toHaveAttribute("type", "search");
	});
});

describe("UrlInput", () => {
	it("renders with type url", () => {
		render(<UrlInput label="Website" />);
		expect(screen.getByLabelText("Website")).toHaveAttribute("type", "url");
	});
});

describe("WeekInput", () => {
	it("renders with type week", () => {
		render(<WeekInput label="Week" />);
		expect(screen.getByLabelText("Week")).toHaveAttribute("type", "week");
	});
});
