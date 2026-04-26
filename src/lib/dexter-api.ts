import { samplePlan, type DexterPlan, type Paper, type PlanSection } from "./mock-plan";
import type { ExperimentPlan, LiteratureGraphType, LiteraturePaperType, NoveltyCheckType, SourceCitationType } from "./schema";

export type QcRequest = { hypothesis: string };
export type QcResponse = { novelty_check: NoveltyCheckType; sources: SourceCitationType[] };
export type PlanRequest = { hypothesis: string; novelty_check?: NoveltyCheckType; qc_sources?: SourceCitationType[] };
export type PlanStreamEvent =
  | { type: "activity"; message: string }
  | { type: "section"; section: PlanSection }
  | { type: "experiment_plan"; field: keyof ExperimentPlan; value: unknown }
  | { type: "final"; plan: ExperimentPlan }
  | { type: "error"; message: string };

const sourceUrls = [
  "https://pubmed.ncbi.nlm.nih.gov/11552972/",
  "https://pubmed.ncbi.nlm.nih.gov/10634990/",
  "https://pubmed.ncbi.nlm.nih.gov/14609627/",
  "https://www.thermofisher.com/order/catalog/product/11965092",
  "https://www.sigmaaldrich.com/US/en/product/sigma/t0167",
  "https://www.atcc.org/products/ccl-2",
  "https://www.promega.com/products/cell-health-assays/cell-viability-and-cytotoxicity-assays/celltiter-glo-luminescent-cell-viability-assay/",
  "https://www.protocols.io/",
];

const extractKeywords = (hypothesis: string) =>
  hypothesis.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((word) => word.length > 4).slice(0, 6);

const makeSources = (hypothesis: string): SourceCitationType[] => {
  const topic = extractKeywords(hypothesis).slice(0, 3).join(" ") || "experimental design";
  return samplePlan.citations.slice(0, 4).map((citation, index) => ({
    id: `SRC-${String(index + 1).padStart(3, "0")}`,
    kind: index === 3 ? "supplier_catalog" : "paper",
    title: citation.replace(/^[^—]+—\s*/, ""),
    url: sourceUrls[index],
    doi: index < 3 ? `10.1000/dexter.${index + 1}` : null,
    year: samplePlan.papers[index]?.year ?? null,
    excerpt: `Relevant source excerpt supporting ${topic}: ${samplePlan.papers[index]?.abstract ?? citation}`,
  }));
};

export function buildQcResponse(hypothesis: string): QcResponse {
  const sources = makeSources(hypothesis);
  return {
    novelty_check: {
      status: "similar_exists",
      summary: "Related work exists, but the exact operational protocol and measurable threshold remain sufficiently distinct for a useful experiment plan.",
      citation_ids: sources.slice(0, 3).map((source) => source.id),
    },
    sources,
  };
}

export const planToQcResponse = buildQcResponse;

export function buildLiteratureGraph(hypothesis: string): LiteratureGraphType {
  const papers = samplePlan.papers.map((paper, index) => ({
    id: `PAPER-${String(index + 1).padStart(3, "0")}`,
    title: paper.title,
    authors: paper.authors.split(", "),
    year: paper.year,
    source: "paper",
    url: sourceUrls[index % sourceUrls.length],
    doi: `10.1000/dexter.paper.${index + 1}`,
    abstract_snippet: paper.abstract,
    relevance_score: paper.influence,
    is_seed: index < 4,
    edges: samplePlan.edges
      .filter((edge) => edge.source === paper.id)
      .map((edge) => ({
        to_paper_id: `PAPER-${String(Number(edge.target.replace("p", ""))).padStart(3, "0")}`,
        relationship: edge.weight > 0.8 ? "extends" : "similar_topic",
        strength: edge.weight,
      })),
  })) satisfies LiteraturePaperType[];

  return { query: hypothesis, papers, generated_at: new Date().toISOString() };
}

export function expandLiteraturePaper(paperId: string): LiteraturePaperType[] {
  return samplePlan.papers.slice(0, 3).map((paper, index) => ({
    id: `${paperId}-EXP-${index + 1}`,
    title: `${paper.title} — neighbor ${index + 1}`,
    authors: paper.authors.split(", "),
    year: paper.year,
    source: "paper",
    url: sourceUrls[(index + 2) % sourceUrls.length],
    doi: null,
    abstract_snippet: paper.abstract,
    relevance_score: Math.max(0.45, paper.influence - 0.12),
    is_seed: false,
    edges: [{ to_paper_id: paperId, relationship: "related_method", strength: 0.72 - index * 0.08 }],
  }));
}

export function buildPlanFromSpecRequest(request: PlanRequest): ExperimentPlan {
  const sources = request.qc_sources?.length ? request.qc_sources : makeSources(request.hypothesis);
  const novelty_check = request.novelty_check ?? buildQcResponse(request.hypothesis).novelty_check;
  return {
    hypothesis: request.hypothesis,
    summary: "Operational experiment plan for testing the stated intervention with measurable endpoints, traceable sources, and decision-ready validation criteria.",
    experiment_type: "in_vitro",
    domain: "cell_biology",
    novelty_check,
    assumptions: ["Matched biological replicates are available.", "Required cell culture instrumentation is accessible.", "Supplier lead times remain under two weeks."],
    protocol: {
      title: "Controlled intervention protocol",
      citation_ids: [sources[0]?.id ?? "SRC-001"],
      steps: [
        { step_number: 1, title: "Prepare matched cultures", description: "Seed matched cultures and randomize vessels into control and intervention arms.", duration_minutes: 90, critical_parameters: ["70–80% confluence at treatment start", "Blind vessel labels before assessment"], warnings: ["Discard contaminated or over-confluent cultures"], materials_used: ["MAT-001", "MAT-002"], citation_ids: [sources[0]?.id ?? "SRC-001"] },
        { step_number: 2, title: "Apply intervention", description: "Introduce the experimental condition while maintaining an isomolar comparator arm.", duration_minutes: 120, critical_parameters: ["Confirm osmolarity before exposure", "Keep timing consistent across arms"], warnings: ["Avoid temperature excursions"], materials_used: ["MAT-003", "MAT-004"], citation_ids: [sources[1]?.id ?? "SRC-002"] },
        { step_number: 3, title: "Measure recovery", description: "Quantify viability and attachment after the recovery window with paired assay methods.", duration_minutes: 180, critical_parameters: ["Read primary endpoint at 24 hours", "Record morphology images before lysis"], warnings: ["Normalize cell counts before ATP assay"], materials_used: ["MAT-005"], citation_ids: [sources[2]?.id ?? "SRC-003"] },
      ],
    },
    materials: {
      total_cost_eur: 5860,
      longest_lead_time_days: 10,
      items: [
        { id: "MAT-001", name: "HeLa cell line", category: "cell_line", supplier: "ATCC", catalog_number: "CCL-2", url: sourceUrls[5], quantity: "1 vial", unit_cost_eur: 520, total_cost_eur: 520, lead_time_days: 7, alternative: null, citation_id: sources[0]?.id ?? "SRC-001" },
        { id: "MAT-002", name: "DMEM medium", category: "reagent", supplier: "Thermo Fisher", catalog_number: "11965092", url: sourceUrls[3], quantity: "6 x 500 mL", unit_cost_eur: 42, total_cost_eur: 252, lead_time_days: 5, alternative: null, citation_id: sources[1]?.id ?? "SRC-002" },
        { id: "MAT-003", name: "Trehalose dihydrate", category: "reagent", supplier: "Sigma-Aldrich", catalog_number: "T0167", url: sourceUrls[4], quantity: "100 g", unit_cost_eur: 96, total_cost_eur: 96, lead_time_days: 4, alternative: { name: "Trehalose", supplier: "Other", catalog_number: "ALT-TRE", note: "Use only if purity is equivalent." }, citation_id: sources[2]?.id ?? "SRC-003" },
        { id: "MAT-004", name: "Cryovials", category: "consumable", supplier: "Thermo Fisher", catalog_number: "375353", url: sourceUrls[3], quantity: "500", unit_cost_eur: 0.7, total_cost_eur: 350, lead_time_days: 5, alternative: null, citation_id: sources[3]?.id ?? "SRC-004" },
        { id: "MAT-005", name: "ATP viability assay", category: "kit", supplier: "Promega", catalog_number: "G7570", url: sourceUrls[6], quantity: "1 kit", unit_cost_eur: 690, total_cost_eur: 690, lead_time_days: 10, alternative: null, citation_id: sources[3]?.id ?? "SRC-004" },
      ],
    },
    equipment: [
      { name: "CO2 incubator", spec: "37°C, 5% CO2", required: true },
      { name: "Luminometer", spec: "ATP luminescence compatible", required: true },
      { name: "Controlled-rate freezing container", spec: "1°C/min cooling", required: true },
    ],
    budget: { currency: "EUR", contingency_pct: 12, total: 5860, confidence: "medium", line_items: [
      { category: "reagents", description: "Media, trehalose, assay reagents", cost: 2140, material_ids: ["MAT-002", "MAT-003", "MAT-005"], citation_ids: [sources[1]?.id ?? "SRC-002"] },
      { category: "consumables", description: "Cryovials and sterile handling supplies", cost: 1320, material_ids: ["MAT-004"], citation_ids: [sources[3]?.id ?? "SRC-004"] },
      { category: "personnel", description: "Technician execution and analysis", cost: 1500, material_ids: [], citation_ids: [] },
      { category: "overhead", description: "Culture and storage overhead", cost: 900, material_ids: [], citation_ids: [] },
    ] },
    timeline: { total_weeks: 6, critical_path_notes: "Material arrival and matched culture expansion are the critical path.", phases: [
      { phase_number: 1, name: "Setup", week_start: 1, week_end: 1, tasks: ["Order materials", "Confirm osmolarity"], dependencies: [], milestone: "Released protocol" },
      { phase_number: 2, name: "Production run", week_start: 2, week_end: 4, tasks: ["Run intervention", "Collect intermediate timepoints"], dependencies: [1], milestone: "All vials processed" },
      { phase_number: 3, name: "Validation", week_start: 5, week_end: 6, tasks: ["Final assay", "Statistical review"], dependencies: [2], milestone: "Decision package" },
    ] },
    validation: { statistical_approach: "Two-sided Welch t-test with confidence intervals for viability delta.", outcomes: [
      { priority: "primary", metric: "24h viability", target_value: "+15 percentage points", measurement_method: "Trypan blue and ATP luminescence", success_threshold: ">=15pp without attachment penalty", citation_ids: [sources[2]?.id ?? "SRC-003"] },
      { priority: "secondary", metric: "Attachment efficiency", target_value: "Non-inferior", measurement_method: "Image count and morphology scoring", success_threshold: "No visible morphology penalty", citation_ids: [] },
    ], controls: [
      { type: "negative", description: "Standard medium without intervention." },
      { type: "comparator", description: "Current sucrose-containing workflow." },
    ], failure_modes: [
      { scenario: "Low viability in both arms", likely_cause: "Handling or thaw process failure", remediation: "Repeat with fresh matched batch and audit temperature logs", citation_ids: [] },
      { scenario: "High variance", likely_cause: "Uneven confluence or operator effects", remediation: "Increase replicate count and block by operator", citation_ids: [] },
    ] },
    sources,
    claims: [
      { field_path: "summary", span: "traceable sources", citation_ids: [sources[0]?.id ?? "SRC-001"], inferred: false, inferred_rationale: "" },
      { field_path: "protocol.steps[1].description", span: "isomolar comparator", citation_ids: [sources[1]?.id ?? "SRC-002"], inferred: false, inferred_rationale: "" },
      { field_path: "validation.statistical_approach", span: "Welch t-test", citation_ids: [], inferred: true, inferred_rationale: "Statistical choice inferred from independent arms and small-batch variance." },
    ],
  };
}

export function experimentPlanToDexterPlan(plan: ExperimentPlan, graph?: LiteratureGraphType): DexterPlan {
  const papers: Paper[] = (graph?.papers ?? []).map((paper, index) => ({ id: `p${index + 1}`, title: paper.title, authors: paper.authors.join(", "), year: paper.year, abstract: paper.abstract_snippet, x: 120 + index * 90, y: 120 + (index % 3) * 95, influence: paper.relevance_score }));
  const edges = (graph?.papers ?? []).flatMap((paper, sourceIndex) => paper.edges.map((edge, edgeIndex) => ({ id: `${paper.id}-${edgeIndex}`, source: `p${sourceIndex + 1}`, target: `p${Math.max(1, (graph?.papers.findIndex((item) => item.id === edge.to_paper_id) ?? 0) + 1)}`, weight: edge.strength })));
  return {
    hypothesis: plan.hypothesis,
    metrics: [`${plan.timeline.total_weeks} weeks`, `${plan.budget.currency} ${plan.budget.total.toLocaleString()}`, plan.validation.outcomes[0]?.success_threshold ?? "validated"],
    sections: [
      { id: "summary", label: "§ SUMMARY", title: "Summary", content: [plan.summary, ...plan.assumptions] },
      { id: "novelty", label: "§ NOVELTY", title: "Novelty", content: [plan.novelty_check.summary] },
      { id: "protocol", label: "§ PROTOCOL", title: "Protocol", content: plan.protocol.steps.map((step) => `${step.step_number}. ${step.title}: ${step.description}`) },
      { id: "materials", label: "§ MATERIALS", title: "Materials", content: plan.materials.items.map((item) => `${item.id}: ${item.name}, ${item.supplier} ${item.catalog_number}, ${item.quantity}.`) },
      { id: "budget", label: "§ BUDGET", title: "Budget", content: plan.budget.line_items.map((line) => `${line.category}: ${line.description} — ${plan.budget.currency} ${line.cost}.`) },
      { id: "timeline", label: "§ TIMELINE", title: "Timeline", content: plan.timeline.phases.map((phase) => `Weeks ${phase.week_start}-${phase.week_end}: ${phase.name}. ${phase.tasks.join("; ")}.`) },
      { id: "validation", label: "§ VALIDATION", title: "Validation", content: [plan.validation.statistical_approach, ...plan.validation.outcomes.map((outcome) => `${outcome.priority}: ${outcome.metric} target ${outcome.target_value}.`)] },
    ],
    citations: plan.sources.map((source) => `${source.id} — ${source.title}`),
    comments: plan.validation.failure_modes.map((mode) => `${mode.scenario}: ${mode.remediation}`),
    papers: papers.length ? papers : samplePlan.papers,
    edges: edges.length ? edges : samplePlan.edges,
    activity: ["[PLAN] Stream connected", "[PLAN] Structured schema validated", "[PLAN] Report ready"],
  };
}