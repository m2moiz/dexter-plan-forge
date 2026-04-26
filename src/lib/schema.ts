import { z } from "zod";

export const ExperimentType = z.enum(["in_vitro", "in_vivo", "ex_vivo", "electrochemical", "microbial", "computational", "other"]);
export const Domain = z.enum(["diagnostics", "gut_health", "cell_biology", "climate", "oncology", "neuroscience", "immunology", "cardiology", "other"]);
export const NoveltyStatus = z.enum(["novel", "similar_exists", "exact_match"]);
export const SourceKind = z.enum(["paper", "preprint", "protocol", "supplier_catalog", "database", "guideline", "inferred"]);
export const MaterialCategory = z.enum(["reagent", "antibody", "cell_line", "consumable", "kit", "organism", "other"]);
export const Supplier = z.enum(["Sigma-Aldrich", "Thermo Fisher", "Addgene", "ATCC", "IDT", "Promega", "Qiagen", "NEB", "Bio-Rad", "Abcam", "R&D Systems", "Other"]);
export const Currency = z.enum(["EUR", "USD", "GBP"]);
export const BudgetCategory = z.enum(["reagents", "consumables", "equipment_purchase", "equipment_rental", "personnel", "sequencing", "animal_costs", "overhead", "contingency", "other"]);
export const Confidence = z.enum(["low", "medium", "high"]);
export const OutcomePriority = z.enum(["primary", "secondary"]);
export const ControlType = z.enum(["positive", "negative", "vehicle", "comparator", "blank"]);
export const CorrectionSeverity = z.enum(["critical", "major", "minor", "suggestion"]);
export const PaperRelationship = z.enum(["cites", "similar_topic", "contradicts", "extends", "related_method"]);
export const FigureType = z.enum(["timeline", "budget_chart", "materials_table", "protocol_flow", "literature_graph"]);

export const SourceCitation = z.object({
  id: z.string(),
  kind: SourceKind,
  title: z.string(),
  url: z.string(),
  doi: z.string().nullable(),
  year: z.number().nullable(),
  excerpt: z.string(),
}).strict();

export const Claim = z.object({
  field_path: z.string(),
  span: z.string().nullable(),
  citation_ids: z.array(z.string()),
  inferred: z.boolean(),
  inferred_rationale: z.string(),
}).strict();

export const NoveltyCheck = z.object({
  status: NoveltyStatus,
  summary: z.string(),
  citation_ids: z.array(z.string()),
}).strict();

export const ProtocolStep = z.object({
  step_number: z.number(),
  title: z.string(),
  description: z.string(),
  duration_minutes: z.number(),
  critical_parameters: z.array(z.string()),
  warnings: z.array(z.string()),
  materials_used: z.array(z.string()),
  citation_ids: z.array(z.string()),
}).strict();

export const Protocol = z.object({
  title: z.string(),
  steps: z.array(ProtocolStep),
  citation_ids: z.array(z.string()),
}).strict();

export const Alternative = z.object({ name: z.string(), supplier: Supplier, catalog_number: z.string(), note: z.string() }).strict();
export const Material = z.object({
  id: z.string(),
  name: z.string(),
  category: MaterialCategory,
  supplier: Supplier,
  catalog_number: z.string(),
  url: z.string(),
  quantity: z.string(),
  unit_cost_eur: z.number(),
  total_cost_eur: z.number(),
  lead_time_days: z.number(),
  alternative: Alternative.nullable(),
  citation_id: z.string(),
}).strict();

export const Materials = z.object({ items: z.array(Material), total_cost_eur: z.number(), longest_lead_time_days: z.number() }).strict();
export const EquipmentItem = z.object({ name: z.string(), spec: z.string(), required: z.boolean() }).strict();
export const BudgetLine = z.object({ category: BudgetCategory, description: z.string(), cost: z.number(), material_ids: z.array(z.string()), citation_ids: z.array(z.string()) }).strict();
export const Budget = z.object({ currency: Currency, line_items: z.array(BudgetLine), contingency_pct: z.number(), total: z.number(), confidence: Confidence }).strict();
export const TimelinePhase = z.object({ phase_number: z.number(), name: z.string(), week_start: z.number(), week_end: z.number(), tasks: z.array(z.string()), dependencies: z.array(z.number()), milestone: z.string() }).strict();
export const Timeline = z.object({ total_weeks: z.number(), phases: z.array(TimelinePhase), critical_path_notes: z.string() }).strict();
export const Outcome = z.object({ priority: OutcomePriority, metric: z.string(), target_value: z.string(), measurement_method: z.string(), success_threshold: z.string(), citation_ids: z.array(z.string()) }).strict();
export const Control = z.object({ type: ControlType, description: z.string() }).strict();
export const FailureMode = z.object({ scenario: z.string(), likely_cause: z.string(), remediation: z.string(), citation_ids: z.array(z.string()) }).strict();
export const Validation = z.object({ outcomes: z.array(Outcome), controls: z.array(Control), statistical_approach: z.string(), failure_modes: z.array(FailureMode) }).strict();

export const ExperimentPlanSchema = z.object({
  hypothesis: z.string(),
  summary: z.string(),
  experiment_type: ExperimentType,
  domain: Domain,
  novelty_check: NoveltyCheck,
  assumptions: z.array(z.string()),
  protocol: Protocol,
  materials: Materials,
  equipment: z.array(EquipmentItem),
  budget: Budget,
  timeline: Timeline,
  validation: Validation,
  sources: z.array(SourceCitation),
  claims: z.array(Claim),
}).strict();

export const PaperEdge = z.object({ to_paper_id: z.string(), relationship: PaperRelationship, strength: z.number() }).strict();
export const LiteraturePaper = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  year: z.number(),
  source: SourceKind,
  url: z.string(),
  doi: z.string().nullable(),
  abstract_snippet: z.string(),
  relevance_score: z.number(),
  is_seed: z.boolean(),
  edges: z.array(PaperEdge),
}).strict();
export const LiteratureGraph = z.object({ query: z.string(), papers: z.array(LiteraturePaper), generated_at: z.string() }).strict();

export const FieldCorrection = z.object({ field_path: z.string(), issue: z.string(), correction: z.string(), severity: CorrectionSeverity }).strict();
export const TextSelection = z.object({ field_path: z.string(), start_offset: z.number(), end_offset: z.number(), selected_text: z.string() }).strict();
export const SelectionComment = z.object({ id: z.string(), selection: TextSelection, comment: z.string(), severity: CorrectionSeverity, resolved: z.boolean() }).strict();
export const FigureRegion = z.object({ figure_type: FigureType, x: z.number(), y: z.number(), width: z.number(), height: z.number(), context: z.string() }).strict();
export const RegionComment = z.object({ id: z.string(), region: FigureRegion, comment: z.string(), severity: CorrectionSeverity, resolved: z.boolean() }).strict();
export const FeedbackSchema = z.object({
  plan_id: z.string(),
  experiment_type: ExperimentType,
  domain: Domain,
  field_corrections: z.array(FieldCorrection),
  selection_comments: z.array(SelectionComment),
  region_comments: z.array(RegionComment),
  used_as_few_shot: z.boolean(),
  few_shot_tags: z.array(z.string()),
}).strict();

export type ExperimentPlan = z.infer<typeof ExperimentPlanSchema>;
export type NoveltyCheckType = z.infer<typeof NoveltyCheck>;
export type SourceCitationType = z.infer<typeof SourceCitation>;
export type LiteratureGraphType = z.infer<typeof LiteratureGraph>;
export type LiteraturePaperType = z.infer<typeof LiteraturePaper>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type CorrectionSeverityType = z.infer<typeof CorrectionSeverity>;