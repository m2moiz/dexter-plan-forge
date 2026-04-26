import { createFileRoute } from "@tanstack/react-router";

import { buildLiteratureGraph } from "@/lib/dexter-api";

export const Route = createFileRoute("/api/literature/graph")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const hypothesis = url.searchParams.get("hypothesis") ?? "experimental design";
        return Response.json(buildLiteratureGraph(hypothesis));
      },
    },
  },
});