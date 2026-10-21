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
import { createEditorialBackendClient } from "../src/editorial-backend-client.js";
import { resetTestWorker } from "./editorial-worker-environment.js";

const disposals: (() => void)[] = [];
const authenticationFor = (store = createStore()) => {
  const backend = createEditorialBackendClient();
  const authentication = createEditorialAuthentication(store, backend);
  disposals.push(() => {
    authentication.dispose();
    backend.dispose();
  });
  return authentication;
};
const blockedStorage = () => {
  throw new Error("Storage blocked");
};

describe("worker-owned simulated token sessions", () => {
  afterEach(() => {
    for (const dispose of disposals.splice(0)) {
      dispose();
    }
    vi.restoreAllMocks();
  });

  it("keeps authentication usable when session storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blockedStorage);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blockedStorage);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
      blockedStorage
    );
    const store = createStore();
    const authentication = authenticationFor(store);
    await authentication.restore();
    await authentication.signIn({
      email: "editor@example.com",
      password: "bezny-demo",
    });
    expect(store.get(editorialUserAtom)?.provider).toBe("email");
    await authentication.logout();
    expect(store.get(editorialUserAtom)).toBeNull();
  });

  it("ignores pending restoration after disposal without erasing the persisted token", async () => {
    const original = authenticationFor();
    await original.signInSocial("google");
    const token = window.sessionStorage.getItem(editorialSessionTokenKey);
    const store = createStore();
    const authentication = authenticationFor(store);
    const restoring = authentication.restore();
    authentication.dispose();
    await restoring;
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBe(token);
  });

  it("expires worker sessions and removes the browser token", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(0);
    const original = authenticationFor();
    await original.signInSocial("github");
    original.dispose();
    clock.mockReturnValue(8 * 60 * 60 * 1000);
    const store = createStore();
    const authentication = authenticationFor(store);
    await authentication.restore();
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toBeNull();
    expect(store.get(editorialSessionStatusAtom)).toBe("ready");
  });

  it.each([
    "",
    "x".repeat(201),
    "unknown-token",
    "00000000-0000-0000-0000-000000000000",
    JSON.stringify({ name: "Forged Editor", provider: "email" }),
  ])(
    "discards unknown tokens instead of trusting a browser identity: %s",
    async (token) => {
      window.sessionStorage.setItem(editorialSessionTokenKey, token);
      window.sessionStorage.setItem(
        "bezny.demo.simulated-session.v1",
        JSON.stringify({
          token,
          user: { email: "ada@example.com", name: "Ada", provider: "email" },
        })
      );
      const store = createStore();
      await authenticationFor(store).restore();
      expect(store.get(editorialUserAtom)).toBeNull();
      expect(window.sessionStorage).toHaveLength(0);
    }
  );

  it("stores only an opaque token, not identities or passwords", async () => {
    await authenticationFor().signIn({
      email: "editor@example.com",
      password: "bezny-demo",
    });
    expect(window.sessionStorage).toHaveLength(1);
    expect(window.sessionStorage.getItem(editorialSessionTokenKey)).toMatch(
      /^[a-f\d-]{36}$/u
    );
  });

  it("shares profile changes and revocation only with clients using the same token", async () => {
    const original = authenticationFor();
    await original.signInSocial("google");
    const otherStore = createStore();
    const other = authenticationFor(otherStore);
    await other.restore();
    window.sessionStorage.clear();
    const independentStore = createStore();
    await authenticationFor(independentStore).signInSocial("github");
    await original.updateAccount({ email: "ada@example.com", name: "Ada" });
    await vi.waitFor(() =>
      expect(otherStore.get(editorialUserAtom)?.name).toBe("Ada")
    );
    await original.logout();
    await vi.waitFor(() =>
      expect(otherStore.get(editorialUserAtom)).toBeNull()
    );
    expect(independentStore.get(editorialUserAtom)?.provider).toBe("github");
  });

  it("rejects a formerly valid token after the worker loses its memory", async () => {
    await authenticationFor().signInSocial("google");
    resetTestWorker();
    const store = createStore();
    await authenticationFor(store).restore();
    expect(store.get(editorialUserAtom)).toBeNull();
    expect(window.sessionStorage).toHaveLength(0);
  });
});
