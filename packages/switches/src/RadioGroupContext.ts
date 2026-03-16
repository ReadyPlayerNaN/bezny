import { createContext, useContext } from "react";

export type RadioGroupContextValue = {
	disabled?: boolean;
	name?: string;
	onChange?: (value: string) => void;
	value?: string;
};

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function useRadioGroup() {
	return useContext(RadioGroupContext);
}
