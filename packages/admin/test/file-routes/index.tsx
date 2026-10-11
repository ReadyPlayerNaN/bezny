import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    throw redirect({
      params: { entity: context.admin.registry.entities[0]?.key ?? "" },
      to: "/$entity",
    });
  },
});
