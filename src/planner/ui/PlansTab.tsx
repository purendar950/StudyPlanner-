/** Plan tab: plan list, plan settings, extend/reset and rebuild actions. */
import { useMemo, useState } from 'react';
import { CalendarPlus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { OverloadMode, PlanStrategy, PriorityOrderMode, StudyPlan } from '../types';
import { autoDistribute, extendPlan, planProgress, requiredPerDay, resetPlan, syllabusStats } from '../engine';
import { WEEKDAYS, addDays, daysUntil, formatShort, todayKey } from '../dates';
import { Bar, Card, Chips, Empty, Toast } from './primitives';

export function PlansTab({ plans, plan, onSelect, onChange, onDelete, onCreate }: {
  plans: StudyPlan[];
  plan: StudyPlan | null;
  onSelect: (planId: string) => void;
  onChange: (plan: StudyPlan) => void;
  onDelete: (planId: string) => void;
  onCreate: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="pl-stack">
      <Card
        title="Plan Your Exams"
        subtitle="Add subjects, change daily study, or make new dates."
        action={<button className="pl-btn primary" onClick={onCreate}><Plus size={15} /> Create Your New Plan</button>}
      >
        {plans.length === 0 ? (
          <Empty title="No plans yet" body="Create your exam plan to see your daily study plan here." action={<button className="pl-btn primary" onClick={onCreate}>Create plan</button>} />
        ) : (
          <ul className="pl-plan-list">
            {plans.map((entry) => {
              const progress = planProgress(entry);
              const stats = syllabusStats(entry);
              const left = daysUntil(entry.examDate);
              return (
                <li key={entry.id} className={entry.id === plan?.id ? 'active' : ''}>
                  <button className="pl-plan-main" onClick={() => onSelect(entry.id)}>
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.examType} · {formatShort(entry.examDate)} · {left === 0 ? 'Exam today!' : `${left} days left`}</span>
                    </div>
                    <Bar value={progress.completionPercent} />
                    <small>{stats.subjectCount} subjects · {stats.chapterCount} chapters · {stats.topicCount} topics · {progress.completionPercent}%</small>
                  </button>
                  <button
                    className="pl-icon-btn danger"
                    aria-label={`Delete ${entry.title}`}
                    onClick={() => {
                      if (!confirm(`Delete plan?\n\n${entry.title} and its progress will be removed.`)) return;
                      onDelete(entry.id);
                    }}
                  ><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {plan && <PlanSettings plan={plan} onChange={onChange} onToast={setToast} />}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function PlanSettings({ plan, onChange, onToast }: { plan: StudyPlan; onChange: (plan: StudyPlan) => void; onToast: (message: string) => void }) {
  const [title, setTitle] = useState(plan.title);
  const [examType, setExamType] = useState(plan.examType);
  const [examDate, setExamDate] = useState(plan.examDate);
  const [dailyGoal, setDailyGoal] = useState(plan.dailyGoal);
  const required = useMemo(() => requiredPerDay({ ...plan, dailyGoal }), [plan, dailyGoal]);

  const save = () => {
    onChange({ ...plan, title: title.trim() || plan.title, examType: examType.trim() || plan.examType, examDate, dailyGoal, updatedAt: new Date().toISOString() });
    onToast('Plan settings saved');
  };

  const toggleOffDay = (day: number) => {
    const offDays = plan.offDays.includes(day) ? plan.offDays.filter((entry) => entry !== day) : [...plan.offDays, day];
    onChange({ ...plan, offDays });
  };

  return (
    <>
      <Card title="Plan Settings" subtitle="Change plan details, then rebuild your schedule.">
        <div className="pl-form-grid">
          <div className="pl-field">
            <label htmlFor="settings-title">Plan title</label>
            <input id="settings-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="pl-field">
            <label htmlFor="settings-exam">Exam</label>
            <input id="settings-exam" value={examType} onChange={(event) => setExamType(event.target.value)} />
          </div>
          <div className="pl-field">
            <label htmlFor="settings-date">Exam date</label>
            <input id="settings-date" type="date" value={examDate} min={addDays(todayKey(), 1)} onChange={(event) => setExamDate(event.target.value)} />
          </div>
          <div className="pl-field">
            <label htmlFor="settings-goal">Topics per day</label>
            <input id="settings-goal" type="number" min={1} max={30} value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))} />
          </div>
        </div>
        <p className="pl-hint">{required > dailyGoal ? `This plan needs about ${required} topics/day to finish before the exam.` : 'Your plan fits before your exam.'}</p>
        <h4 className="pl-subhead">MY REST DAYS</h4>
        <div className="pl-weekdays">
          {WEEKDAYS.map((label, day) => (
            <button key={label} className={plan.offDays.includes(day) ? 'active' : ''} onClick={() => toggleOffDay(day)} aria-pressed={plan.offDays.includes(day)}>{label}</button>
          ))}
        </div>
        <div className="pl-row-actions">
          <button className="pl-btn primary" onClick={save}>Save</button>
        </div>
      </Card>

      <Card title="How should we plan your days?" subtitle="Choose how topics are placed on your study days.">
        <Chips
          value={plan.settings.strategy}
          options={[
            { value: 'balanced' as PlanStrategy, label: 'Balanced', hint: 'A little of every subject daily.' },
            { value: 'sequential' as PlanStrategy, label: 'In my order', hint: 'Exact syllabus order.' },
            { value: 'priority' as PlanStrategy, label: 'Priority first', hint: 'Toughest subjects get daily slots.' },
          ]}
          onChange={(strategy) => onChange({ ...plan, settings: { ...plan.settings, strategy } })}
        />
        {plan.settings.strategy === 'priority' && (
          <>
            <h4 className="pl-subhead">Pick your 2-3 hardest subjects</h4>
            <div className="pl-chips">
              {plan.subjects.map((subject) => {
                const active = plan.settings.prioritySubjectNames.includes(subject.name);
                return (
                  <button
                    key={subject.id}
                    className={active ? 'chip active' : 'chip'}
                    onClick={() => onChange({
                      ...plan,
                      settings: {
                        ...plan.settings,
                        prioritySubjectNames: active
                          ? plan.settings.prioritySubjectNames.filter((entry) => entry !== subject.name)
                          : [...plan.settings.prioritySubjectNames, subject.name].slice(0, 3),
                      },
                    })}
                  ><span>{subject.name}</span></button>
                );
              })}
            </div>
            <Chips
              value={plan.settings.priorityOrderMode}
              options={[
                { value: 'daily' as PriorityOrderMode, label: 'A topic every day' },
                { value: 'front' as PriorityOrderMode, label: 'Finish them first' },
              ]}
              onChange={(priorityOrderMode) => onChange({ ...plan, settings: { ...plan.settings, priorityOrderMode } })}
            />
          </>
        )}
        <h4 className="pl-subhead">Overload handling</h4>
        <Chips
          value={plan.settings.overloadMode}
          options={[
            { value: 'strict' as OverloadMode, label: 'Never exceed goal' },
            { value: 'spread' as OverloadMode, label: 'Slight overflow' },
            { value: 'allow' as OverloadMode, label: 'Fit before exam' },
          ]}
          onChange={(overloadMode) => onChange({ ...plan, settings: { ...plan.settings, overloadMode } })}
        />
        <label className="pl-switch">
          <input
            type="checkbox"
            checked={plan.settings.weightedPlanning}
            onChange={(event) => onChange({ ...plan, settings: { ...plan.settings, weightedPlanning: event.target.checked } })}
          />
          <span>Weighted planning — big topics count more</span>
        </label>
        <label className="pl-switch">
          <input
            type="checkbox"
            checked={plan.settings.autoRollover}
            onChange={(event) => onChange({ ...plan, settings: { ...plan.settings, autoRollover: event.target.checked } })}
          />
          <span>Auto rollover — move unfinished topics to the next study day</span>
        </label>
        <label className="pl-switch">
          <input
            type="checkbox"
            checked={plan.settings.revisionScheduleType === 'spaced'}
            onChange={(event) => onChange({ ...plan, settings: { ...plan.settings, revisionScheduleType: event.target.checked ? 'spaced' : 'none' } })}
          />
          <span>Spaced revision after 1, 3, 7 and 21 days</span>
        </label>
      </Card>

      <Card title="Manage Plan" subtitle="Rebuild, extend or reset your schedule.">
        <div className="pl-row-actions wrap">
          <button
            className="pl-btn primary"
            onClick={() => {
              const result = autoDistribute(plan, { fromDate: todayKey() });
              onChange(result.plan);
              onToast(result.message);
            }}
          ><RotateCcw size={15} /> Rebuild schedule now</button>
          <button
            className="pl-btn ghost"
            onClick={() => {
              const next = addDays(plan.examDate, 30);
              const result = extendPlan(plan, next);
              onChange(result.plan);
              onToast(`Plan Extended! New exam date ${formatShort(next)}.`);
            }}
          ><CalendarPlus size={15} /> Extend by 30 days</button>
          <button
            className="pl-btn danger"
            onClick={() => {
              if (!confirm('Reset plan?\n\nAll dates and completion will be cleared. Your syllabus stays.')) return;
              onChange(resetPlan(plan));
              onToast('Plan reset');
            }}
          >Reset plan</button>
        </div>
        {plan.restoreSnapshots.length > 0 && (
          <p className="pl-hint">{plan.restoreSnapshots.length} restore point(s) available from recent finish-day and reset actions.</p>
        )}
      </Card>
    </>
  );
}
