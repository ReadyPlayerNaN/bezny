import type { createStore } from "jotai";

import {
  editorialSessionEndpoint,
  parseEditorialUser,
} from "./editorial-auth-contract.js";
import type { EditorialUser } from "./editorial-auth-contract.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "./editorial-auth-state.js";

export const editorialSessionTokenKey = "bezny.demo.session-token.v1";
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
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};
const readToken = (storage: Storage | null): string | null => {
  try {
    return storage?.getItem(editorialSessionTokenKey) ?? null;
  } catch {
    return null;
  }
};
const persistToken = (storage: Storage | null, token: string | null) => {
  try {
    if (token) {
      storage?.setItem(editorialSessionTokenKey, token);
    } else {
      storage?.removeItem(editorialSessionTokenKey);
    }
  } catch {
    /* Authentication remains usable if browser storage is blocked. */
  }
};
const readUserResponse = (body: unknown): EditorialUser => {
  const user =
    typeof body === "object" && body !== null && "user" in body
      ? parseEditorialUser(body.user)
      : null;
  if (!user) {
    throw new Error("Invalid authentication response");
  }
  return user;
};

/** The browser persists only an opaque backend-issued token, never profile/password data. */
export const createEditorialAuthentication = (
  store: ReturnType<typeof createStore>
): EditorialAuthentication => {
  const storage = getSessionStorage();
  let token = readToken(storage);
  let disposed = false;
  const controller = new AbortController();
  const request = async (path = "", init: RequestInit = {}) => {
    const response = await fetch(`${editorialSessionEndpoint}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
    return response;
  };
  const clearSession = () => {
    token = null;
    persistToken(storage, null);
    store.set(editorialUserAtom, null);
  };
  const authenticate = async (path: string, body: unknown) => {
    const response = await request(path, {
      body: JSON.stringify(body),
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Authentication failed");
    }
    const result: unknown = await response.json();
    const user = readUserResponse(result);
    if (
      typeof result !== "object" ||
      result === null ||
      !("token" in result) ||
      typeof result.token !== "string" ||
      !result.token
    ) {
      throw new Error("Missing session token");
    }
    if (disposed) {
      return;
    }
    const { token: issuedToken } = result;
    token = issuedToken;
    persistToken(storage, token);
    store.set(editorialUserAtom, user);
    store.set(editorialSessionStatusAtom, "ready");
  };
  return {
    dispose: () => {
      disposed = true;
      controller.abort();
      store.set(editorialUserAtom, null);
    },
    logout: async () => {
      const response = await request("", { method: "DELETE" });
      if (!response.ok && response.status !== 401) {
        throw new Error("Logout failed");
      }
      if (!disposed) {
        clearSession();
      }
    },
    restore: async () => {
      if (!token) {
        store.set(editorialSessionStatusAtom, "ready");
        return;
      }
      store.set(editorialSessionStatusAtom, "loading");
      try {
        const response = await request();
        if (disposed) {
          return;
        }
        if (response.status === 401) {
          clearSession();
        } else {
          if (!response.ok) {
            throw new Error("Session restoration failed");
          }
          const result: unknown = await response.json();
          if (disposed) {
            return;
          }
          store.set(editorialUserAtom, readUserResponse(result));
        }
        store.set(editorialSessionStatusAtom, "ready");
      } catch {
        if (!disposed) {
          store.set(editorialSessionStatusAtom, "error");
        }
      }
    },
    signIn: async (credentials) => {
      await authenticate("/email", credentials);
    },
    signInSocial: async (provider) => {
      await authenticate("/social", { provider });
    },
    updateAccount: async (values) => {
      const response = await request("", {
        body: JSON.stringify(values),
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Account update failed");
      }
      const result: unknown = await response.json();
      if (!disposed) {
        store.set(editorialUserAtom, readUserResponse(result));
      }
    },
  };
};
