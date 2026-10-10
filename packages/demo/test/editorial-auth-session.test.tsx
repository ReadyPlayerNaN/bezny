import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createEditorialAuthentication,
  editorialSessionTokenKey,
  editorialSimulatedSessionKey,
} from "../src/editorial-auth-session.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "../src/editorial-auth-state.js";

const blockedStorage = () => {
  throw new Error("Storage blocked");
};

describe("browser-only simulated token session", () => {
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

  it("ignores pending restoration after disposal without erasing the persisted token", async () => {
    const original = createEditorialAuthentication(createStore());
    await original.signInSocial("google");
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    const restoring = authentication.restore();
    authentication.dispose();
    await restoring;
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBe(token);
    original.dispose();
  });

  it("expires simulated sessions and clears both token and mock session record", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(0);
    const original = createEditorialAuthentication(createStore());
    await original.signInSocial("github");
    original.dispose();
    clock.mockReturnValue(8 * 60 * 60 * 1000);
    const store = createStore();
    const authentication = createEditorialAuthentication(store);
    await authentication.restore();
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBeNull();
    expect(
      window.sessionStorage.getItem(editorialSimulatedSessionKey)
    ).toBeNull();
    expect(store.get(editorialSessionStatusAtom)).toBe("ready");
    authentication.dispose();
  });

  it.each([
    "not-json",
    JSON.stringify({
      expiresAt: Number.MAX_SAFE_INTEGER,
      token: "different-token",
      user: { email: "ada@example.com", name: "Ada", provider: "email" },
    }),
    JSON.stringify({
      expiresAt: Number.MAX_SAFE_INTEGER,
      token: "opaque-token",
      user: { name: "Ada" },
    }),
  ])(
    "discards malformed or mismatched mock session data: %s",
    async (serialized) => {
      window.sessionStorage.setItem(editorialSessionTokenKey, "opaque-token");
      window.sessionStorage.setItem(editorialSimulatedSessionKey, serialized);
      const store = createStore();
      const authentication = createEditorialAuthentication(store);
      await authentication.restore();
      expect(store.get(editorialUserAtom)).toBeNull();
      expect(window.sessionStorage).toHaveLength(0);
      authentication.dispose();
    }
  );

  it("does not store passwords in either simulated session entry", async () => {
    const authentication = createEditorialAuthentication(createStore());
    await authentication.signIn({
      email: "editor@example.com",
      password: "bezny-demo",
    });
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    const session = window.sessionStorage.getItem(editorialSimulatedSessionKey);
    expect(token).not.toContain("bezny-demo");
    expect(session).not.toContain("password");
    expect(session).not.toContain("bezny-demo");
    authentication.dispose();
  });
});
