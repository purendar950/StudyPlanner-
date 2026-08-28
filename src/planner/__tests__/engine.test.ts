import { describe, expect, it } from 'vitest';
import {
  autoDistribute, buildCalendar, createPlan, currentStreak, effectiveSize, effortPoints, extendPlan,
  finishDay, missedTopics, parsePastedSyllabus, planProgress, requiredPerDay, resetPlan, revisionQueue,
  setTopicStatus, studyDays, syllabusStats, undoSnapshot, walkTopics,
} from '../engine';
import { addDays, todayKey, weekdayOf } from '../dates';
import { EXAM_TEMPLATES, statsForTemplate, templateById } from '../templates';

const template = templateById('ssc-cgl')!;

function plan(overrides: Partial<Parameters<typeof createPlan>[0]> = {}) {
  return createPlan({
    title: 'SSC CGL 2027',
    examType: 'SSC CGL',
    examDate: addDays(todayKey(), 200),
    dailyGoal: 6,
    offDays: [],
    template,
    ...overrides,
  });
}

describe('templates', () => {
  it('ships a full subject/chapter/topic tree for every exam', () => {
    for (const entry of EXAM_TEMPLATES) {
      const stats = statsForTemplate(entry);
      if (entry.id === 'custom-blank') {
        expect(stats.topicCount).toBe(0);
        continue;
      }
      expect(stats.subjectCount).toBeGreaterThan(2);
      expect(stats.chapterCount).toBeGreaterThan(10);
      expect(stats.topicCount).toBeGreaterThan(50);
    }
  });

  it('creates a plan carrying the template hierarchy', () => {
    const created = plan();
    const stats = syllabusStats(created);
    expect(stats).toEqual(statsForTemplate(template));
    expect(created.subjects[0].chapters[0].topics.length).toBeGreaterThan(0);
  });
});

describe('effort weighting', () => {
  it('falls back to chapter difficulty when a topic has no size', () => {
    const created = plan();
    const chapter = created.subjects[0].chapters[0];
    chapter.difficulty = 'tough';
    const topic = { ...chapter.topics[0], size: null };
    expect(effectiveSize(topic, chapter)).toBe('big');
    expect(effortPoints(topic, chapter)).toBe(4);
  });
});

describe('auto distribute', () => {
  it('respects the daily goal and skips rest days', () => {
    const created = plan({ offDays: [0, 6], dailyGoal: 4 });
    const result = autoDistribute(created, { fromDate: todayKey() });
    const calendar = buildCalendar(result.plan);
    for (const key of Object.keys(calendar)) {
      expect([0, 6]).not.toContain(weekdayOf(key));
    }
    expect(result.assigned).toBeGreaterThan(0);
  });

  it('never exceeds the goal in strict mode', () => {
    const created = plan({ dailyGoal: 3 });
    const result = autoDistribute(created, { fromDate: todayKey(), overloadMode: 'strict' });
    const perDay = new Map<string, number>();
    for (const ref of walkTopics(result.plan)) {
      if (!ref.topic.plannedDate) continue;
      perDay.set(ref.topic.plannedDate, (perDay.get(ref.topic.plannedDate) ?? 0) + effortPoints(ref.topic, ref.chapter));
    }
    // A single oversized topic may still occupy an otherwise empty day.
    for (const points of perDay.values()) expect(points).toBeLessThanOrEqual(Math.max(6, 3 * 2));
  });

  it('balanced strategy rotates subjects across the first days', () => {
    const created = plan({ dailyGoal: 8 });
    const result = autoDistribute(created, { fromDate: todayKey(), strategy: 'balanced' });
    const first = buildCalendar(result.plan)[studyDays(result.plan)[0]] ?? [];
    expect(new Set(first.map((item) => item.subjectName)).size).toBeGreaterThan(1);
  });

  it('sequential strategy keeps syllabus order', () => {
    const created = plan({ dailyGoal: 8 });
    const result = autoDistribute(created, { fromDate: todayKey(), strategy: 'sequential' });
    const first = buildCalendar(result.plan)[studyDays(result.plan)[0]] ?? [];
    expect(new Set(first.map((item) => item.subjectName)).size).toBe(1);
  });

  it('reports skipped topics when the exam is too close', () => {
    const created = plan({ examDate: addDays(todayKey(), 3), dailyGoal: 1 });
    const result = autoDistribute(created, { fromDate: todayKey() });
    expect(result.skipped).toBeGreaterThan(0);
    expect(result.warnings.join(' ')).toContain('still need dates');
  });
});

describe('progress and streaks', () => {
  it('rolls up subject and chapter completion', () => {
    let created = plan();
    const chapter = created.subjects[0].chapters[0];
    for (const topic of chapter.topics) created = setTopicStatus(created, topic.id, 'done');
    const progress = planProgress(created);
    const subject = progress.bySubject[0];
    expect(subject.byChapter[0].completionPercent).toBe(100);
    expect(progress.doneTopics).toBe(chapter.topics.length);
    expect(progress.remainingPercent).toBe(100 - progress.completionPercent);
  });

  it('counts consecutive completion days', () => {
    let created = plan();
    const topics = walkTopics(created).slice(0, 2);
    created = setTopicStatus(created, topics[0].topic.id, 'done', todayKey());
    created = setTopicStatus(created, topics[1].topic.id, 'done', addDays(todayKey(), -1));
    expect(currentStreak(created)).toBe(2);
  });

  it('required per day grows as the exam approaches', () => {
    const far = plan({ examDate: addDays(todayKey(), 300) });
    const near = plan({ examDate: addDays(todayKey(), 30) });
    expect(requiredPerDay(near)).toBeGreaterThan(requiredPerDay(far));
  });
});

describe('revision', () => {
  it('schedules spaced revision when a topic is completed', () => {
    const created = plan();
    const topicId = walkTopics(created)[0].topic.id;
    const next = setTopicStatus(created, topicId, 'done', todayKey());
    const ref = walkTopics(next).find((entry) => entry.topic.id === topicId)!;
    expect(ref.topic.revisionScheduleType).toBe('spaced');
    expect(ref.topic.revisionReminderDates).toEqual([1, 3, 7, 21].map((offset) => addDays(todayKey(), offset)));
    expect(revisionQueue(next).length).toBe(4);
  });
});

describe('finish day and undo', () => {
  it('moves unfinished topics forward and can be undone', () => {
    const created = autoDistribute(plan({ dailyGoal: 3 }), { fromDate: todayKey() }).plan;
    const before = buildCalendar(created)[todayKey()] ?? [];
    expect(before.length).toBeGreaterThan(0);

    const result = finishDay(created, todayKey());
    expect(result.movedCount).toBe(before.length);
    expect(buildCalendar(result.plan)[todayKey()] ?? []).toHaveLength(0);
    expect(missedTopics(result.plan).length).toBeGreaterThan(0);

    const restored = undoSnapshot(result.plan, result.undoToken);
    expect((buildCalendar(restored)[todayKey()] ?? []).length).toBe(before.length);
  });
});

describe('plan lifecycle', () => {
  it('extend keeps existing dates and schedules leftovers', () => {
    const created = autoDistribute(plan({ examDate: addDays(todayKey(), 20), dailyGoal: 2 }), { fromDate: todayKey() }).plan;
    const skippedBefore = walkTopics(created).filter((ref) => ref.topic.plannedDate === null).length;
    const extended = extendPlan(created, addDays(todayKey(), 400));
    const skippedAfter = walkTopics(extended.plan).filter((ref) => ref.topic.plannedDate === null).length;
    expect(skippedAfter).toBeLessThan(skippedBefore);
  });

  it('reset clears dates and completion but keeps the syllabus', () => {
    let created = autoDistribute(plan(), { fromDate: todayKey() }).plan;
    created = setTopicStatus(created, walkTopics(created)[0].topic.id, 'done');
    const reset = resetPlan(created);
    expect(syllabusStats(reset)).toEqual(syllabusStats(created));
    expect(walkTopics(reset).every((ref) => ref.topic.plannedDate === null && ref.topic.status === 'todo')).toBe(true);
    expect(reset.restoreSnapshots.length).toBe(1);
  });
});

describe('paste import', () => {
  it('parses subject, chapter and topic levels', () => {
    const subjects = parsePastedSyllabus([
      'Quantitative Aptitude:',
      '- Percentage',
      '  * Percentage basics',
      '  * Successive change',
      '- Time & Work',
      '  * Efficiency method',
      'Reasoning:',
      '- Syllogism',
      '  * Venn diagram',
    ].join('\n'));

    expect(subjects.map((subject) => subject.name)).toEqual(['Quantitative Aptitude', 'Reasoning']);
    expect(subjects[0].chapters.map((chapter) => chapter.name)).toEqual(['Percentage', 'Time & Work']);
    expect(subjects[0].chapters[0].topics.map((topic) => topic.name)).toEqual(['Percentage basics', 'Successive change']);
    expect(subjects[1].chapters[0].topics).toHaveLength(1);
  });
});
