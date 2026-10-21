import { MessageChannel } from "node:worker_threads";

import { createEditorialBackendServer } from "../src/editorial-backend-server.js";

let backend = createEditorialBackendServer();
const ports: MessagePort[] = [];

/** jsdom has no workers. Exercise the real dispatcher across structured-cloning ports. */
export const connectTestWorker = () => {
  const channel = new MessageChannel();
  const client = channel.port1 as unknown as MessagePort;
  const server = channel.port2 as unknown as MessagePort;
  ports.push(client, server);
  backend.connect(server);
  return Object.assign(new EventTarget(), { port: client });
};

export const resetTestWorker = () => {
  backend.dispose();
  for (const port of ports.splice(0)) {
    port.close();
  }
  backend = createEditorialBackendServer();
};
