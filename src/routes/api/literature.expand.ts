import { createFileRoute } from "@tanstack/react-router";

import { expandLiteraturePaper } from "@/lib/dexter-api";

export const Route = createFileRoute("/api/literature/expand")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const paperId = url.searchParams.get("paper_id") ?? "PAPER-001";
        return Response.json(expandLiteraturePaper(paperId));
      },
    },
  },
});