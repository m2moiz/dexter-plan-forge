import { samplePlan, type DexterPlan, type Paper, type PlanSection } from "./mock-plan";

export type QcRequest = { hypothesis: string };

export type QcResponse = {
  hypothesis: string;
  metrics: string[];
  papers: Paper[];
  edges: DexterPlan["edges"];
  citations: string[];
  comments: string[];
  activity: string[];
};

export type PlanRequest = QcResponse;

export type PlanStreamEvent =
  | { type: "activity"; message: string }
  | { type: "section"; section: PlanSection }
  | { type: "final"; plan: DexterPlan }
  | { type: "error"; message: string };

const extractKeywords = (hypothesis: string) =>
  hypothesis
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 6);

export function buildQcResponse(hypothesis: string): QcResponse {
  const keywords = extractKeywords(hypothesis);
  const focus = keywords.slice(0, 3).join(" / ") || "experimental intervention";

  return {
    hypothesis,
    metrics: samplePlan.metrics,
    papers: samplePlan.papers.map((paper, index) => ({
      ...paper,
      title: index < keywords.length ? `${paper.title}: ${keywords[index]} context` : paper.title,
      abstract: `${paper.abstract} Relevance screen: this source was selected for its relationship to ${focus}.`,
    })),
    edges: samplePlan.edges,
    citations: samplePlan.citations,
    comments: [`QC passed for: ${focus}.`, ...samplePlan.comments],
    activity: [
      "[QC 00:01] Received hypothesis payload",
      "[QC 00:02] Extracted intervention, endpoint, and effect threshold",
      "[QC 00:04] Ranked candidate literature nodes",
      "[QC 00:06] Literature graph package ready",
    ],
  };
}

export function buildPlanFromQc(qc: QcResponse): DexterPlan {
  const keywords = extractKeywords(qc.hypothesis);
  const focus = keywords.slice(0, 3).join(", ") || "the proposed intervention";

  return {
    hypothesis: qc.hypothesis,
    metrics: qc.metrics,
    papers: qc.papers,
    edges: qc.edges,
    citations: qc.citations,
    comments: qc.comments,
    activity: [
      ...qc.activity,
      "[PLAN 00:08] Drafting experimental sections",
      "[PLAN 00:10] Linking validation plan to evidence graph",
      "[PLAN 00:12] Final report package assembled",
    ],
    sections: samplePlan.sections.map((section) => ({
      ...section,
      content: section.content.map((paragraph, index) =>
        index === 0 ? paragraph.replace(/Trehalose|trehalose|cryopreservation|cryoprotectant/g, focus) : paragraph,
      ),
    })),
  };
}

export const planToQcResponse = (plan: DexterPlan): QcResponse => ({
  hypothesis: plan.hypothesis,
  metrics: plan.metrics,
  papers: plan.papers,
  edges: plan.edges,
  citations: plan.citations,
  comments: plan.comments,
  activity: plan.activity,
});