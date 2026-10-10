import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createEditorialAuthentication,
  editorialSessionTokenKey,
} from "../src/editorial-auth-session.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "../src/editorial-auth-state.js";

const blockedStorage = () => {
  throw new Error("Storage blocked");
};

describe("editorial token session lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps authentication usable when session storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blockedStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blockedStorage);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
      blockedStorage
    );
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    await authentication.restore();
    await authentication.signIn({
      email: "editor@example.com",
      password: "bezny-demo",
    });
    expect(store.get(editorialUserAtom)?.provider).toBe("email");
    await authentication.logout();
    expect(store.get(editorialUserAtom)).toBeNull();
    authentication.dispose();
  });

  it("ignores late restoration responses after disposal without erasing the persisted token", async () => {
    window.sessionStorage.setItem(editorialSessionTokenKey, "opaque-token");
    const response = Promise.withResolvers<Response>();
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(
      async () => await response.promise
    );
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    const restoring = authentication.restore();
    authentication.dispose();
    response.resolve(
      Response.json({
        user: { email: "ada@example.com", name: "Ada", provider: "email" },
      })
    );
    await restoring;
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBe(
      "opaque-token"
    );
  });

  it("preserves the session when profile saving or backend logout fails", async () => {
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    await authentication.signIn({
      email: "editor@example.com",
      password: "bezny-demo",
    });
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 503 })
    );
    await expect(
      authentication.updateAccount({ email: "ada@example.com", name: "Ada" })
    ).rejects.toThrow("Account update failed");
    expect(store.get(editorialUserAtom)?.name).toBe("Demo Editor");
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(null, { status: 503 })
    );
    await expect(authentication.logout()).rejects.toThrow("Logout failed");
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBe(token);
    authentication.dispose();
  });

  it("does not grant a session for a malformed backend response", async () => {
    window.sessionStorage.setItem(editorialSessionTokenKey, "opaque-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ user: { name: "Ada" } })
    );
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    await authentication.restore();
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(store.get(editorialSessionStatusAtom)).toBe("error");
    authentication.dispose();
  });
});
