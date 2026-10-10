import assert from "node:assert/strict";

import { AdminProvider } from "@bezny/admin";

// Verify the public export without Vitest's module resolution or transforms.
assert.equal(typeof AdminProvider, "function");
