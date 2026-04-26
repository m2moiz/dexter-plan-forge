I’ll address the frontend-spec feedback by replacing the current mock-only flow with a real API-driven flow, while keeping the existing Dexter UI interactions and the required TanStack Start project structure.

## Important note about the “Next.js app structure” feedback

This Lovable project is intentionally a TanStack Start/Vite app, not a Next.js app. I should not convert it to Next.js inside this environment because the project’s runtime, routing, and deployment are TanStack-based. Instead, I’ll make the frontend behave according to the spec at the API/data-flow level:

```text
Hypothesis input
  -> POST /api/qc
  -> literature graph / QC results
  -> POST /api/plan streaming
  -> report view with generated plan
```

## Implementation plan

1. **Add client-safe API types and response normalization**
   - Define shared TypeScript types for QC and plan responses.
   - Add adapters that can map API payloads into the existing `DexterPlan` UI model.
   - Keep `samplePlan` only as a local fallback/demo response, not as the primary runtime source.

2. **Implement `/api/qc` route**
   - Add a TanStack server route at `src/routes/api/qc.ts`.
   - Validate input with Zod: hypothesis text, length bounds, required body shape.
   - Return literature graph data, candidate papers, edges, and QC/status information.
   - If no real backend/LLM integration is configured yet, use a deterministic fallback generated from the hypothesis so the frontend no longer reads directly from static client data.

3. **Implement streaming `/api/plan` route**
   - Add a TanStack server route at `src/routes/api/plan.ts`.
   - Validate request input.
   - Return a streaming response, likely newline-delimited JSON events, for generation progress and final plan data.
   - Emit events such as:

```text
{ "type": "activity", "message": "Searching literature..." }
{ "type": "section", "section": { ... } }
{ "type": "final", "plan": { ... } }
```

4. **Refactor the Zustand store from mock state to API lifecycle state**
   - Add fields like `qcStatus`, `planStatus`, `apiError`, and streamed `activity`.
   - Add actions to start QC, store graph results, start plan generation, append streamed events, and commit the final plan.
   - Preserve the existing UI state you requested earlier: hypothesis text, visited/bookmarked nodes, selected paper, report highlights, and queued corrections.

5. **Wire hypothesis submission to `/api/qc`**
   - Change the “GENERATE PLAN” button so it posts the current hypothesis to `/api/qc`.
   - Show a loading/error state instead of immediately jumping to the mock graph.
   - Populate the graph from the QC response, then navigate to the literature graph screen.

6. **Wire plan generation to streaming `/api/plan`**
   - Change “Continue to Plan” so it starts a streaming request to `/api/plan`.
   - Update the generation screen in real time from stream events instead of the hardcoded timer over `samplePlan.activity`.
   - Move to report view when the final plan event arrives.
   - Keep a safe fallback if the stream fails, with a visible retry path.

7. **Keep report interactions working with generated data**
   - Ensure the report view, squiggly highlights, right-click “Make adjustment,” queued corrections, hover editor, PDF export, references, and slime/blob section launcher work with generated plan sections and citations.

8. **Verification**
   - Run TypeScript/build checks.
   - Manually verify the main flow:
     - enter hypothesis
     - call QC
     - inspect graph
     - bookmark/read nodes
     - stream plan
     - report loads
     - annotations/corrections still work
     - back navigation preserves state

## Technical notes

- Files likely touched:
  - `src/routes/index.tsx`
  - `src/lib/dexter-store.ts`
  - `src/lib/mock-plan.ts` or new adapter/types files under `src/lib/`
  - new `src/routes/api/qc.ts`
  - new `src/routes/api/plan.ts`
- I’ll use TanStack server routes, not Supabase Edge Functions or Next.js API routes.
- I’ll avoid changing the route bootstrap files unless required for build compatibility.
- The API route implementations will be written so they can later be swapped from deterministic fallback logic to a real backend/AI provider without rewriting the frontend workflow.