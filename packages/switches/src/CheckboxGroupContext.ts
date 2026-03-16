import { createContext, useContext } from "react";

export type CheckboxGroupContextValue = {
	disabled?: boolean;
	onChange?: (value: string, checked: boolean) => void;
	value?: string[];
};

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export function useCheckboxGroup() {
	return useContext(CheckboxGroupContext);
}
