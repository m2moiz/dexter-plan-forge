import { create } from "zustand";

import { type PlanStreamEvent, type QcResponse, buildQcResponse, experimentPlanToDexterPlan } from "./dexter-api";
import { samplePlan, type DexterPlan, type DexterScreen, type Paper } from "./mock-plan";
import type { ExperimentPlan } from "./schema";

export type ReportHighlight = { key: string; reportId: string; start: number; end: number; text: string; correction?: string };

type DexterState = {
  currentScreen: DexterScreen;
  hypothesis: string;
  plan: DexterPlan;
  experimentPlan: ExperimentPlan | null;
  planId: string | null;
  qcPayload: QcResponse;
  qcStatus: "idle" | "loading" | "success" | "error";
  planStatus: "idle" | "streaming" | "success" | "error";
  apiError: string | null;
  streamedActivity: string[];
  streamedSections: DexterPlan["sections"];
  currentlySelectedPaper: Paper | null;
  visitedNodeIds: Set<string>;
  bookmarkedNodeIds: Set<string>;
  reportHighlights: ReportHighlight[];
  activeReference: string | null;
  setCurrentScreen: (screen: DexterScreen) => void;
  goToPreviousScreen: () => void;
  setHypothesis: (hypothesis: string) => void;
  setPlanId: (planId: string | null) => void;
  startQc: () => void;
  finishQc: (payload: QcResponse) => void;
  failApi: (message: string) => void;
  startPlanStream: () => void;
  applyPlanStreamEvent: (event: PlanStreamEvent) => void;
  selectPaper: (paper: Paper | null) => void;
  markNodeVisited: (paperId: string) => void;
  toggleNodeBookmark: (paperId: string) => void;
  setReportHighlights: (updater: ReportHighlight[] | ((current: ReportHighlight[]) => ReportHighlight[])) => void;
  setActiveReference: (paperId: string | null) => void;
  beginPlanGeneration: () => void;
};

const previousScreen: Partial<Record<DexterScreen, DexterScreen>> = {
  LITERATURE_GRAPH: "HYPOTHESIS_INPUT",
  PLAN_GENERATING: "LITERATURE_GRAPH",
  PLAN_VIEW: "LITERATURE_GRAPH",
};

export const useDexterStore = create<DexterState>((set) => ({
  currentScreen: "LOADING",
  hypothesis: samplePlan.hypothesis,
  plan: samplePlan,
  experimentPlan: null,
  planId: null,
  qcPayload: buildQcResponse(samplePlan.hypothesis),
  qcStatus: "idle",
  planStatus: "idle",
  apiError: null,
  streamedActivity: [],
  streamedSections: [],
  currentlySelectedPaper: null,
  visitedNodeIds: new Set(),
  bookmarkedNodeIds: new Set(),
  reportHighlights: [],
  activeReference: null,
  setCurrentScreen: (currentScreen) => set({ currentScreen }),
  goToPreviousScreen: () =>
    set((state) => ({
      currentScreen: previousScreen[state.currentScreen] ?? state.currentScreen,
    })),
  setHypothesis: (hypothesis) => set({ hypothesis }),
  setPlanId: (planId) => set({ planId }),
  startQc: () => set({ qcStatus: "loading", apiError: null }),
  finishQc: (qcPayload) =>
    set((state) => ({
      qcPayload,
      qcStatus: "success",
      apiError: null,
      currentScreen: "LITERATURE_GRAPH",
      plan: { ...state.plan, citations: qcPayload.sources.map((source) => `${source.id} — ${source.title}`), comments: [qcPayload.novelty_check.summary] },
      currentlySelectedPaper: null,
      visitedNodeIds: new Set(),
      bookmarkedNodeIds: new Set(),
    })),
  failApi: (apiError) => set({ apiError, qcStatus: "error", planStatus: "error" }),
  startPlanStream: () =>
    set({
      currentScreen: "PLAN_GENERATING",
      planStatus: "streaming",
      apiError: null,
      planId: null,
      streamedActivity: [],
      streamedSections: [],
    }),
  applyPlanStreamEvent: (event) => {
    if (event.type === "activity") set((state) => ({ streamedActivity: [...state.streamedActivity, event.message] }));
    if (event.type === "section") set((state) => ({ streamedSections: [...state.streamedSections, event.section] }));
    if (event.type === "final") {
      const plan = experimentPlanToDexterPlan(event.plan);
      set({ plan, experimentPlan: event.plan, planStatus: "success", currentScreen: "PLAN_VIEW", streamedSections: plan.sections });
    }
    if (event.type === "error") set({ apiError: event.message, planStatus: "error" });
  },
  selectPaper: (currentlySelectedPaper) => set({ currentlySelectedPaper }),
  markNodeVisited: (paperId) =>
    set((state) => {
      const visitedNodeIds = new Set(state.visitedNodeIds);
      visitedNodeIds.add(paperId);
      return { visitedNodeIds };
    }),
  toggleNodeBookmark: (paperId) =>
    set((state) => {
      const bookmarkedNodeIds = new Set(state.bookmarkedNodeIds);
      if (bookmarkedNodeIds.has(paperId)) bookmarkedNodeIds.delete(paperId);
      else bookmarkedNodeIds.add(paperId);
      return { bookmarkedNodeIds };
    }),
  setReportHighlights: (updater) =>
    set((state) => ({
      reportHighlights: typeof updater === "function" ? updater(state.reportHighlights) : updater,
    })),
  setActiveReference: (activeReference) => set({ activeReference }),
  beginPlanGeneration: () =>
    set({
      currentScreen: "PLAN_GENERATING",
    }),
}));