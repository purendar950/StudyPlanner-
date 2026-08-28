/** Progress tab: overall rings, subject/chapter mastery, heatmap and consistency. */
import { useMemo } from 'react';
import type { StudyPlan } from '../types';
import { analytics, currentStreak, dailyTodoPercent, requiredPerDay, studyDays } from '../engine';
import { addDays, daysUntil, formatShort, todayKey } from '../dates';
import { Bar, Card, Ring } from './primitives';

export function InsightsTab({ plan }: { plan: StudyPlan }) {
  const today = todayKey();
  const { progress, heatmap } = useMemo(() => analytics(plan), [plan]);
  const streak = useMemo(() => currentStreak(plan), [plan]);
  const required = useMemo(() => requiredPerDay(plan), [plan]);
  const remainingDays = useMemo(() => studyDays(plan, today).length, [plan, today]);

  const counts = useMemo(() => new Map(heatmap.map((point) => [point.date, point.count])), [heatmap]);
  const last90 = useMemo(() => Array.from({ length: 90 }, (_, index) => addDays(today, index - 89)), [today]);
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)), [today]);
  const consistency = Math.round((last7.filter((key) => (counts.get(key) ?? 0) > 0).length / 7) * 100);
  const maxCount = Math.max(1, ...heatmap.map((point) => point.count));

  return (
    <div className="pl-stack">
      <Card title="Progress Insights" subtitle="Track your syllabus progress and schedule health.">
        <div className="pl-ring-row">
          <Ring value={progress.completionPercent} label="Syllabus" sub={`${progress.doneTopics}/${progress.totalTopics}`} />
          <Ring value={consistency} label="Consistency" sub="Last 7 days" />
          <Ring value={dailyTodoPercent(plan, today)} label="Daily to-do" sub={`${plan.dailyTodos.length} habits`} />
        </div>
        <div className="pl-stat-row">
          <div><strong>{streak}</strong><span>Current streak</span></div>
          <div><strong>{daysUntil(plan.examDate)}</strong><span>Days to exam</span></div>
          <div><strong>{remainingDays}</strong><span>Study days left</span></div>
          <div><strong>{required}</strong><span>Needed / day</span></div>
        </div>
        {required > plan.dailyGoal && (
          <p className="pl-warn">Even if you hit your daily goal, you may finish about {required - plan.dailyGoal} topics/day short. Increase Topics per day in Plan settings.</p>
        )}
      </Card>

      <Card title="By subject" subtitle="Average progress across your syllabus.">
        {progress.bySubject.length === 0 ? (
          <p className="pl-hint">No subjects yet.</p>
        ) : (
          <ul className="pl-mastery">
            {progress.bySubject.map((subject) => {
              const color = plan.subjects.find((entry) => entry.id === subject.subjectId)?.color;
              return (
                <li key={subject.subjectId}>
                  <div className="pl-mastery-head">
                    <strong>{subject.subjectName}</strong>
                    <span>{subject.doneTopics}/{subject.totalTopics} · {subject.completionPercent}%</span>
                  </div>
                  <Bar value={subject.completionPercent} tone={color} />
                  <details>
                    <summary>{subject.byChapter.length} chapters</summary>
                    <ul className="pl-chapter-progress">
                      {subject.byChapter.map((chapter) => (
                        <li key={chapter.chapterId}>
                          <span>{chapter.chapterName}</span>
                          <b>{chapter.completionPercent}%</b>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Study heatmap" subtitle="Completed topics and revisions over the last 90 days.">
        <div className="pl-heatmap">
          {last90.map((key) => {
            const count = counts.get(key) ?? 0;
            const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
            return <i key={key} className={`lvl-${level}`} title={`${formatShort(key)} · ${count} completed`} />;
          })}
        </div>
        <div className="pl-heat-legend"><span>Less</span><i className="lvl-1" /><i className="lvl-2" /><i className="lvl-3" /><i className="lvl-4" /><span>More</span></div>
      </Card>
    </div>
  );
}
