import { createFileRoute } from "@tanstack/react-router";

import { FeedbackSchema } from "@/lib/schema";

export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = FeedbackSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ success: false, error: "Invalid feedback payload." }, { status: 400 });

        return Response.json({
          success: true,
          feedbackId: crypto.randomUUID(),
          fewShotEligible: parsed.data.used_as_few_shot,
        });
      },
    },
  },
});