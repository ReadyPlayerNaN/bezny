import type { createStore } from "jotai";

import {
  demoEditorialUser,
  demoPassword,
  parseEditorialUser,
} from "./editorial-auth-contract.js";
import type { EditorialUser } from "./editorial-auth-contract.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "./editorial-auth-state.js";

export const editorialSessionTokenKey = "bezny.demo.session-token.v1";
export const editorialSimulatedSessionKey = "bezny.demo.simulated-session.v1";
const sessionLifetime = 8 * 60 * 60 * 1000;
interface SimulatedSession {
  token: string;
  user: EditorialUser;
  expiresAt: number;
}
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
const parseSession = (value: unknown): SimulatedSession | null => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("token" in value) ||
    typeof value.token !== "string" ||
    !("expiresAt" in value) ||
    typeof value.expiresAt !== "number" ||
    !Number.isFinite(value.expiresAt) ||
    !("user" in value)
  ) {
    return null;
  }
  const user = parseEditorialUser(value.user);
  return user ? { expiresAt: value.expiresAt, token: value.token, user } : null;
};

/** Browser-only simulation. Tokens and mock session records are not real authentication. */
export const createEditorialAuthentication = (
  store: ReturnType<typeof createStore>
): EditorialAuthentication => {
  let storage = getSessionStorage();
  let session: SimulatedSession | null = null;
  let disposed = false;
  const persistSession = () => {
    try {
      if (session) {
        storage?.setItem(editorialSessionTokenKey, session.token);
        storage?.setItem(editorialSimulatedSessionKey, JSON.stringify(session));
      } else {
        storage?.removeItem(editorialSessionTokenKey);
        storage?.removeItem(editorialSimulatedSessionKey);
      }
    } catch {
      storage = null;
    }
  };
  const readSession = (): SimulatedSession | null => {
    if (!storage) {
      return session;
    }
    let token: string | null;
    let serialized: string | null;
    try {
      token = storage.getItem(editorialSessionTokenKey);
      serialized = storage.getItem(editorialSimulatedSessionKey);
    } catch {
      storage = null;
      return session;
    }
    if (!token || !serialized) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(serialized);
      const restored = parseSession(parsed);
      return restored?.token === token ? restored : null;
    } catch {
      return null;
    }
  };
  const clearSession = () => {
    session = null;
    persistSession();
    store.set(editorialUserAtom, null);
  };
  const activeSession = () => {
    session = readSession();
    if (!session || session.expiresAt <= Date.now()) {
      clearSession();
      throw new Error("Invalid or expired simulated session");
    }
    return session;
  };
  const simulate = async (action: () => void) => {
    await Promise.resolve();
    if (!disposed) {
      action();
    }
  };
  const signIn = (user: EditorialUser) => {
    session = {
      expiresAt: Date.now() + sessionLifetime,
      token: crypto.randomUUID(),
      user,
    };
    persistSession();
    store.set(editorialUserAtom, user);
    store.set(editorialSessionStatusAtom, "ready");
  };
  return {
    dispose: () => {
      disposed = true;
      store.set(editorialUserAtom, null);
    },
    logout: () => simulate(clearSession),
    restore: () =>
      simulate(() => {
        session = readSession();
        if (session && session.expiresAt > Date.now()) {
          store.set(editorialUserAtom, session.user);
        } else {
          clearSession();
        }
        store.set(editorialSessionStatusAtom, "ready");
      }),
    signIn: (credentials) =>
      simulate(() => {
        if (
          credentials.email.trim().toLowerCase() !== demoEditorialUser.email ||
          credentials.password !== demoPassword
        ) {
          throw new Error("Invalid demo credentials");
        }
        signIn({ ...demoEditorialUser });
      }),
    signInSocial: (provider) =>
      simulate(() => {
        signIn({
          email: `${provider}@example.com`,
          name: `${provider === "google" ? "Google" : "GitHub"} Editor`,
          provider,
        });
      }),
    updateAccount: (values) =>
      simulate(() => {
        const current = activeSession();
        const user = parseEditorialUser({ ...current.user, ...values });
        if (!user) {
          throw new Error("Invalid profile");
        }
        session = { ...current, user };
        persistSession();
        store.set(editorialUserAtom, user);
      }),
  };
};
