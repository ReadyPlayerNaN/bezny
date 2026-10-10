import { atom } from "jotai";

import type { EditorialUser } from "./editorial-auth-contract.js";
import type { EditorialAuthentication } from "./editorial-auth-session.js";

export const editorialUserAtom = atom<EditorialUser | null>(null);
export const editorialSessionStatusAtom = atom<"loading" | "ready">("loading");
export const editorialAuthenticationAtom = atom<EditorialAuthentication | null>(
  null
);
