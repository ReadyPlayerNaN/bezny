import type { createStore } from "jotai";

import type { EditorialUser } from "./editorial-auth-contract.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "./editorial-auth-state.js";
import type { EditorialBackendClient } from "./editorial-backend-client.js";
import type { EditorialSession } from "./editorial-backend-protocol.js";

export const editorialSessionTokenKey = "bezny.demo.session-token.v1";
const sessionTokenPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/u;
export interface EditorialAuthentication {
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signInSocial: (provider: "google" | "github") => Promise<void>;
  restore: () => Promise<void>;
  updateAccount: (
    values: Pick<EditorialUser, "email" | "name">
  ) => Promise<void>;
  logout: () => Promise<void>;
  dispose: () => void;
}
const getSessionStorage = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

/** Only the opaque token is tab-local. Session validation and identities live in the worker. */
export const createEditorialAuthentication = (
  store: ReturnType<typeof createStore>,
  backend: EditorialBackendClient
): EditorialAuthentication => {
  let storage = getSessionStorage();
  let token: string | null = null;
  let disposed = false;
  const controller = new AbortController();
  try {
    const persisted = storage?.getItem(editorialSessionTokenKey);
    token = persisted && sessionTokenPattern.test(persisted) ? persisted : null;
    storage?.removeItem("bezny.demo.simulated-session.v1");
  } catch {
    storage = null;
  }
  const apply = (session: EditorialSession | null) => {
    if (disposed) {
      return;
    }
    token = session?.token ?? null;
    try {
      if (token) {
        storage?.setItem(editorialSessionTokenKey, token);
      } else {
        storage?.removeItem(editorialSessionTokenKey);
      }
    } catch {
      storage = null;
    }
    store.set(editorialUserAtom, session?.user ?? null);
    store.set(editorialSessionStatusAtom, "ready");
  };
  const unsubscribe = backend.subscribe((event) => {
    if (event.type === "session" && event.token === token) {
      apply(event.session);
    }
  });
  return {
    dispose: () => {
      disposed = true;
      unsubscribe();
      controller.abort();
      store.set(editorialUserAtom, null);
    },
    logout: async () => {
      await backend.request("logout", { token }, controller.signal);
      apply(null);
    },
    restore: async () => {
      try {
        apply(await backend.request("restore", { token }, controller.signal));
      } catch (error) {
        // Application teardown may race its initial restoration request.
        if (!disposed) {
          throw error;
        }
      }
    },
    signIn: async (credentials) => {
      apply(
        await backend.request(
          "signIn",
          { ...credentials, token },
          controller.signal
        )
      );
    },
    signInSocial: async (provider) => {
      apply(
        await backend.request(
          "signInSocial",
          { provider, token },
          controller.signal
        )
      );
    },
    updateAccount: async (values) => {
      apply(
        await backend.request(
          "updateAccount",
          { ...values, token },
          controller.signal
        )
      );
    },
  };
};
