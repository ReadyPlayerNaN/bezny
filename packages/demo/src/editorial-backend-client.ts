import { createEditorialWorker } from "./editorial-backend-connection.js";
import {
  backendRequestTimeout,
  maxBackendRequests,
} from "./editorial-backend-protocol.js";
import type {
  EditorialBackendEvent,
  EditorialBackendOperation,
  EditorialBackendOperations,
  EditorialBackendResponse,
} from "./editorial-backend-protocol.js";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
}

export interface EditorialWorkerConnection {
  port: MessagePort;
  addEventListener: EventTarget["addEventListener"];
  removeEventListener: EventTarget["removeEventListener"];
}

export const createEditorialBackendClient = (
  worker: EditorialWorkerConnection = createEditorialWorker()
) => {
  const { port } = worker;
  const pending = new Map<number, PendingRequest>();
  const listeners = new Set<(event: EditorialBackendEvent) => void>();
  const errorListeners = new Set<(error: Error) => void>();
  const detachListeners: (() => void)[] = [];
  let nextId = 0;
  let closed: Error | null = null;
  const settle = (id: number, error: Error | null, value?: unknown) => {
    const request = pending.get(id);
    if (!request) {
      return;
    }
    pending.delete(id);
    request.cleanup();
    if (error) {
      request.reject(error);
    } else {
      request.resolve(value);
    }
  };
  const close = (error: Error, failed: boolean) => {
    if (closed) {
      return;
    }
    closed = error;
    try {
      port.postMessage({ type: "disconnect" });
    } catch {
      // A failed worker may already have closed its port.
    }
    for (const detach of detachListeners.splice(0)) {
      detach();
    }
    port.close();
    for (const id of pending.keys()) {
      settle(id, error);
    }
    if (failed) {
      for (const listener of errorListeners) {
        listener(error);
      }
    }
    listeners.clear();
    errorListeners.clear();
  };
  const connectionError = () =>
    close(
      new Error(
        "The demo SharedWorker connection failed. Reload to reconnect."
      ),
      true
    );
  const pageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      close(new Error("The demo page was closed."), false);
    }
  };
  const receive = (
    event: MessageEvent<
      EditorialBackendResponse | { type: "fatal"; message: string }
    >
  ) => {
    const message = event.data;
    if (!message || typeof message !== "object") {
      connectionError();
      return;
    }
    switch (message.type) {
      case "result": {
        settle(message.id, null, message.value);
        break;
      }
      case "error": {
        settle(message.id, new Error(message.message));
        break;
      }
      case "fatal": {
        close(new Error(message.message), true);
        break;
      }
      case "changed":
      case "session": {
        for (const listener of listeners) {
          listener(message);
        }
        break;
      }
      default: {
        connectionError();
      }
    }
  };
  detachListeners.push(
    () => port.removeEventListener("message", receive),
    () => port.removeEventListener("messageerror", connectionError),
    () => worker.removeEventListener("error", connectionError),
    () => window.removeEventListener("pagehide", pageHide)
  );
  port.addEventListener("message", receive);
  port.addEventListener("messageerror", connectionError);
  worker.addEventListener("error", connectionError);
  window.addEventListener("pagehide", pageHide);
  port.start();

  const request = <Operation extends EditorialBackendOperation>(
    operation: Operation,
    input: EditorialBackendOperations[Operation]["input"],
    signal?: AbortSignal
  ): Promise<EditorialBackendOperations[Operation]["output"]> => {
    if (closed) {
      return Promise.reject(closed);
    }
    if (signal?.aborted) {
      return Promise.reject(
        new DOMException("Backend request aborted.", "AbortError")
      );
    }
    if (pending.size >= maxBackendRequests) {
      return Promise.reject(
        new Error("Too many pending demo backend requests.")
      );
    }
    nextId += 1;
    const id = nextId;
    const { promise, resolve, reject } =
      Promise.withResolvers<EditorialBackendOperations[Operation]["output"]>();
    const abort = () => {
      settle(id, new DOMException("Backend request aborted.", "AbortError"));
      try {
        port.postMessage({ id, type: "cancel" });
      } catch {
        connectionError();
      }
    };
    const timeout = setTimeout(() => {
      close(
        new Error("The demo backend timed out. Reload to reconnect."),
        true
      );
    }, backendRequestTimeout);
    pending.set(id, {
      cleanup: () => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
      },
      reject,
      // The worker dispatches the matching operation; keep the wire cast at this boundary.
      resolve: (value) =>
        resolve(value as EditorialBackendOperations[Operation]["output"]),
    });
    signal?.addEventListener("abort", abort, { once: true });
    try {
      port.postMessage({ id, input, operation, type: "request" });
    } catch {
      connectionError();
    }
    return promise;
  };
  return {
    diagnostics: () => ({
      disposed: closed !== null,
      pendingRequests: pending.size,
    }),
    dispose: () =>
      close(new Error("The demo backend client was disposed."), false),
    onError: (listener: (error: Error) => void) => {
      if (closed) {
        listener(closed);
      } else {
        errorListeners.add(listener);
      }
      return () => {
        errorListeners.delete(listener);
      };
    },
    request,
    subscribe: (listener: (event: EditorialBackendEvent) => void) => {
      if (!closed) {
        listeners.add(listener);
      }
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
export type EditorialBackendClient = ReturnType<
  typeof createEditorialBackendClient
>;
