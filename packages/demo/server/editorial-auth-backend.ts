import { randomUUID } from "node:crypto";

import {
  demoEditorialUser,
  demoPassword,
  editorialSessionEndpoint,
} from "../src/editorial-auth-contract.js";
import type { EditorialUser } from "../src/editorial-auth-contract.js";

interface BackendSession {
  user: EditorialUser;
  expiresAt: number;
}
const sessionLifetime = 8 * 60 * 60 * 1000;
const maximumSessions = 200;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { headers: { "Cache-Control": "no-store" }, status });
const readBody = async (
  request: Request
): Promise<Record<string, unknown> | null> => {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};
const emailIdentity = (
  body: Record<string, unknown> | null
): EditorialUser | null => {
  if (
    typeof body?.email !== "string" ||
    body.email.trim().toLowerCase() !== demoEditorialUser.email ||
    body.password !== demoPassword
  ) {
    return null;
  }
  return { ...demoEditorialUser };
};
const socialIdentity = (
  body: Record<string, unknown> | null
): EditorialUser | null => {
  if (body?.provider !== "google" && body?.provider !== "github") {
    return null;
  }
  return {
    email: `${body.provider}@example.com`,
    name: `${body.provider === "google" ? "Google" : "GitHub"} Editor`,
    provider: body.provider,
  };
};
const updateProfile = async (request: Request, session: BackendSession) => {
  const body = await readBody(request);
  if (
    typeof body?.name !== "string" ||
    !body.name.trim() ||
    body.name.length > 200 ||
    typeof body.email !== "string" ||
    body.email.length > 200 ||
    !emailPattern.test(body.email.trim())
  ) {
    return jsonResponse({ error: "Invalid profile" }, 400);
  }
  session.user = {
    ...session.user,
    email: body.email.trim(),
    name: body.name.trim(),
  };
  return jsonResponse({ user: session.user });
};

/** Demo backend only: fixed credentials and simulated social identities, not OAuth. */
export const createEditorialAuthBackend = (now: () => number = Date.now) => {
  const sessions = new Map<string, BackendSession>();
  const issueSession = (user: EditorialUser | null) => {
    if (!user) {
      return jsonResponse({ error: "Invalid credentials or provider" }, 401);
    }
    if (sessions.size >= maximumSessions) {
      return jsonResponse({ error: "Too many demo sessions" }, 429);
    }
    const token = randomUUID();
    sessions.set(token, { expiresAt: now() + sessionLifetime, user });
    return jsonResponse({ token, user });
  };
  return async (request: Request): Promise<Response> => {
    for (const [token, session] of sessions) {
      if (session.expiresAt <= now()) {
        sessions.delete(token);
      }
    }
    const path = new URL(request.url).pathname;
    if (
      request.method === "POST" &&
      path === `${editorialSessionEndpoint}/email`
    ) {
      return issueSession(emailIdentity(await readBody(request)));
    }
    if (
      request.method === "POST" &&
      path === `${editorialSessionEndpoint}/social`
    ) {
      return issueSession(socialIdentity(await readBody(request)));
    }
    if (path !== editorialSessionEndpoint) {
      return jsonResponse({ error: "Not found" }, 404);
    }
    const authorization = request.headers.get("Authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";
    const session = sessions.get(token);
    if (!session) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }
    if (request.method === "GET") {
      return jsonResponse({ user: session.user });
    }
    if (request.method === "DELETE") {
      sessions.delete(token);
      return new Response(null, {
        headers: { "Cache-Control": "no-store" },
        status: 204,
      });
    }
    if (request.method === "PATCH") {
      return await updateProfile(request, session);
    }
    return jsonResponse({ error: "Method not allowed" }, 405);
  };
};
