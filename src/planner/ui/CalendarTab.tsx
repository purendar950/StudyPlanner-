/** Calendar tab: month grid with per-day load, day sheet with status buttons and move/swap. */
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Repeat } from 'lucide-react';
import type { StudyPlan, TopicStatusValue } from '../types';
import { buildCalendar, dayLoad, isStudyDay, moveTopicToDate, planProgress, setTopicStatus, swapTopics } from '../engine';
import { WEEKDAYS, addDays, formatLong, isSameMonth, monthGrid, monthLabel, parseKey, todayKey } from '../dates';
import { Card, Empty, Sheet, Toast } from './primitives';

export function CalendarTab({ plan, onChange }: { plan: StudyPlan; onChange: (plan: StudyPlan) => void }) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const date = parseKey(today);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const calendar = useMemo(() => buildCalendar(plan), [plan]);
  const progress = useMemo(() => planProgress(plan), [plan]);
  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const goalPoints = plan.dailyGoal * 2;

  const shift = (delta: number) => setCursor((current) => {
    const date = new Date(current.year, current.month + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  return (
    <div className="pl-stack">
      <Card title="Study Calendar" subtitle="Tap a day to see its topics.">
        <div className="pl-cal-head">
          <button className="pl-icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <strong>{monthLabel(cursor.year, cursor.month)}</strong>
          <button className="pl-icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        <div className="pl-cal-weekdays">{WEEKDAYS.map((label) => <span key={label}>{label}</span>)}</div>
        <div className="pl-cal-grid">
          {grid.map((key) => {
            const items = calendar[key] ?? [];
            const load = dayLoad(plan, key);
            const outside = !isSameMonth(key, cursor.year, cursor.month);
            const rest = !isStudyDay(plan, key);
            const heavy = load > goalPoints;
            const allDone = items.length > 0 && items.every((item) => item.status === 'done');
            const isExam = key === plan.examDate;
            return (
              <button
                key={key}
                className={[
                  'pl-cal-day',
                  outside ? 'outside' : '',
                  rest ? 'rest' : '',
                  key === today ? 'today' : '',
                  heavy ? 'heavy' : '',
                  allDone ? 'complete' : '',
                  isExam ? 'exam' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelected(key)}
              >
                <span className="pl-cal-num">{parseKey(key).getDate()}</span>
                {items.length > 0 && (
                  <span className="pl-cal-dots">
                    {items.slice(0, 4).map((item, index) => (
                      <i key={`${item.topicId}-${index}`} style={{ background: item.subjectColor }} />
                    ))}
                  </span>
                )}
                {items.length > 0 && <small>{items.length}</small>}
                {isExam && <em>EXAM</em>}
              </button>
            );
          })}
        </div>
        <div className="pl-cal-legend">
          <span><i className="dot today" /> Today</span>
          <span><i className="dot rest" /> Rest day</span>
          <span><i className="dot heavy" /> Over goal</span>
          <span><i className="dot complete" /> All done</span>
        </div>
      </Card>

      <Card title="Plan Overview">
        <div className="pl-stat-row">
          <div><strong>{progress.doneTopics}</strong><span>Done</span></div>
          <div><strong>{progress.inProgressTopics}</strong><span>Scheduled</span></div>
          <div><strong>{progress.revisionTopics}</strong><span>To revise</span></div>
          <div><strong>{progress.totalTopics - progress.doneTopics}</strong><span>Remaining</span></div>
        </div>
      </Card>

      {selected && (
        <Sheet title={formatLong(selected)} onClose={() => { setSelected(null); setSwapFrom(null); }}>
          {!isStudyDay(plan, selected) && <p className="pl-hint">This is a rest day. Topics are not placed here automatically.</p>}
          {(calendar[selected] ?? []).length === 0 ? (
            <Empty title="No topics planned for this day." body="Move a topic here from another day, or rebuild your schedule." />
          ) : (
            <ul className="pl-topic-list">
              {(calendar[selected] ?? []).map((item) => (
                <li key={`${item.topicId}-${item.isRevision ? 'rev' : 'plan'}`} className={item.status === 'done' ? 'done' : ''}>
                  <button
                    className="pl-check"
                    aria-label={`Mark ${item.topicName}`}
                    onClick={() => {
                      const order: TopicStatusValue[] = ['todo', 'done', 'revision_needed'];
                      const next = order[(order.indexOf(item.status) + 1) % order.length];
                      onChange(setTopicStatus(plan, item.topicId, next, selected));
                    }}
                  >
                    {item.status === 'done' ? <CheckCircle2 size={19} /> : item.status === 'revision_needed' ? <Repeat size={18} /> : <Circle size={19} />}
                  </button>
                  <div className="pl-topic-main">
                    <strong>{item.topicName}</strong>
                    <span><i style={{ background: item.subjectColor }} />{item.subjectName} · {item.chapterName}</span>
                  </div>
                  <div className="pl-topic-meta">
                    {item.isRevision && <em className="pl-tag revise">Revision</em>}
                    <button
                      className="pl-btn tiny"
                      onClick={() => onChange(moveTopicToDate(plan, item.topicId, addDays(selected, 1)))}
                    >Move +1 day</button>
                    <button
                      className="pl-btn tiny"
                      onClick={() => {
                        if (!swapFrom) { setSwapFrom(item.topicId); setToast('Now pick the topic to swap with.'); return; }
                        if (swapFrom === item.topicId) { setSwapFrom(null); return; }
                        onChange(swapTopics(plan, swapFrom, item.topicId));
                        setSwapFrom(null);
                        setToast('Topics swapped');
                      }}
                    >{swapFrom === item.topicId ? 'Swapping…' : 'Swap'}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="pl-row-actions">
            <button
              className="pl-btn ghost"
              onClick={() => {
                const isRest = plan.offDates.includes(selected);
                onChange({
                  ...plan,
                  offDates: isRest ? plan.offDates.filter((entry) => entry !== selected) : [...plan.offDates, selected],
                });
                setToast(isRest ? 'Rest day removed' : 'Marked as rest day');
              }}
            >
              {plan.offDates.includes(selected) ? 'Remove rest day' : 'Mark as rest day'}
            </button>
          </div>
        </Sheet>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
