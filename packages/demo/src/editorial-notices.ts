import { atom } from "jotai";

import type { EditorialNotice } from "./editorial-records.js";

export const noticeAtom = atom<EditorialNotice | null>(null);
