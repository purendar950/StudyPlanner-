/** Revision tab: spaced/custom revision queue plus missed and unscheduled topics. */
import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Trash2 } from 'lucide-react';
import type { StudyPlan } from '../types';
import {
  autoDistribute, changeRevisionDate, completeRevision, missedTopics, moveTopicToDate,
  removeRevision, revisionQueue, scheduleRevision, unscheduledTopics,
} from '../engine';
import { addDays, formatShort, todayKey } from '../dates';
import { Card, Empty, Sheet, Toast } from './primitives';

export function RevisionTab({ plan, onChange }: { plan: StudyPlan; onChange: (plan: StudyPlan) => void }) {
  const today = todayKey();
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ topicId: string; date: string } | null>(null);

  const queue = useMemo(() => revisionQueue(plan), [plan]);
  const missed = useMemo(() => missedTopics(plan), [plan]);
  const unscheduled = useMemo(() => unscheduledTopics(plan), [plan]);
  const dueToday = queue.filter((entry) => entry.date <= today);
  const upcoming = queue.filter((entry) => entry.date > today);

  const restoreMissed = () => {
    const result = autoDistribute(plan, { fromDate: today, lockExistingDates: true, onlyTopicIds: missed.map((ref) => ref.topic.id) });
    onChange(result.plan);
    setToast('Missed topics restored');
  };

  const assignUnscheduled = () => {
    const result = autoDistribute(plan, { fromDate: today, lockExistingDates: true, onlyTopicIds: unscheduled.map((ref) => ref.topic.id) });
    onChange(result.plan);
    setToast(result.message);
  };

  return (
    <div className="pl-stack">
      <Card title="Revision & Missed Topics" subtitle="Topics marked for revision show up here to help you consolidate your learning.">
        <div className="pl-stat-row">
          <div><strong>{dueToday.length}</strong><span>Due now</span></div>
          <div><strong>{upcoming.length}</strong><span>Upcoming</span></div>
          <div><strong>{missed.length}</strong><span>Missed</span></div>
          <div><strong>{unscheduled.length}</strong><span>No date</span></div>
        </div>
      </Card>

      <Card title="Revision Tasks" subtitle={dueToday.length === 0 ? 'No Revision Scheduled' : 'Time to revise'}>
        {dueToday.length === 0 ? (
          <Empty title="Nothing to revise right now" body="Finish topics to build your spaced revision queue, or mark a topic as “To Revise”." />
        ) : (
          <ul className="pl-topic-list">
            {dueToday.map(({ ref, date, overdue }) => (
              <li key={`${ref.topic.id}-${date}`}>
                <button className="pl-check" aria-label={`Revised ${ref.topic.name}`} onClick={() => { onChange(completeRevision(plan, ref.topic.id, date, today)); setToast('Revised'); }}>
                  <CheckCircle2 size={19} />
                </button>
                <div className="pl-topic-main">
                  <strong>{ref.topic.name}</strong>
                  <span><i style={{ background: ref.subject.color }} />{ref.subject.name} · {ref.chapter.name}</span>
                </div>
                <div className="pl-topic-meta">
                  <em className={overdue ? 'pl-tag missed' : 'pl-tag revise'}>{overdue ? `Late · ${formatShort(date)}` : formatShort(date)}</em>
                  <button className="pl-btn tiny" onClick={() => setEditing({ topicId: ref.topic.id, date })}><CalendarClock size={13} /> Reschedule</button>
                  <button className="pl-icon-btn danger" aria-label="Remove revision schedule" onClick={() => { onChange(removeRevision(plan, ref.topic.id)); setToast('Revision schedule removed'); }}><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {upcoming.length > 0 && (
        <Card title="Scheduled for revision" subtitle="Spaced revision keeps topics fresh.">
          <ul className="pl-topic-rows">
            {upcoming.slice(0, 25).map(({ ref, date }) => (
              <li key={`${ref.topic.id}-${date}`}>
                <div>
                  <strong>{ref.topic.name}</strong>
                  <span>{ref.subject.name} · {formatShort(date)} · {ref.topic.revisionScheduleType === 'spaced' ? 'Spaced revision' : 'Custom revision'}</span>
                </div>
                <button className="pl-btn tiny" onClick={() => setEditing({ topicId: ref.topic.id, date })}>Change date</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {missed.length > 0 && (
        <Card
          title="Missed topics"
          subtitle="This will give new dates to your unfinished topics. Today's work will stay the same."
          action={<button className="pl-btn primary" onClick={restoreMissed}>Give new dates</button>}
        >
          <ul className="pl-topic-rows">
            {missed.slice(0, 25).map((ref) => (
              <li key={ref.topic.id}>
                <div>
                  <strong>{ref.topic.name}</strong>
                  <span>{ref.subject.name} · was {ref.topic.plannedDate ? formatShort(ref.topic.plannedDate) : 'unplanned'}</span>
                </div>
                <button className="pl-btn tiny" onClick={() => { onChange(moveTopicToDate(plan, ref.topic.id, today)); setToast('Moved to today'); }}>Move to today</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {unscheduled.length > 0 && (
        <Card
          title="Topics without a date"
          subtitle="Topics are in your syllabus but not assigned."
          action={<button className="pl-btn primary" onClick={assignUnscheduled}>Give dates to these topics</button>}
        >
          <p className="pl-hint">{unscheduled.length} topics still need dates. Increase Topics per day to make room for these topics.</p>
        </Card>
      )}

      {editing && (
        <RevisionDateSheet
          initial={editing.date}
          onClose={() => setEditing(null)}
          onSave={(date) => {
            onChange(changeRevisionDate(plan, editing.topicId, editing.date, date));
            setEditing(null);
            setToast(`Revision moved to ${formatShort(date)}`);
          }}
          onSpaced={() => {
            onChange(scheduleRevision(plan, editing.topicId, plan.settings.spacedRevisionOffsets.map((offset) => addDays(today, offset)), 'spaced'));
            setEditing(null);
            setToast('Spaced revision scheduled');
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function RevisionDateSheet({ initial, onClose, onSave, onSpaced }: {
  initial: string;
  onClose: () => void;
  onSave: (date: string) => void;
  onSpaced: () => void;
}) {
  const [date, setDate] = useState(initial);
  return (
    <Sheet
      title="Edit revision schedule"
      onClose={onClose}
      footer={
        <>
          <button className="pl-btn ghost" onClick={onSpaced}>Use spaced revision</button>
          <button className="pl-btn primary" onClick={() => onSave(date)}>Save</button>
        </>
      }
    >
      <div className="pl-field">
        <label htmlFor="revision-date">Select revision date</label>
        <input id="revision-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <p className="pl-hint">Spaced revision schedules the topic again after 1, 3, 7 and 21 days.</p>
    </Sheet>
  );
}
