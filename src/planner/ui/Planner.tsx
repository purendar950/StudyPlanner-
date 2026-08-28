/**
 * Planner workspace.
 *
 * Renders one of the six planner sections (Home, Syllabus, Calendar, Revision,
 * Progress, Plan) plus the create-plan wizard. The host app owns section state so
 * the surrounding navigation stays in sync.
 */
import { useState } from 'react';
import type { PlannerSectionId, StudyPlan } from '../types';
import type { PlannerStore } from '../store';
import { usePlannerStore } from '../store';
import { CreatePlanWizard } from './CreatePlanWizard';
import { TodayTab } from './TodayTab';
import { SyllabusTab } from './SyllabusTab';
import { CalendarTab } from './CalendarTab';
import { InsightsTab } from './InsightsTab';
import { RevisionTab } from './RevisionTab';
import { PlansTab } from './PlansTab';
import { Card, Empty } from './primitives';

export function PlannerWorkspace({ store, wizard, setWizard }: {
  store: PlannerStore;
  wizard: boolean;
  setWizard: (open: boolean) => void;
}) {
  const { plan, plans, section, setSection } = store;
  const apply = (next: StudyPlan) => store.replacePlan(next);

  if (wizard) {
    return (
      <div className="pl-root">
        <CreatePlanWizard
          onCancel={() => setWizard(false)}
          onCreate={(created) => {
            store.addPlan(created);
            setWizard(false);
            setSection('home');
          }}
        />
      </div>
    );
  }

  return (
    <div className="pl-root">
      {!plan && section !== 'plans' ? (
        <Card>
          <Empty
            title="Set up an exam to see your daily study plan here"
            body="Create your exam plan from a ready-made template, a pasted syllabus, or from scratch."
            action={<button className="pl-btn primary" onClick={() => setWizard(true)}>Create your plan</button>}
          />
        </Card>
      ) : section === 'home' && plan ? (
        <TodayTab plan={plan} onChange={apply} goTo={(next: PlannerSectionId) => setSection(next)} />
      ) : section === 'syllabus' && plan ? (
        <SyllabusTab plan={plan} onChange={apply} />
      ) : section === 'calendar' && plan ? (
        <CalendarTab plan={plan} onChange={apply} />
      ) : section === 'revision' && plan ? (
        <RevisionTab plan={plan} onChange={apply} />
      ) : section === 'insights' && plan ? (
        <InsightsTab plan={plan} />
      ) : (
        <PlansTab
          plans={plans}
          plan={plan}
          onSelect={store.selectPlan}
          onChange={apply}
          onDelete={store.deletePlan}
          onCreate={() => setWizard(true)}
        />
      )}
    </div>
  );
}

/** Standalone planner with its own store, for embedding without the app shell. */
export function Planner() {
  const store = usePlannerStore();
  const [wizard, setWizard] = useState(false);
  return <PlannerWorkspace store={store} wizard={wizard} setWizard={setWizard} />;
}
