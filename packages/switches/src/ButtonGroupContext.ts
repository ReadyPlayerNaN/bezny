import { createContext, useContext } from "react";

export type ButtonGroupContextValue = {
	disabled?: boolean;
	onChange?: (value: string) => void;
	value?: string;
};

export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

export function useButtonGroup() {
	return useContext(ButtonGroupContext);
}
