import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { buildQcResponse } from "@/lib/dexter-api";

const QcSchema = z.object({
  hypothesis: z.string().trim().min(20).max(2500),
});

export const Route = createFileRoute("/api/qc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = QcSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Please provide a detailed hypothesis before running QC." }, { status: 400 });
        }

        return Response.json(buildQcResponse(parsed.data.hypothesis));
      },
    },
  },
});