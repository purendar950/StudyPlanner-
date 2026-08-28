/** Home / Today tab: daily topic list, daily to-dos, streak and finish-day. */
import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, Flame, MoveRight, Plus, RotateCcw, Repeat, Zap } from 'lucide-react';
import type { CalendarTopicItem, StudyPlan, TopicStatusValue } from '../types';
import { TOPIC_SIZE } from '../types';
import {
  autoDistribute, currentStreak, dailyTodoPercent, finishDay, missedTopics, moveTopicToDate,
  newId, planProgress, setTopicStatus, todayLabelForPlan, topicsForDate, unscheduledTopics, undoSnapshot,
} from '../engine';
import { addDays, formatLong, todayKey } from '../dates';
import { Bar, Card, Empty, Ring, Sheet, Toast } from './primitives';

export function TodayTab({ plan, onChange, goTo }: {
  plan: StudyPlan;
  onChange: (plan: StudyPlan) => void;
  goTo: (section: 'syllabus' | 'calendar' | 'plans' | 'revision' | 'insights') => void;
}) {
  const today = todayKey();
  const [toast, setToast] = useState<{ message: string; token?: string } | null>(null);
  const [addSheet, setAddSheet] = useState(false);
  const [todoName, setTodoName] = useState('');

  const items = useMemo(() => topicsForDate(plan, today), [plan, today]);
  const progress = useMemo(() => planProgress(plan), [plan]);
  const streak = useMemo(() => currentStreak(plan), [plan]);
  const missed = useMemo(() => missedTopics(plan), [plan]);
  const unscheduled = useMemo(() => unscheduledTopics(plan), [plan]);
  const closed = plan.closedStudyDays.includes(today);

  const doneCount = items.filter((item) => item.status === 'done').length;
  const dayPercent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);
  const todoPercent = dailyTodoPercent(plan, today);
  const todoDone = plan.dailyTodoLogs[today] ?? [];

  const cycleStatus = (item: CalendarTopicItem) => {
    const order: TopicStatusValue[] = ['todo', 'done', 'revision_needed'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    onChange(setTopicStatus(plan, item.topicId, next, today));
  };

  const toggleTodo = (todoId: string) => {
    const current = plan.dailyTodoLogs[today] ?? [];
    const nextIds = current.includes(todoId) ? current.filter((entry) => entry !== todoId) : [...current, todoId];
    onChange({ ...plan, dailyTodoLogs: { ...plan.dailyTodoLogs, [today]: nextIds } });
  };

  const onFinishDay = () => {
    const result = finishDay(plan, today);
    onChange(result.plan);
    setToast({
      message: result.movedCount === 0
        ? 'Done for the day. Every topic was finished.'
        : `Done for the day. ${result.movedCount} remaining ${result.movedCount === 1 ? 'topic' : 'topics'} moved to Missed.`,
      token: result.undoToken,
    });
  };

  const rebuild = () => {
    const result = autoDistribute(plan, { fromDate: today, lockExistingDates: false });
    onChange(result.plan);
    setToast({ message: result.message });
  };

  return (
    <div className="pl-stack">
      <Card tone="accent">
        <div className="pl-hero">
          <div>
            <span className="pl-hero-exam">{plan.examType}</span>
            <h2>{plan.title}</h2>
            <p>{formatLong(today)} · {todayLabelForPlan(plan)}</p>
          </div>
          <Ring value={progress.completionPercent} label="Syllabus" sub={`${progress.doneTopics}/${progress.totalTopics} topics`} />
        </div>
        <div className="pl-hero-stats">
          <div><Flame size={16} /><strong>{streak}</strong><span>Day streak</span></div>
          <div><CalendarDays size={16} /><strong>{plan.dailyGoal}</strong><span>Goal / day</span></div>
          <div><Zap size={16} /><strong>{progress.revisionTopics}</strong><span>To revise</span></div>
        </div>
      </Card>

      {plan.subjects.length === 0 && (
        <Card>
          <Empty
            title="Your plan is empty"
            body="Add subjects and topics first. Then you can build your study schedule."
            action={<button className="pl-btn primary" onClick={() => goTo('syllabus')}>Go to Syllabus</button>}
          />
        </Card>
      )}

      <Card
        title="Todays Study Plan"
        subtitle={items.length === 0 ? 'No topics planned for this day.' : `${doneCount} of ${items.length} done`}
        action={<button className="pl-btn ghost" onClick={rebuild}><RotateCcw size={15} /> Rebuild schedule</button>}
      >
        {items.length > 0 && <Bar value={dayPercent} />}
        {items.length === 0 ? (
          <Empty
            title={plan.subjects.length === 0 ? 'Nothing to study yet' : 'All done for this day'}
            body={plan.subjects.length === 0 ? 'Add your syllabus, then build your planner calendar.' : 'Create your planner calendar to place remaining topics.'}
            action={<button className="pl-btn primary" onClick={rebuild}>Create planner calendar</button>}
          />
        ) : (
          <ul className="pl-topic-list">
            {items.map((item) => (
              <li key={`${item.topicId}-${item.isRevision ? 'rev' : 'plan'}`} className={item.status === 'done' ? 'done' : ''}>
                <button className="pl-check" onClick={() => cycleStatus(item)} aria-label={`Mark ${item.topicName}`}>
                  {item.status === 'done' ? <CheckCircle2 size={20} /> : item.status === 'revision_needed' ? <Repeat size={19} /> : <Circle size={20} />}
                </button>
                <div className="pl-topic-main">
                  <strong>{item.topicName}</strong>
                  <span><i style={{ background: item.subjectColor }} />{item.subjectName} · {item.chapterName}</span>
                </div>
                <div className="pl-topic-meta">
                  {item.isRevision && <em className="pl-tag revise">Revision</em>}
                  <em className={`pl-tag size-${item.size}`}>{TOPIC_SIZE[item.size].label}</em>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 0 && (
          <div className="pl-row-actions">
            <button className="pl-btn ghost" onClick={() => setAddSheet(true)}><Plus size={15} /> Add a topic to today</button>
            <button className="pl-btn primary" onClick={onFinishDay} disabled={closed}>
              {closed ? 'Day cleared' : 'Finish day'}
            </button>
          </div>
        )}
      </Card>

      <Card
        title="Daily To-Do List"
        subtitle="Add a few recurring habits you want to track every day."
        action={<span className="pl-pct">{todoPercent}%</span>}
      >
        {plan.dailyTodos.length > 0 && <Bar value={todoPercent} />}
        <ul className="pl-todo-list">
          {plan.dailyTodos.map((todo) => (
            <li key={todo.id}>
              <button onClick={() => toggleTodo(todo.id)} aria-pressed={todoDone.includes(todo.id)}>
                {todoDone.includes(todo.id) ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span className={todoDone.includes(todo.id) ? 'done' : ''}>{todo.name}</span>
              </button>
              <button
                className="pl-icon-btn"
                aria-label={`Delete ${todo.name}`}
                onClick={() => onChange({ ...plan, dailyTodos: plan.dailyTodos.filter((entry) => entry.id !== todo.id) })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <form
          className="pl-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const name = todoName.trim();
            if (!name) return;
            onChange({ ...plan, dailyTodos: [...plan.dailyTodos, { id: newId('todo'), name }] });
            setTodoName('');
          }}
        >
          <input value={todoName} onChange={(event) => setTodoName(event.target.value)} placeholder="Add daily topic — e.g. Revise vocabulary" aria-label="Add daily to-do" />
          <button className="pl-btn ghost" type="submit"><Plus size={15} /> Add</button>
        </form>
      </Card>

      {(missed.length > 0 || unscheduled.length > 0) && (
        <Card title="Needs attention">
          {missed.length > 0 && (
            <button className="pl-alert" onClick={() => goTo('revision')}>
              <strong>Missed topics: {missed.length}</strong>
              <span>You missed {missed.length} {missed.length === 1 ? 'topic' : 'topics'}. Life happens — give them new dates.</span>
              <MoveRight size={16} />
            </button>
          )}
          {unscheduled.length > 0 && (
            <button className="pl-alert" onClick={rebuild}>
              <strong>Topics without a date: {unscheduled.length}</strong>
              <span>Topics are in your syllabus but not assigned. Tap to assign them.</span>
              <MoveRight size={16} />
            </button>
          )}
        </Card>
      )}

      {addSheet && (
        <AddToTodaySheet plan={plan} onClose={() => setAddSheet(false)} onPick={(topicId) => {
          onChange(moveTopicToDate(plan, topicId, today));
          setAddSheet(false);
          setToast({ message: 'Added to today' });
        }} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          actionLabel={toast.token ? 'Undo' : undefined}
          onAction={toast.token ? () => { onChange(undoSnapshot(plan, toast.token as string)); setToast({ message: "Today's tasks restored" }); } : undefined}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

function AddToTodaySheet({ plan, onClose, onPick }: { plan: StudyPlan; onClose: () => void; onPick: (topicId: string) => void }) {
  const [query, setQuery] = useState('');
  const candidates = useMemo(() => {
    const today = todayKey();
    const rows: { id: string; name: string; subject: string; chapter: string; color: string }[] = [];
    for (const subject of plan.subjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          if (topic.status === 'done' || topic.plannedDate === today) continue;
          rows.push({ id: topic.id, name: topic.name, subject: subject.name, chapter: chapter.name, color: subject.color });
        }
      }
    }
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter((row) => `${row.name} ${row.chapter} ${row.subject}`.toLowerCase().includes(needle)) : rows.slice(0, 60);
  }, [plan, query]);

  return (
    <Sheet title="Choose a topic for today" onClose={onClose}>
      <input className="pl-sheet-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics…" aria-label="Search topics" />
      {candidates.length === 0 ? (
        <p className="pl-hint">No topic matches “{query}”.</p>
      ) : (
        <ul className="pl-pick-list">
          {candidates.map((row) => (
            <li key={row.id}>
              <button onClick={() => onPick(row.id)}>
                <i style={{ background: row.color }} />
                <div><strong>{row.name}</strong><span>{row.subject} · {row.chapter}</span></div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="pl-hint">Moving a topic to today does not change your other days. Tomorrow is {formatLong(addDays(todayKey(), 1))}.</p>
    </Sheet>
  );
}
