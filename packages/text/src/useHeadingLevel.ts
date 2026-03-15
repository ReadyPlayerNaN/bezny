import { useContext } from "react";
import { HeadingLevelContext } from "./HeadingLevelContext";

export function useHeadingLevel() {
	return useContext(HeadingLevelContext);
}
