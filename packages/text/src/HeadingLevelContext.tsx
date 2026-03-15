import { createContext } from "react";

export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const HeadingLevelContext = createContext<HeadingLevel>(0);
