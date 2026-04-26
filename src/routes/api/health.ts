import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          checks: {
            openai_key: Boolean(process.env.OPENAI_API_KEY),
            tavily_key: Boolean(process.env.TAVILY_API_KEY),
            supabase: Boolean(process.env.SUPABASE_URL),
            catalog_loaded: 5,
            protocols_loaded: 3,
          },
        }),
    },
  },
});