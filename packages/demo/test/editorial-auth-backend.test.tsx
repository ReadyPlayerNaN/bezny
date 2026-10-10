import { describe, expect, it } from "vitest";

import { createEditorialAuthBackend } from "../server/editorial-auth-backend.js";

const requestSession = (
  method: string,
  token?: string,
  body?: unknown,
  path = ""
) =>
  new Request(`http://localhost/api/session${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const readToken = async (response: Response) => {
  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("token" in result) ||
    typeof result.token !== "string"
  ) {
    throw new Error("Session response did not contain a token");
  }
  return result.token;
};

describe("editorial demo authentication backend", () => {
  it("verifies credentials on the backend and rejects missing or fabricated tokens", async () => {
    const backend = createEditorialAuthBackend();
    const wrong = await backend(
      requestSession(
        "POST",
        undefined,
        { email: "editor@example.com", password: "wrong" },
        "/email"
      )
    );
    const missing = await backend(requestSession("GET"));
    const fabricated = await backend(requestSession("GET", "fabricated"));
    expect([wrong.status, missing.status, fabricated.status]).toStrictEqual([
      401, 401, 401,
    ]);
    const signedIn = await backend(
      requestSession(
        "POST",
        undefined,
        { email: "editor@example.com", password: "bezny-demo" },
        "/email"
      )
    );
    const token = await readToken(signedIn);
    const session = await backend(requestSession("GET", token));
    await expect(session.json()).resolves.toStrictEqual({
      user: {
        email: "editor@example.com",
        name: "Demo Editor",
        provider: "email",
      },
    });
    expect(session.headers.get("Cache-Control")).toBe("no-store");
  });

  it("updates profiles server-side and invalidates tokens on logout", async () => {
    const backend = createEditorialAuthBackend();
    const token = await readToken(
      await backend(
        requestSession("POST", undefined, { provider: "github" }, "/social")
      )
    );
    const invalid = await backend(
      requestSession("PATCH", token, { email: "invalid", name: "Ada" })
    );
    expect(invalid.status).toBe(400);
    await backend(
      requestSession("PATCH", token, {
        email: "ada@example.com",
        name: "Ada Lovelace",
        provider: "email",
      })
    );
    const restored = await backend(requestSession("GET", token));
    await expect(restored.json()).resolves.toStrictEqual({
      user: {
        email: "ada@example.com",
        name: "Ada Lovelace",
        provider: "github",
      },
    });
    const logout = await backend(requestSession("DELETE", token));
    expect(logout.status).toBe(204);
    const revoked = await backend(requestSession("GET", token));
    expect(revoked.status).toBe(401);
  });

  it("expires sessions and does not accept tokens from a previous backend instance", async () => {
    let now = 0;
    const backend = createEditorialAuthBackend(() => now);
    const token = await readToken(
      await backend(
        requestSession("POST", undefined, { provider: "google" }, "/social")
      )
    );
    const active = await backend(requestSession("GET", token));
    expect(active.status).toBe(200);
    now = 8 * 60 * 60 * 1000;
    const expired = await backend(requestSession("GET", token));
    expect(expired.status).toBe(401);
    const restarted = createEditorialAuthBackend();
    const stale = await restarted(requestSession("GET", token));
    expect(stale.status).toBe(401);
  });
});
