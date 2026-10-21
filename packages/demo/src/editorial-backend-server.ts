import {
  maxBackendRequests,
  parseBackendCommand,
} from "./editorial-backend-protocol.js";
import type {
  EditorialBackendCommand,
  EditorialBackendEvent,
  EditorialBackendResponse,
} from "./editorial-backend-protocol.js";
import { createEditorialRepository } from "./editorial-backend-repository.js";
import { createBackendSessions } from "./editorial-backend-sessions.js";

const maxConnections = 128;

/** One instance per worker, not per port: every tab uses the same datasets and sessions. */
export const createEditorialBackendServer = () => {
  const repository = createEditorialRepository();
  const connections = new Map<MessagePort, () => void>();
  const send = (port: MessagePort, message: EditorialBackendResponse) => {
    try {
      port.postMessage(message);
    } catch {
      connections.get(port)?.();
    }
  };
  const publish = (event: EditorialBackendEvent, except?: MessagePort) => {
    for (const port of connections.keys()) {
      if (port !== except) {
        send(port, event);
      }
    }
  };
  const sessions = createBackendSessions(publish);
  const execute = async (
    command: EditorialBackendCommand,
    signal: AbortSignal,
    port: MessagePort
  ): Promise<unknown> => {
    signal.throwIfAborted();
    const { input } = command;
    if ("entity" in input) {
      const adapter = repository.adapter(input.entity);
      switch (command.operation) {
        case "list": {
          return await adapter.list(command.input.query, { signal });
        }
        case "get": {
          return await adapter.get(command.input.id, {
            locale: command.input.locale,
            signal,
          });
        }
        case "create": {
          const record = await adapter.create?.(command.input.values, {
            signal,
          });
          publish({ entity: input.entity, type: "changed" }, port);
          return record;
        }
        case "update": {
          const record = await adapter.update?.(
            command.input.id,
            command.input.values,
            { signal }
          );
          publish({ entity: input.entity, type: "changed" }, port);
          return record;
        }
        case "remove": {
          await adapter.remove?.(command.input.ids, { signal });
          publish({ entity: input.entity, type: "changed" }, port);
          return;
        }
        default: {
          throw new Error("Invalid record operation.");
        }
      }
    }
    switch (command.operation) {
      case "signIn": {
        return sessions.signIn(
          command.input.email,
          command.input.password,
          command.input.token
        );
      }
      case "signInSocial": {
        return sessions.signInSocial(
          command.input.provider,
          command.input.token
        );
      }
      case "restore": {
        return sessions.restore(command.input.token);
      }
      case "updateAccount": {
        return sessions.update(command.input.token, command.input);
      }
      case "logout": {
        sessions.logout(command.input.token);
        return;
      }
      default: {
        throw new Error("Invalid session operation.");
      }
    }
  };
  const connect = (port: MessagePort) => {
    if (connections.size >= maxConnections) {
      port.postMessage({
        message: "Too many demo backend connections.",
        type: "fatal",
      });
      port.close();
      return;
    }
    const pending = new Map<number, AbortController>();
    const detachListeners: (() => void)[] = [];
    const disconnect = () => {
      connections.delete(port);
      for (const detach of detachListeners.splice(0)) {
        detach();
      }
      for (const controller of pending.values()) {
        controller.abort();
      }
      pending.clear();
      port.close();
    };
    const handle = async (id: number, data: unknown) => {
      if (pending.has(id) || pending.size >= maxBackendRequests) {
        send(port, {
          id,
          message: "Too many or duplicate backend requests.",
          type: "error",
        });
        return;
      }
      const controller = new AbortController();
      pending.set(id, controller);
      try {
        const command = parseBackendCommand(data);
        const value = await execute(command, controller.signal, port);
        if (!controller.signal.aborted) {
          send(port, { id, type: "result", value });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          send(port, {
            id,
            message:
              error instanceof Error
                ? error.message
                : "Backend request failed.",
            type: "error",
          });
        }
      } finally {
        pending.delete(id);
      }
    };
    const receive = (event: MessageEvent<unknown>) => {
      const { data } = event;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type === "disconnect") {
        disconnect();
        return;
      }
      if (
        !("id" in data) ||
        typeof data.id !== "number" ||
        !Number.isSafeInteger(data.id) ||
        data.id < 1
      ) {
        return;
      }
      if (data.type === "cancel") {
        pending.get(data.id)?.abort();
      } else if (data.type === "request") {
        void handle(data.id, data);
      }
    };
    detachListeners.push(
      () => port.removeEventListener("message", receive),
      () => port.removeEventListener("messageerror", disconnect),
      () => port.removeEventListener("close", disconnect)
    );
    connections.set(port, disconnect);
    port.addEventListener("message", receive);
    port.addEventListener("messageerror", disconnect);
    port.addEventListener("close", disconnect);
    port.start();
  };
  return {
    connect,
    dispose: () => {
      for (const disconnect of connections.values()) {
        disconnect();
      }
      repository.dispose();
    },
  };
};
