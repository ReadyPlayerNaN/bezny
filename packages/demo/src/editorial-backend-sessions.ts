import { demoEditorialUser, demoPassword } from "./editorial-auth-contract.js";
import type { EditorialUser } from "./editorial-auth-contract.js";
import type {
  EditorialBackendEvent,
  EditorialSession,
} from "./editorial-backend-protocol.js";

const sessionLifetime = 8 * 60 * 60 * 1000;
const maxSessions = 128;

/** Tokens resolve only against worker memory; browser-stored identities are never trusted. */
export const createBackendSessions = (
  publish: (event: EditorialBackendEvent) => void
) => {
  const sessions = new Map<string, EditorialSession & { expiresAt: number }>();
  const remove = (token: string | null) => {
    if (token && sessions.delete(token)) {
      publish({ session: null, token, type: "session" });
    }
  };
  const restore = (token: string | null): EditorialSession | null => {
    const session = token ? sessions.get(token) : undefined;
    if (!session) {
      return null;
    }
    if (session.expiresAt <= Date.now()) {
      remove(token);
      return null;
    }
    return { token: session.token, user: { ...session.user } };
  };
  const signIn = (
    user: EditorialUser,
    previous: string | null
  ): EditorialSession => {
    for (const token of sessions.keys()) {
      restore(token);
    }
    remove(previous);
    if (sessions.size >= maxSessions) {
      throw new Error("The simulated backend session limit has been reached.");
    }
    const session = { token: crypto.randomUUID(), user };
    sessions.set(session.token, {
      ...session,
      expiresAt: Date.now() + sessionLifetime,
    });
    return session;
  };
  return {
    logout: remove,
    restore,
    signIn: (email: string, password: string, previous: string | null) => {
      if (
        email.trim().toLowerCase() !== demoEditorialUser.email ||
        password !== demoPassword
      ) {
        throw new Error("Invalid demo credentials");
      }
      return signIn({ ...demoEditorialUser }, previous);
    },
    signInSocial: (provider: "google" | "github", previous: string | null) =>
      signIn(
        {
          email: `${provider}@example.com`,
          name: `${provider === "google" ? "Google" : "GitHub"} Editor`,
          provider,
        },
        previous
      ),
    update: (
      token: string | null,
      values: Pick<EditorialUser, "email" | "name">
    ) => {
      const session = restore(token);
      if (!session) {
        throw new Error("Invalid or expired simulated session");
      }
      const updated = {
        ...session,
        user: { ...session.user, email: values.email, name: values.name },
      };
      const existing = sessions.get(session.token);
      if (!existing) {
        throw new Error("Invalid or expired simulated session");
      }
      sessions.set(session.token, {
        ...updated,
        expiresAt: existing.expiresAt,
      });
      publish({ session: updated, token: session.token, type: "session" });
      return updated;
    },
  };
};
