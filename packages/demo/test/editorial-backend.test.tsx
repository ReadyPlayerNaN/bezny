import { MessageChannel } from "node:worker_threads";

import { createMemoryHistory } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDemoApplication } from "../src/demo-application.js";
import { createEditorialBackendClient } from "../src/editorial-backend-client.js";
import {
  backendRequestTimeout,
  maxBackendRequests,
} from "../src/editorial-backend-protocol.js";
import { createEditorialRepositoryClient } from "../src/editorial-repository-client.js";
import { connectTestWorker } from "./editorial-worker-environment.js";

const clients: ReturnType<typeof createEditorialBackendClient>[] = [];
const client = () => {
  const backend = createEditorialBackendClient();
  clients.push(backend);
  return backend;
};
const query = { filters: {}, locale: "en", page: 1, pageSize: 100 };
const values = {
  body: "Shared body",
  published: false,
  title: "Shared article",
};
const dormantConnection = () => {
  const channel = new MessageChannel();
  const connection = Object.assign(new EventTarget(), {
    port: channel.port1 as unknown as MessagePort,
  });
  return { connection, serverPort: channel.port2 };
};

describe("shared editorial backend transport", () => {
  afterEach(() => {
    for (const backend of clients.splice(0)) {
      backend.dispose();
    }
    vi.useRealTimers();
  });

  it("shares CRUD between clients, clones results, and survives a client disconnect", async () => {
    const first = client();
    const second = client();
    const created = await first.request("create", {
      entity: "articles",
      values,
    });
    created.title = "Client-only edit";
    const fetched = await second.request("get", {
      entity: "articles",
      id: created.id,
      locale: "en",
    });
    expect(fetched?.title).toBe(values.title);
    await second.request("update", {
      entity: "articles",
      id: created.id,
      values: { ...values, title: "Updated" },
    });
    first.dispose();
    const reconnected = client();
    const list = await reconnected.request("list", {
      entity: "articles",
      query,
    });
    expect(list.items.find((record) => record.id === created.id)?.title).toBe(
      "Updated"
    );
    await second.request("remove", { entity: "articles", ids: [created.id] });
    await expect(
      reconnected.request("get", {
        entity: "articles",
        id: created.id,
        locale: "en",
      })
    ).resolves.toBeNull();
  });

  it("correlates concurrent replies and retains server-side filters, pagination and localization", async () => {
    const backend = client();
    const records = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        backend.request("create", {
          entity: "articles",
          values: { ...values, title: `Record ${index}` },
        })
      )
    );
    expect(new Set(records.map((record) => record.id)).size).toBe(10);
    expect(records.map((record) => record.title)).toStrictEqual(
      Array.from({ length: 10 }, (_, index) => `Record ${index}`)
    );
    const page = await backend.request("list", {
      entity: "articles",
      query: {
        ...query,
        filters: { search: "Record", status: "draft" },
        page: 2,
        pageSize: 3,
      },
    });
    expect({
      titles: page.items.map((record) => record.title),
      total: page.total,
    }).toStrictEqual({
      titles: ["Record 3", "Record 4", "Record 5"],
      total: 10,
    });
    const localized = await backend.request("get", {
      entity: "articles",
      id: "1",
      locale: "cs",
    });
    expect(localized?.title).toBe("Vítejte v Bezny");
    expect(backend.diagnostics().pendingRequests).toBe(0);
  });

  it("delivers entity invalidations to other clients and unsubscribes on abort", async () => {
    const first = client();
    const second = client();
    const observer = {
      onChange: vi.fn<() => void>(),
      onError: vi.fn<(error: unknown) => void>(),
    };
    const controller = new AbortController();
    const repository = createEditorialRepositoryClient(second, vi.fn());
    const unsubscribe = repository
      .adapter("articles")
      .subscribe?.(observer, { signal: controller.signal });
    await first.request("create", { entity: "pages", values });
    await first.request("create", { entity: "articles", values });
    await vi.waitFor(() =>
      expect(observer.onChange).toHaveBeenCalledExactlyOnceWith()
    );
    controller.abort();
    unsubscribe?.();
    await first.request("create", { entity: "articles", values });
    await second.request("list", { entity: "articles", query });
    expect(observer.onChange).toHaveBeenCalledOnce();
  });

  it("refreshes another application's active data through admin subscriptions", async () => {
    const first = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    const second = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    try {
      await Promise.all([
        first.authenticationReady,
        second.authenticationReady,
      ]);
      await second.session.activate({
        entity: "articles",
        query,
        view: "list",
      });
      await first.session.create("articles", values);
      await vi.waitFor(() => {
        const snapshot = second.store.get(second.session.snapshotAtom);
        expect(snapshot.total).toBe(4);
      });
      first.dispose();
      await second.session.refresh();
      expect(second.store.get(second.session.snapshotAtom).total).toBe(4);
    } finally {
      first.dispose();
      second.dispose();
    }
  });

  it("returns validation errors across the port without poisoning later requests", async () => {
    const backend = client();
    await expect(
      backend.request("create", {
        entity: "articles",
        values: { ...values, title: "x".repeat(201) },
      })
    ).rejects.toThrow("length limit");
    await expect(
      backend.request("list", {
        entity: "articles",
        query: { ...query, pageSize: 101 },
      })
    ).rejects.toThrow("list query");
    await expect(
      backend.request("get", { entity: "unknown", id: "1", locale: "en" })
    ).rejects.toThrow("dataset");
    const list = await backend.request("list", { entity: "articles", query });
    expect(list.total).toBe(3);
  });

  it("does not send pre-aborted mutations and drops late replies after cancellation", async () => {
    const backend = client();
    const aborted = AbortSignal.abort();
    await expect(
      backend.request("create", { entity: "articles", values }, aborted)
    ).rejects.toMatchObject({ name: "AbortError" });
    const controller = new AbortController();
    const pending = backend.request(
      "list",
      { entity: "articles", query },
      controller.signal
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const list = await backend.request("list", { entity: "articles", query });
    expect(list.total).toBe(3);
    expect(backend.diagnostics().pendingRequests).toBe(0);
  });

  it("rejects pending work on disposal and prevents new requests", async () => {
    const backend = client();
    const pending = backend.request("list", { entity: "articles", query });
    backend.dispose();
    backend.dispose();
    await expect(pending).rejects.toThrow("disposed");
    await expect(
      backend.request("list", { entity: "articles", query })
    ).rejects.toThrow("disposed");
    expect(backend.diagnostics()).toStrictEqual({
      disposed: true,
      pendingRequests: 0,
    });
  });

  it("bounds pending work and fails a stalled connection without retrying mutations", async () => {
    vi.useFakeTimers();
    const { connection, serverPort } = dormantConnection();
    const backend = createEditorialBackendClient(connection);
    clients.push(backend);
    const observer = vi.fn<(error: Error) => void>();
    backend.onError(observer);
    const pending = Array.from({ length: maxBackendRequests }, () =>
      backend.request("list", { entity: "articles", query })
    );
    const settled = Promise.allSettled(pending);
    await expect(
      backend.request("list", { entity: "articles", query })
    ).rejects.toThrow("Too many pending");
    await vi.advanceTimersByTimeAsync(backendRequestTimeout);
    const results = await settled;
    expect(
      results.every((result) => result.status === "rejected")
    ).toBeTruthy();
    expect(observer).toHaveBeenCalledOnce();
    expect(backend.diagnostics()).toStrictEqual({
      disposed: true,
      pendingRequests: 0,
    });
    serverPort.close();
  });

  it("surfaces worker failures and releases pending requests", async () => {
    const worker = connectTestWorker();
    const backend = createEditorialBackendClient(worker);
    clients.push(backend);
    const pending = backend.request("list", { entity: "articles", query });
    worker.dispatchEvent(new Event("error"));
    await expect(pending).rejects.toThrow("connection failed");
    expect(backend.diagnostics().pendingRequests).toBe(0);
  });
});
