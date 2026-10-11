import { atom } from "jotai";

import type { AdminListQuery } from "./admin-data-adapter.js";

/** Small validated URL-query projection, keyed by registered entities. No record payloads. */
export const adminListQueriesAtom = atom<
  Readonly<Record<string, AdminListQuery>>
>({});
