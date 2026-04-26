import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { buildPlanFromQc, type PlanStreamEvent } from "@/lib/dexter-api";

const PaperSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.string(),
  year: z.number(),
  abstract: z.string(),
  x: z.number(),
  y: z.number(),
  influence: z.number(),
});

const PlanSchema = z.object({
  hypothesis: z.string().trim().min(20).max(2500),
  metrics: z.array(z.string()).min(1),
  papers: z.array(PaperSchema).min(1),
  edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string(), weight: z.number() })),
  citations: z.array(z.string()),
  comments: z.array(z.string()),
  activity: z.array(z.string()),
});

const encoder = new TextEncoder();
const encodeEvent = (event: PlanStreamEvent) => encoder.encode(`${JSON.stringify(event)}\n`);

export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = PlanSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "QC payload is required before plan generation." }, { status: 400 });

        const plan = buildPlanFromQc(parsed.data);
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const message of plan.activity) {
              controller.enqueue(encodeEvent({ type: "activity", message }));
              await new Promise((resolve) => setTimeout(resolve, 260));
            }
            for (const section of plan.sections) {
              controller.enqueue(encodeEvent({ type: "section", section }));
              await new Promise((resolve) => setTimeout(resolve, 220));
            }
            controller.enqueue(encodeEvent({ type: "final", plan }));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});