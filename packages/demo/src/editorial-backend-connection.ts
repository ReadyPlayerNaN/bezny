/** Vite bundles this module worker into a separate production asset. No main-thread fallback. */
export const createEditorialWorker = () => {
  if (typeof SharedWorker === "undefined") {
    throw new TypeError(
      "This demo requires a browser with SharedWorker support."
    );
  }
  return new SharedWorker(
    new URL("editorial-backend.worker.ts", import.meta.url),
    {
      name: "bezny-editorial-backend-v1",
      type: "module",
    }
  );
};
