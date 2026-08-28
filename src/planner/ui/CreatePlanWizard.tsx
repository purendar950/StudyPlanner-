/**
 * Create-plan wizard.
 *
 * Mirrors the Safar flow: pick source -> exam & date -> daily goal & rest days ->
 * rate chapters -> choose strategy/priority subjects -> review preview -> build.
 */
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, LayoutTemplate, Pencil, Search, Sparkles } from 'lucide-react';
import type { ChapterDifficultyValue, OverloadMode, PlanSource, PlanStrategy, PriorityOrderMode, StudyPlan, StudySubject } from '../types';
import { EXAM_TEMPLATES, TEMPLATE_CATEGORIES, statsForTemplate } from '../templates';
import { autoDistribute, createPlan, cloneSubjects, makeSubject, parsePastedSyllabus, previewPlan, requiredPerDay, syllabusStats } from '../engine';
import { WEEKDAYS, addDays, formatShort, todayKey } from '../dates';
import { Bar, Card, Chips } from './primitives';

const STEPS = ['Source', 'Exam', 'Days', 'Ratings', 'Strategy', 'Review'] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const STRATEGY_OPTIONS: { value: PlanStrategy; label: string; hint: string }[] = [
  { value: 'balanced', label: 'Balanced', hint: 'Study a little bit of all your subjects every day.' },
  { value: 'sequential', label: 'In my order', hint: 'Finish topics in the exact order of your syllabus.' },
  { value: 'priority', label: 'Priority first', hint: 'Rotate subjects, and give your toughest ones a topic every day.' },
];

const OVERLOAD_OPTIONS: { value: OverloadMode; label: string; hint: string }[] = [
  { value: 'strict', label: 'Never exceed goal', hint: 'Every day has exactly your daily goal or less.' },
  { value: 'spread', label: 'Slight overflow', hint: 'Some days can go a little over to fit everything.' },
  { value: 'allow', label: 'Fit before exam', hint: 'Every topic gets a date even if some days are heavy.' },
];

export function CreatePlanWizard({ onCancel, onCreate }: { onCancel: () => void; onCreate: (plan: StudyPlan) => void }) {
  const [step, setStep] = useState<StepIndex>(0);
  const [source, setSource] = useState<PlanSource>('template');
  const [templateId, setTemplateId] = useState('ssc-cgl');
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState(TEMPLATE_CATEGORIES[0]);
  const [title, setTitle] = useState('SSC CGL 2026');
  const [examType, setExamType] = useState('SSC CGL');
  const [examDate, setExamDate] = useState(addDays(todayKey(), 120));
  const [dailyGoal, setDailyGoal] = useState(6);
  const [offDays, setOffDays] = useState<number[]>([0]);
  const [pasted, setPasted] = useState('');
  const [customSubjects, setCustomSubjects] = useState<StudySubject[]>([]);
  const [ratings, setRatings] = useState<Record<string, ChapterDifficultyValue>>({});
  const [strategy, setStrategy] = useState<PlanStrategy>('balanced');
  const [overloadMode, setOverloadMode] = useState<OverloadMode>('strict');
  const [priorityOrderMode, setPriorityOrderMode] = useState<PriorityOrderMode>('daily');
  const [prioritySubjects, setPrioritySubjects] = useState<string[]>([]);
  const [weighted, setWeighted] = useState(true);

  const template = useMemo(() => EXAM_TEMPLATES.find((entry) => entry.id === templateId) ?? null, [templateId]);
  const filteredTemplates = useMemo(
    () => EXAM_TEMPLATES.filter((entry) => `${entry.name} ${entry.description}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  /** Draft plan for the current wizard state; recomputed on each step change. */
  const draft = useMemo(() => {
    const base = createPlan({
      title: title.trim() || examType || 'My study plan',
      examType: examType.trim() || 'Custom exam',
      examDate,
      dailyGoal,
      offDays,
      template: source === 'template' ? template : null,
      settings: { strategy, overloadMode, priorityOrderMode, prioritySubjectNames: prioritySubjects, weightedPlanning: weighted },
    });
    if (source === 'paste') base.subjects = parsePastedSyllabus(pasted);
    if (source === 'custom') base.subjects = cloneSubjects(customSubjects);
    for (const subject of base.subjects) {
      for (const chapter of subject.chapters) {
        const rated = ratings[`${subject.name}::${chapter.name}`];
        if (rated) chapter.difficulty = rated;
      }
    }
    return base;
  }, [title, examType, examDate, dailyGoal, offDays, source, template, pasted, customSubjects, ratings, strategy, overloadMode, priorityOrderMode, prioritySubjects, weighted]);

  const stats = syllabusStats(draft);
  const preview = useMemo(() => (step === 5 ? previewPlan(draft) : null), [step, draft]);
  const required = useMemo(() => requiredPerDay(draft), [draft]);

  const toughChapters = useMemo(() => {
    const rows: { subject: string; chapter: string; current: ChapterDifficultyValue }[] = [];
    for (const subject of draft.subjects) {
      for (const chapter of subject.chapters) rows.push({ subject: subject.name, chapter: chapter.name, current: chapter.difficulty });
    }
    return rows;
  }, [draft]);

  const canAdvance = (): boolean => {
    if (step === 0) return source === 'template' ? Boolean(template) : source === 'paste' ? pasted.trim().length > 0 : true;
    if (step === 1) return title.trim().length > 0 && examType.trim().length > 0 && examDate > todayKey();
    if (step === 3) return stats.topicCount > 0;
    return true;
  };

  const finish = () => {
    const built = autoDistribute(draft, { fromDate: todayKey() });
    onCreate(built.plan);
  };

  const next = () => (step === 5 ? finish() : setStep((step + 1) as StepIndex));
  const back = () => (step === 0 ? onCancel() : setStep((step - 1) as StepIndex));

  const toggleOffDay = (day: number) =>
    setOffDays((current) => (current.includes(day) ? current.filter((entry) => entry !== day) : [...current, day]));

  const togglePriority = (name: string) =>
    setPrioritySubjects((current) => (current.includes(name) ? current.filter((entry) => entry !== name) : current.length >= 3 ? current : [...current, name]));

  return (
    <div className="pl-wizard">
      <ol className="pl-steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
            <b>{index < step ? <Check size={13} /> : index + 1}</b>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card title="Create your study plan" subtitle="Choose how you want to build your syllabus.">
          <div className="pl-source-grid">
            <button className={source === 'template' ? 'pl-source active' : 'pl-source'} onClick={() => setSource('template')}>
              <LayoutTemplate size={20} />
              <strong>Create plan from template</strong>
              <span>Ready-made syllabus for SSC, UPSC, Railways, Banking, Defence and more.</span>
            </button>
            <button className={source === 'paste' ? 'pl-source active' : 'pl-source'} onClick={() => setSource('paste')}>
              <FileText size={20} />
              <strong>Paste your syllabus</strong>
              <span>Paste subjects, chapters and topics — we organise them for you.</span>
            </button>
            <button className={source === 'custom' ? 'pl-source active' : 'pl-source'} onClick={() => setSource('custom')}>
              <Pencil size={20} />
              <strong>Create custom plan</strong>
              <span>Start empty and add the subjects, chapters and topics yourself.</span>
            </button>
          </div>

          {source === 'template' && (
            <div className="pl-template-picker">
              <label className="pl-search">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams…" aria-label="Search exams" />
              </label>
              {search ? (
                <div className="pl-template-list">
                  {filteredTemplates.map((entry) => (
                    <TemplateRow key={entry.id} id={entry.id} active={templateId === entry.id} onSelect={() => { setTemplateId(entry.id); setExamType(entry.name); setTitle(`${entry.name} ${new Date().getFullYear() + 1}`); setDailyGoal(entry.recommendedDailyGoal); }} />
                  ))}
                </div>
              ) : (
                TEMPLATE_CATEGORIES.map((category) => (
                  <div key={category} className="pl-template-group">
                    <button className="pl-group-head" onClick={() => setOpenCategory(openCategory === category ? '' : category)} aria-expanded={openCategory === category}>
                      <span>{category}</span>
                      <ChevronDown size={16} className={openCategory === category ? 'rot' : ''} />
                    </button>
                    {openCategory === category && (
                      <div className="pl-template-list">
                        {EXAM_TEMPLATES.filter((entry) => entry.category === category).map((entry) => (
                          <TemplateRow key={entry.id} id={entry.id} active={templateId === entry.id} onSelect={() => { setTemplateId(entry.id); setExamType(entry.name); setTitle(`${entry.name} ${new Date().getFullYear() + 1}`); setDailyGoal(entry.recommendedDailyGoal); }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {source === 'paste' && (
            <div className="pl-field">
              <label htmlFor="paste-syllabus">Paste syllabus</label>
              <textarea
                id="paste-syllabus"
                rows={12}
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
                placeholder={'Quantitative Aptitude:\n- Percentage\n  * Percentage basics\n  * Successive change\n- Time & Work\n  * Efficiency method'}
              />
              <small>Subject lines end with “:”, chapters start with “-”, topics start with “*”.</small>
            </div>
          )}

          {source === 'custom' && (
            <div className="pl-note">
              <Sparkles size={16} />
              <span>Your plan starts empty. Add subjects, chapters and topics from the Syllabus tab after creating it.</span>
              <button className="pl-btn ghost" onClick={() => setCustomSubjects((current) => [...current, makeSubject(`Subject ${current.length + 1}`, '#3f6fd9')])}>
                Add a subject now ({customSubjects.length})
              </button>
            </div>
          )}
        </Card>
      )}

      {step === 1 && (
        <Card title="Let's set up your plan" subtitle="Exam details drive every date in your calendar.">
          <div className="pl-form-grid">
            <div className="pl-field">
              <label htmlFor="plan-title">Plan title</label>
              <input id="plan-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. SSC CGL 2026" />
            </div>
            <div className="pl-field">
              <label htmlFor="plan-exam">Enter your exact exam</label>
              <input id="plan-exam" value={examType} onChange={(event) => setExamType(event.target.value)} placeholder="e.g. RRB NTPC" />
            </div>
            <div className="pl-field">
              <label htmlFor="plan-date">When is your exam?</label>
              <input id="plan-date" type="date" value={examDate} min={addDays(todayKey(), 1)} onChange={(event) => setExamDate(event.target.value)} />
            </div>
            <div className="pl-field">
              <label htmlFor="plan-desc">Description (optional)</label>
              <input id="plan-desc" placeholder="Notes about this attempt" onChange={() => undefined} />
            </div>
          </div>
          <div className="pl-stat-row">
            <div><strong>{stats.subjectCount}</strong><span>Subjects</span></div>
            <div><strong>{stats.chapterCount}</strong><span>Chapters</span></div>
            <div><strong>{stats.topicCount}</strong><span>Topics</span></div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="How many topics per day?" subtitle="Big topics count as more. We use effort points behind the scenes.">
          <div className="pl-goal">
            <input type="range" min={1} max={20} value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))} aria-label="Topics per day" />
            <div className="pl-goal-value"><strong>{dailyGoal}</strong><span>topics / day</span></div>
          </div>
          <p className="pl-hint">
            {required > dailyGoal
              ? `To finish all topics before your exam, your daily goal should be about ${required} topics/day.`
              : 'Your plan fits before your exam.'}
          </p>
          <h4 className="pl-subhead">MY REST DAYS</h4>
          <div className="pl-weekdays">
            {WEEKDAYS.map((label, day) => (
              <button key={label} className={offDays.includes(day) ? 'active' : ''} onClick={() => toggleOffDay(day)} aria-pressed={offDays.includes(day)}>
                {label}
              </button>
            ))}
          </div>
          <small className="pl-hint">Rest days are skipped when topics are placed on the calendar.</small>
        </Card>
      )}

      {step === 3 && (
        <Card title="Rate your chapters" subtitle="Only rate the hard ones. We rated these for you — change any you disagree with.">
          {toughChapters.length === 0 ? (
            <p className="pl-hint">No chapters yet. Add subjects and chapters after creating the plan.</p>
          ) : (
            <div className="pl-rate-list">
              {toughChapters.map((row) => {
                const key = `${row.subject}::${row.chapter}`;
                const value = ratings[key] ?? row.current;
                return (
                  <div key={key} className="pl-rate-row">
                    <div>
                      <strong>{row.chapter}</strong>
                      <span>{row.subject}</span>
                    </div>
                    <Chips
                      value={value}
                      options={[
                        { value: 'easy', label: 'Easy' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'tough', label: 'Tough' },
                      ]}
                      onChange={(next) => setRatings((current) => ({ ...current, [key]: next }))}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card title="How should we plan your days?" subtitle="Choose how topics are placed on your study days.">
          <Chips value={strategy} options={STRATEGY_OPTIONS} onChange={setStrategy} />
          {strategy === 'priority' && (
            <>
              <h4 className="pl-subhead">Pick your 2-3 hardest subjects</h4>
              <div className="pl-chips">
                {draft.subjects.map((subject) => (
                  <button key={subject.id} className={prioritySubjects.includes(subject.name) ? 'chip active' : 'chip'} onClick={() => togglePriority(subject.name)}>
                    <span>{subject.name}</span>
                  </button>
                ))}
              </div>
              <Chips
                value={priorityOrderMode}
                options={[
                  { value: 'daily', label: 'A topic every day', hint: 'Priority subjects appear first each day.' },
                  { value: 'front', label: 'Finish them first', hint: 'Priority subjects are scheduled up front.' },
                ]}
                onChange={setPriorityOrderMode}
              />
            </>
          )}
          <h4 className="pl-subhead">Overload handling</h4>
          <Chips value={overloadMode} options={OVERLOAD_OPTIONS} onChange={setOverloadMode} />
          <label className="pl-switch">
            <input type="checkbox" checked={weighted} onChange={(event) => setWeighted(event.target.checked)} />
            <span>Weighted planning — big topics count more</span>
          </label>
        </Card>
      )}

      {step === 5 && preview && (
        <Card title="Review your plan" subtitle="Here's your schedule before we build it.">
          <div className="pl-stat-row">
            <div><strong>{preview.summary.subjectCount}</strong><span>Subjects</span></div>
            <div><strong>{preview.summary.totalTopics}</strong><span>Topics</span></div>
            <div><strong>{preview.summary.daysUntilExam}</strong><span>Days to exam</span></div>
            <div><strong>{preview.summary.requiredPerDay}</strong><span>Needed / day</span></div>
          </div>
          <div className="pl-preview-line">
            <span>Topics scheduled</span>
            <strong>{preview.summary.scheduleAssigned}</strong>
          </div>
          <Bar value={preview.summary.totalTopics === 0 ? 0 : Math.round((preview.summary.scheduleAssigned / preview.summary.totalTopics) * 100)} />
          {preview.summary.scheduleSkipped > 0 && (
            <p className="pl-warn">{preview.summary.scheduleSkipped} topics still need dates. Increase Topics per day or choose a later exam date.</p>
          )}
          {preview.warnings.map((warning) => <p key={warning} className="pl-warn">{warning}</p>)}
          <h4 className="pl-subhead">First study days</h4>
          <div className="pl-preview-days">
            {Object.keys(preview.calendarPreview).sort().slice(0, 5).map((key) => (
              <div key={key} className="pl-preview-day">
                <strong>{formatShort(key)}</strong>
                <ul>
                  {preview.calendarPreview[key].slice(0, 4).map((item) => (
                    <li key={item.topicId}><i style={{ background: item.subjectColor }} />{item.topicName}</li>
                  ))}
                </ul>
                {preview.calendarPreview[key].length > 4 && <small>+{preview.calendarPreview[key].length - 4} more</small>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="pl-wizard-actions">
        <button className="pl-btn ghost" onClick={back}><ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}</button>
        <button className="pl-btn primary" onClick={next} disabled={!canAdvance()}>
          {step === 5 ? 'Build my plan' : 'Continue'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TemplateRow({ id, active, onSelect }: { id: string; active: boolean; onSelect: () => void }) {
  const template = EXAM_TEMPLATES.find((entry) => entry.id === id);
  if (!template) return null;
  const stats = statsForTemplate(template);
  return (
    <button className={active ? 'pl-template active' : 'pl-template'} onClick={onSelect}>
      <div>
        <strong>{template.name}</strong>
        <span>{template.description}</span>
      </div>
      <small>{stats.subjectCount} subjects · {stats.chapterCount} chapters · {stats.topicCount} topics</small>
      {active && <b><Check size={14} /></b>}
    </button>
  );
}
