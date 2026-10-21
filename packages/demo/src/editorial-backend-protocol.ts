import type { AdminListQuery, AdminListResult } from "@bezny/admin/adapters";

import type { EditorialUser } from "./editorial-auth-contract.js";
import { parseEditorialUser } from "./editorial-auth-contract.js";
import { parseEditorialValues } from "./editorial-records.js";
import type { EditorialRecord, EditorialValues } from "./editorial-records.js";

export interface EditorialSession {
  token: string;
  user: EditorialUser;
}
export interface EditorialBackendOperations {
  list: {
    input: { entity: string; query: AdminListQuery };
    output: AdminListResult<EditorialRecord>;
  };
  get: {
    input: { entity: string; id: string; locale: string };
    output: EditorialRecord | null;
  };
  create: {
    input: { entity: string; values: EditorialValues };
    output: EditorialRecord;
  };
  update: {
    input: { entity: string; id: string; values: EditorialValues };
    output: EditorialRecord;
  };
  remove: {
    input: { entity: string; ids: readonly string[] };
    output: undefined;
  };
  signIn: {
    input: { email: string; password: string; token: string | null };
    output: EditorialSession;
  };
  signInSocial: {
    input: { provider: "google" | "github"; token: string | null };
    output: EditorialSession;
  };
  restore: { input: { token: string | null }; output: EditorialSession | null };
  updateAccount: {
    input: { token: string | null; name: string; email: string };
    output: EditorialSession;
  };
  logout: { input: { token: string | null }; output: undefined };
}
export type EditorialBackendOperation = keyof EditorialBackendOperations;
export type EditorialBackendCommand = {
  [Operation in EditorialBackendOperation]: {
    operation: Operation;
    input: EditorialBackendOperations[Operation]["input"];
  };
}[EditorialBackendOperation];
export type EditorialBackendEvent =
  | { type: "changed"; entity: string }
  | { type: "session"; token: string; session: EditorialSession | null };
export type EditorialBackendResponse =
  | { type: "result"; id: number; value: unknown }
  | { type: "error"; id: number; message: string }
  | EditorialBackendEvent;
export const backendRequestTimeout = 10_000;
export const maxBackendRequests = 64;

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid backend request object.");
  }
  return value as Record<string, unknown>;
};
const text = (value: unknown, maximum = 200): string => {
  if (typeof value !== "string" || !value.length || value.length > maximum) {
    throw new Error("Invalid backend request text.");
  }
  return value;
};
const tokenValue = (value: unknown): string | null =>
  value === null ? null : text(value);
const entityValue = (value: unknown): string => {
  if (value !== "articles" && value !== "pages") {
    throw new Error("Unknown editorial dataset.");
  }
  return value;
};
const listQuery = (value: unknown): AdminListQuery => {
  const query = object(value);
  const filters = object(query.filters);
  if (
    typeof query.page !== "number" ||
    !Number.isSafeInteger(query.page) ||
    query.page < 1 ||
    typeof query.pageSize !== "number" ||
    !Number.isSafeInteger(query.pageSize) ||
    query.pageSize < 1 ||
    query.pageSize > 100 ||
    Object.keys(filters).some((key) => key !== "search" && key !== "status")
  ) {
    throw new Error("Invalid editorial list query.");
  }
  const parsedFilters: Record<string, string> = {};
  for (const [key, filter] of Object.entries(filters)) {
    if (typeof filter !== "string" || filter.length > 200) {
      throw new Error("Invalid editorial filter.");
    }
    parsedFilters[key] = filter;
  }
  return {
    filters: parsedFilters,
    locale: text(query.locale, 50),
    page: query.page,
    pageSize: query.pageSize,
  };
};

/** Treat messages as untrusted, even though this is only a same-origin simulation. */
export const parseBackendCommand = (
  value: unknown
): EditorialBackendCommand => {
  const command = object(value);
  const input = object(command.input);
  switch (command.operation) {
    case "list": {
      return {
        input: {
          entity: entityValue(input.entity),
          query: listQuery(input.query),
        },
        operation: "list",
      };
    }
    case "get": {
      return {
        input: {
          entity: entityValue(input.entity),
          id: text(input.id),
          locale: text(input.locale, 50),
        },
        operation: "get",
      };
    }
    case "create": {
      return {
        input: {
          entity: entityValue(input.entity),
          values: parseEditorialValues(input.values),
        },
        operation: "create",
      };
    }
    case "update": {
      return {
        input: {
          entity: entityValue(input.entity),
          id: text(input.id),
          values: parseEditorialValues(input.values),
        },
        operation: "update",
      };
    }
    case "remove": {
      if (!Array.isArray(input.ids) || input.ids.length > 200) {
        throw new Error("Invalid editorial record IDs.");
      }
      return {
        input: {
          entity: entityValue(input.entity),
          ids: input.ids.map((id: unknown) => text(id)),
        },
        operation: "remove",
      };
    }
    case "signIn": {
      return {
        input: {
          email: text(input.email),
          password: text(input.password),
          token: tokenValue(input.token),
        },
        operation: "signIn",
      };
    }
    case "signInSocial": {
      if (input.provider !== "google" && input.provider !== "github") {
        throw new Error("Unsupported simulated login provider.");
      }
      return {
        input: { provider: input.provider, token: tokenValue(input.token) },
        operation: "signInSocial",
      };
    }
    case "restore":
    case "logout": {
      return {
        input: { token: tokenValue(input.token) },
        operation: command.operation,
      };
    }
    case "updateAccount": {
      const user = parseEditorialUser({
        email: text(input.email),
        name: text(input.name),
        provider: "email",
      });
      if (!user) {
        throw new Error("Invalid profile.");
      }
      return {
        input: {
          email: user.email,
          name: user.name,
          token: tokenValue(input.token),
        },
        operation: "updateAccount",
      };
    }
    default: {
      throw new Error("Unknown backend operation.");
    }
  }
};
