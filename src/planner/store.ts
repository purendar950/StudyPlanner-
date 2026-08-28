/** Local-first planner store: plans are persisted in localStorage, no backend required. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlannerSectionId, StudyPlan } from './types';
import { clonePlan } from './engine';

const PLANS_KEY = 'studyplanner.plans.v1';
const ACTIVE_KEY = 'studyplanner.activePlanId.v1';
const SECTION_KEY = 'studyplanner.section.v1';

function readPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePlans(plans: StudyPlan[]): void {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch {
    // Storage full or unavailable — the session keeps working in memory.
  }
}

export type PlannerStore = {
  plans: StudyPlan[];
  plan: StudyPlan | null;
  activePlanId: string | null;
  section: PlannerSectionId;
  setSection: (section: PlannerSectionId) => void;
  selectPlan: (planId: string) => void;
  addPlan: (plan: StudyPlan) => void;
  updatePlan: (planId: string, updater: (plan: StudyPlan) => StudyPlan) => void;
  replacePlan: (plan: StudyPlan) => void;
  deletePlan: (planId: string) => void;
};

export function usePlannerStore(): PlannerStore {
  const [plans, setPlans] = useState<StudyPlan[]>(() => readPlans());
  const [activePlanId, setActivePlanId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [section, setSectionState] = useState<PlannerSectionId>(
    () => (localStorage.getItem(SECTION_KEY) as PlannerSectionId | null) ?? 'home',
  );

  useEffect(() => writePlans(plans), [plans]);
  useEffect(() => {
    if (activePlanId) localStorage.setItem(ACTIVE_KEY, activePlanId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activePlanId]);
  useEffect(() => localStorage.setItem(SECTION_KEY, section), [section]);

  const plan = useMemo(
    () => plans.find((entry) => entry.id === activePlanId) ?? plans[0] ?? null,
    [plans, activePlanId],
  );

  const addPlan = useCallback((next: StudyPlan) => {
    setPlans((current) => [next, ...current]);
    setActivePlanId(next.id);
  }, []);

  const updatePlan = useCallback((planId: string, updater: (plan: StudyPlan) => StudyPlan) => {
    setPlans((current) => current.map((entry) => (entry.id === planId ? updater(clonePlan(entry)) : entry)));
  }, []);

  const replacePlan = useCallback((next: StudyPlan) => {
    setPlans((current) => current.map((entry) => (entry.id === next.id ? next : entry)));
  }, []);

  const deletePlan = useCallback((planId: string) => {
    setPlans((current) => {
      const remaining = current.filter((entry) => entry.id !== planId);
      setActivePlanId(remaining[0]?.id ?? null);
      return remaining;
    });
  }, []);

  const setSection = useCallback((next: PlannerSectionId) => setSectionState(next), []);
  const selectPlan = useCallback((planId: string) => setActivePlanId(planId), []);

  return { plans, plan, activePlanId: plan?.id ?? null, section, setSection, selectPlan, addPlan, updatePlan, replacePlan, deletePlan };
}
