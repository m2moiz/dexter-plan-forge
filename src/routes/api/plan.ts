import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { buildPlanFromSpecRequest, experimentPlanToDexterPlan, type PlanStreamEvent } from "@/lib/dexter-api";
import { NoveltyCheck, SourceCitation } from "@/lib/schema";

const PlanSchema = z.object({
  hypothesis: z.string().trim().min(20).max(2500),
  novelty_check: NoveltyCheck.optional(),
  qc_sources: z.array(SourceCitation).optional(),
});

const encoder = new TextEncoder();
const encodeEvent = (event: PlanStreamEvent) => encoder.encode(`${JSON.stringify(event)}\n`);

export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = PlanSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "QC payload is required before plan generation." }, { status: 400 });

        const planId = crypto.randomUUID();
        const plan = buildPlanFromSpecRequest(parsed.data);
        const dexterPlan = experimentPlanToDexterPlan(plan);
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const message of dexterPlan.activity) {
              controller.enqueue(encodeEvent({ type: "activity", message }));
              await new Promise((resolve) => setTimeout(resolve, 260));
            }
            for (const section of dexterPlan.sections) {
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
            "X-Plan-Id": planId,
          },
        });
      },
    },
  },
});