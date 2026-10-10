import { atom } from "jotai";

import type { AdminListQuery } from "./admin-data-adapter.js";

/** Small UI query state, keyed only by registered entities. No record payloads. */
export const adminListQueriesAtom = atom<
  Readonly<Record<string, AdminListQuery>>
>({});
