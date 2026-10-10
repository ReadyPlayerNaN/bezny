import type { IncomingMessage, ServerResponse } from "node:http";

import type { Plugin, PreviewServer, ViteDevServer } from "vite";

import { editorialSessionEndpoint } from "../src/editorial-auth-contract.js";
import { createEditorialAuthBackend } from "./editorial-auth-backend.js";

const maximumRequestBytes = 8192;
export const editorialAuthPlugin = (): Plugin => {
  const handleRequest = createEditorialAuthBackend();
  const serveRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    url: URL
  ) => {
    try {
      request.setEncoding("utf-8");
      let body = "";
      for await (const chunk of request) {
        if (typeof chunk === "string") {
          body += chunk;
        }
        if (Buffer.byteLength(body) > maximumRequestBytes) {
          response.statusCode = 413;
          response.end();
          return;
        }
      }
      const result = await handleRequest(
        new Request(url, {
          headers: {
            Authorization: request.headers.authorization ?? "",
            "Content-Type": "application/json",
          },
          method: request.method ?? "GET",
          ...(body ? { body } : {}),
        })
      );
      response.statusCode = result.status;
      for (const [name, value] of result.headers) {
        response.setHeader(name, value);
      }
      response.end(await result.text());
    } catch {
      response.statusCode = 500;
      response.end();
    }
  };
  const installBackend = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (
        url.pathname !== editorialSessionEndpoint &&
        !url.pathname.startsWith(`${editorialSessionEndpoint}/`)
      ) {
        next();
        return;
      }
      void serveRequest(request, response, url);
    });
  };
  return {
    configurePreviewServer: installBackend,
    configureServer: installBackend,
    name: "bezny-demo-auth",
  };
};
