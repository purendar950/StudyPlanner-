/**
 * Planner engine.
 *
 * Pure functions that mirror the Safar planner server behaviour:
 * plan creation, weighted auto-distribution, progress rollups, calendar building,
 * finish-day rollover with undo, and spaced/custom revision scheduling.
 */
import {
  CHAPTER_DIFFICULTY, TOPIC_SIZE,
} from './types';
import type {
  CalendarMap, CalendarTopicItem, ChapterDifficultyValue, ChapterProgress, ExamTemplate, HeatmapPoint,
  OverloadMode, PlanProgress, PlanPreviewResult, PlanSettings, PlanStrategy, PlannerAnalytics,
  PlannerPlanSnapshot, StudyChapter, StudyPlan, StudySubject, StudyTopic, SubjectProgress,
  SyllabusStats, TopicSizeValue, TopicStatusValue,
} from './types';
import { addDays, dateKey, diffDays, daysUntil, todayKey, weekdayOf } from './dates';

let idCounter = 0;
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export const DEFAULT_SETTINGS: PlanSettings = {
  strategy: 'balanced',
  overloadMode: 'strict',
  priorityOrderMode: 'daily',
  prioritySubjectNames: [],
  weightedPlanning: true,
  autoRollover: true,
  revisionScheduleType: 'spaced',
  spacedRevisionOffsets: [1, 3, 7, 21],
};

/* ------------------------------------------------------------ effort math */

/** Topic size, falling back to the parent chapter difficulty (Safar `effectiveSize`). */
export function effectiveSize(topic: StudyTopic, chapter?: StudyChapter | null): TopicSizeValue {
  if (topic.size) return topic.size;
  if (chapter) return CHAPTER_DIFFICULTY[chapter.difficulty].size;
  return 'medium';
}

export function effortPoints(topic: StudyTopic, chapter?: StudyChapter | null): number {
  return TOPIC_SIZE[effectiveSize(topic, chapter)].points;
}

/** Safar treats 2 points as one "topic equivalent". */
export function pointsToTopicEquivalents(points: number): number {
  return points / 2;
}

export function progressPercentValue(topic: StudyTopic): number {
  return topic.status === 'done' ? 100 : 0;
}

export function remainingPoints(topic: StudyTopic, chapter?: StudyChapter | null): number {
  return ((100 - progressPercentValue(topic)) * effortPoints(topic, chapter)) / 100;
}

/* ------------------------------------------------------------- plan build */

export function makeTopic(name: string, size: TopicSizeValue | null = null): StudyTopic {
  return {
    id: newId('topic'),
    name,
    status: 'todo',
    size,
    notes: null,
    pinned: false,
    plannedDate: null,
    originalPlannedDate: null,
    completedDate: null,
    missedAt: null,
    missedReason: null,
    revisionScheduleType: 'none',
    revisionReminderDates: [],
    revisionCompletedDates: [],
    revisionCompletionLog: [],
    revisionMarkedAt: null,
  };
}

export function makeChapter(name: string, difficulty: ChapterDifficultyValue = 'normal', topics: StudyTopic[] = []): StudyChapter {
  return { id: newId('chapter'), name, difficulty, topics };
}

export function makeSubject(name: string, color: string, chapters: StudyChapter[] = []): StudySubject {
  return { id: newId('subject'), name, color, weeklyTarget: null, monthlyTarget: null, chapters };
}

export type CreatePlanInput = {
  title: string;
  examType: string;
  examDate: string;
  description?: string | null;
  dailyGoal: number;
  offDays: number[];
  template?: ExamTemplate | null;
  settings?: Partial<PlanSettings>;
};

export function createPlan(input: CreatePlanInput): StudyPlan {
  const now = new Date().toISOString();
  const subjects = (input.template?.subjects ?? []).map((templateSubject) =>
    makeSubject(
      templateSubject.name,
      templateSubject.color,
      templateSubject.chapters.map((templateChapter) =>
        makeChapter(
          templateChapter.name,
          templateChapter.difficulty ?? 'normal',
          templateChapter.topics.map((templateTopic) => makeTopic(templateTopic.name, templateTopic.size)),
        ),
      ),
    ),
  );
  return {
    id: newId('plan'),
    userId: 'local',
    title: input.title,
    examType: input.examType,
    examDate: input.examDate,
    description: input.description ?? null,
    templateId: input.template?.id ?? null,
    dailyGoal: input.dailyGoal,
    offDays: input.offDays,
    offDates: [],
    closedStudyDays: [],
    dailyTodos: [],
    dailyTodoLogs: {},
    subjects,
    settings: { ...DEFAULT_SETTINGS, ...input.settings },
    features: { isPremium: false, unlockedAt: null },
    rolloverDigest: null,
    restoreSnapshots: [],
    undoToken: null,
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------- traversal */

export type TopicRef = { subject: StudySubject; chapter: StudyChapter; topic: StudyTopic };

export function walkTopics(plan: StudyPlan): TopicRef[] {
  const refs: TopicRef[] = [];
  for (const subject of plan.subjects) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) refs.push({ subject, chapter, topic });
    }
  }
  return refs;
}

export function findTopic(plan: StudyPlan, topicId: string): TopicRef | undefined {
  return walkTopics(plan).find((ref) => ref.topic.id === topicId);
}

export function syllabusStats(plan: StudyPlan): SyllabusStats {
  let chapterCount = 0;
  let topicCount = 0;
  for (const subject of plan.subjects) {
    chapterCount += subject.chapters.length;
    for (const chapter of subject.chapters) topicCount += chapter.topics.length;
  }
  return { subjectCount: plan.subjects.length, chapterCount, topicCount };
}

/* ------------------------------------------------------------- study days */

export function isStudyDay(plan: StudyPlan, key: string): boolean {
  if (plan.offDates.includes(key)) return false;
  return !plan.offDays.includes(weekdayOf(key));
}

/** Study days from `fromKey` up to and including the exam date. */
export function studyDays(plan: StudyPlan, fromKey = todayKey()): string[] {
  const days: string[] = [];
  const span = diffDays(fromKey, plan.examDate);
  if (span < 0) return days;
  for (let offset = 0; offset <= span; offset += 1) {
    const key = addDays(fromKey, offset);
    if (isStudyDay(plan, key)) days.push(key);
  }
  return days;
}

/* --------------------------------------------------------- auto-distribute */

export type AutoDistributeOptions = {
  fromDate?: string;
  strategy?: PlanStrategy;
  overloadMode?: OverloadMode;
  prioritySubjectNames?: string[];
  priorityOrderMode?: 'front' | 'daily';
  weightedPlanning?: boolean;
  includeRevisionNeeded?: boolean;
  lockExistingDates?: boolean;
  onlyTopicIds?: string[] | null;
};

export type AutoDistributeResult = {
  plan: StudyPlan;
  assigned: number;
  skipped: number;
  message: string;
  warnings: string[];
};

/**
 * Order pending topics according to the chosen strategy.
 *
 * - `sequential`: syllabus order, subject after subject.
 * - `balanced`: round-robin across subjects so every subject advances daily.
 * - `priority`: same rotation, but priority subjects are pulled forward
 *   (`front`) or guaranteed one topic per rotation (`daily`).
 */
function orderTopics(refs: TopicRef[], settings: Required<Pick<AutoDistributeOptions, 'strategy' | 'prioritySubjectNames' | 'priorityOrderMode'>>): TopicRef[] {
  const { strategy, prioritySubjectNames, priorityOrderMode } = settings;
  if (strategy === 'sequential') return refs;

  const bySubject = new Map<string, TopicRef[]>();
  for (const ref of refs) {
    const list = bySubject.get(ref.subject.id);
    if (list) list.push(ref);
    else bySubject.set(ref.subject.id, [ref]);
  }

  const priority = (subject: StudySubject) => prioritySubjectNames.includes(subject.name);
  let queues = [...bySubject.values()];

  if (strategy === 'priority' && priorityOrderMode === 'front') {
    const front = queues.filter((queue) => priority(queue[0].subject));
    const rest = queues.filter((queue) => !priority(queue[0].subject));
    return [...front.flat(), ...rest.flat()];
  }

  if (strategy === 'priority' && priorityOrderMode === 'daily') {
    // Priority subjects are served first in every rotation.
    queues = [...queues].sort((left, right) => Number(priority(right[0].subject)) - Number(priority(left[0].subject)));
  }

  const ordered: TopicRef[] = [];
  let index = 0;
  while (ordered.length < refs.length) {
    let moved = false;
    for (const queue of queues) {
      const item = queue[index];
      if (item) {
        ordered.push(item);
        moved = true;
      }
    }
    if (!moved) break;
    index += 1;
  }
  return ordered;
}

const OVERLOAD_TOLERANCE: Record<OverloadMode, number> = {
  strict: 1,
  spread: 1.35,
  allow: Number.POSITIVE_INFINITY,
};

/** Assign planned dates to pending topics respecting the daily goal. */
export function autoDistribute(plan: StudyPlan, options: AutoDistributeOptions = {}): AutoDistributeResult {
  const fromDate = options.fromDate ?? todayKey();
  const strategy = options.strategy ?? plan.settings.strategy;
  const overloadMode = options.overloadMode ?? plan.settings.overloadMode;
  const prioritySubjectNames = options.prioritySubjectNames ?? plan.settings.prioritySubjectNames;
  const priorityOrderMode = options.priorityOrderMode ?? plan.settings.priorityOrderMode;
  const weighted = options.weightedPlanning ?? plan.settings.weightedPlanning;
  const includeRevisionNeeded = options.includeRevisionNeeded ?? false;
  const lockExistingDates = options.lockExistingDates ?? false;

  const next = clonePlan(plan);
  const refs = walkTopics(next);
  const days = studyDays(next, fromDate);
  const warnings: string[] = [];

  // Points already committed per day for topics we are not moving.
  const load = new Map<string, number>();
  const bump = (key: string, points: number) => load.set(key, (load.get(key) ?? 0) + points);

  const shouldPlace = (ref: TopicRef): boolean => {
    if (options.onlyTopicIds && !options.onlyTopicIds.includes(ref.topic.id)) return false;
    if (ref.topic.status === 'done') return false;
    if (ref.topic.status === 'revision_needed' && !includeRevisionNeeded) return false;
    if (ref.topic.pinned) return false;
    if (lockExistingDates && ref.topic.plannedDate) return false;
    if (ref.topic.plannedDate && diffDays(fromDate, ref.topic.plannedDate) < 0) return true; // overdue: re-place
    return true;
  };

  const pending: TopicRef[] = [];
  for (const ref of refs) {
    if (shouldPlace(ref)) {
      pending.push(ref);
      continue;
    }
    if (ref.topic.plannedDate && ref.topic.status !== 'done') {
      bump(ref.topic.plannedDate, weighted ? effortPoints(ref.topic, ref.chapter) : 2);
    }
  }

  const ordered = orderTopics(pending, { strategy, prioritySubjectNames, priorityOrderMode });
  const goalPoints = next.dailyGoal * 2; // dailyGoal is expressed in medium-topic equivalents
  const tolerance = OVERLOAD_TOLERANCE[overloadMode];
  const capacity = goalPoints * tolerance;

  let assigned = 0;
  let skipped = 0;
  let cursor = 0;

  for (const ref of ordered) {
    const points = weighted ? effortPoints(ref.topic, ref.chapter) : 2;
    let placed = false;
    for (let index = cursor; index < days.length; index += 1) {
      const key = days[index];
      const used = load.get(key) ?? 0;
      if (used === 0 || used + points <= capacity) {
        ref.topic.plannedDate = key;
        if (!ref.topic.originalPlannedDate) ref.topic.originalPlannedDate = key;
        ref.topic.missedAt = null;
        bump(key, points);
        assigned += 1;
        placed = true;
        if (used + points >= capacity) cursor = index + 1;
        break;
      }
      cursor = index + 1;
    }
    if (!placed) {
      if (overloadMode === 'allow' && days.length > 0) {
        const key = days[days.length - 1];
        ref.topic.plannedDate = key;
        if (!ref.topic.originalPlannedDate) ref.topic.originalPlannedDate = key;
        bump(key, points);
        assigned += 1;
      } else {
        ref.topic.plannedDate = null;
        skipped += 1;
      }
    }
  }

  if (skipped > 0) {
    warnings.push(`${skipped} topics still need dates — increase Topics per day or extend your exam date.`);
    warnings.push('You may not finish the whole syllabus before the exam.');
  }
  const required = requiredPerDay(next, fromDate);
  if (required > next.dailyGoal) {
    warnings.push(`To finish all topics before your exam, your daily goal should be about ${required} topics/day.`);
  }

  next.rolloverDigest = null;
  next.updatedAt = new Date().toISOString();

  return {
    plan: next,
    assigned,
    skipped,
    message: skipped === 0
      ? `${assigned} topics have a date, and no day goes over your goal.`
      : `${assigned} topics scheduled, ${skipped} still need dates.`,
    warnings,
  };
}

/** Topic-equivalents per remaining study day needed to finish the syllabus. */
export function requiredPerDay(plan: StudyPlan, fromDate = todayKey()): number {
  const days = studyDays(plan, fromDate).length;
  if (days === 0) return 0;
  const points = walkTopics(plan)
    .filter((ref) => ref.topic.status !== 'done')
    .reduce((sum, ref) => sum + effortPoints(ref.topic, ref.chapter), 0);
  return Math.ceil(pointsToTopicEquivalents(points) / days);
}

/* ------------------------------------------------------------- progress */

export function planProgress(plan: StudyPlan): PlanProgress {
  const bySubject: SubjectProgress[] = plan.subjects.map((subject) => {
    const byChapter: ChapterProgress[] = subject.chapters.map((chapter) => {
      const total = chapter.topics.length;
      const done = chapter.topics.filter((topic) => topic.status === 'done').length;
      return {
        chapterId: chapter.id,
        chapterName: chapter.name,
        totalTopics: total,
        doneTopics: done,
        completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
      };
    });
    const total = byChapter.reduce((sum, chapter) => sum + chapter.totalTopics, 0);
    const done = byChapter.reduce((sum, chapter) => sum + chapter.doneTopics, 0);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalTopics: total,
      doneTopics: done,
      completionPercent: total === 0 ? 0 : Math.round((done / total) * 100),
      byChapter,
    };
  });

  const refs = walkTopics(plan);
  const totalTopics = refs.length;
  const doneTopics = refs.filter((ref) => ref.topic.status === 'done').length;
  const revisionTopics = refs.filter((ref) => ref.topic.status === 'revision_needed').length;
  const inProgressTopics = refs.filter((ref) => ref.topic.status === 'todo' && ref.topic.plannedDate !== null).length;
  const completionPercent = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);
  const dailyTodoProgressPercent = dailyTodoPercent(plan, todayKey());

  return {
    totalTopics,
    doneTopics,
    inProgressTopics,
    revisionTopics,
    completionPercent,
    remainingPercent: 100 - completionPercent,
    plannerProgressPercent: completionPercent,
    dailyTodoProgressPercent,
    overallProgressPercent: plan.dailyTodos.length === 0
      ? completionPercent
      : Math.round(completionPercent * 0.8 + dailyTodoProgressPercent * 0.2),
    bySubject,
  };
}

export function dailyTodoPercent(plan: StudyPlan, key: string): number {
  if (plan.dailyTodos.length === 0) return 0;
  const doneIds = plan.dailyTodoLogs[key] ?? [];
  const done = plan.dailyTodos.filter((todo) => doneIds.includes(todo.id)).length;
  return Math.round((done / plan.dailyTodos.length) * 100);
}

export function heatmap(plan: StudyPlan): HeatmapPoint[] {
  const counts = new Map<string, number>();
  for (const ref of walkTopics(plan)) {
    if (ref.topic.status === 'done' && ref.topic.completedDate) {
      counts.set(ref.topic.completedDate, (counts.get(ref.topic.completedDate) ?? 0) + 1);
    }
    for (const completed of ref.topic.revisionCompletedDates) {
      counts.set(completed, (counts.get(completed) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count })).sort((left, right) => left.date.localeCompare(right.date));
}

export function analytics(plan: StudyPlan): PlannerAnalytics {
  return { progress: planProgress(plan), heatmap: heatmap(plan) };
}

/** Consecutive days (ending today or yesterday) with at least one completed topic. */
export function currentStreak(plan: StudyPlan): number {
  const active = new Set(heatmap(plan).filter((point) => point.count > 0).map((point) => point.date));
  let streak = 0;
  let cursor = todayKey();
  if (!active.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!active.has(cursor)) return 0;
  }
  while (active.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/* -------------------------------------------------------------- calendar */

export function buildCalendar(plan: StudyPlan): CalendarMap {
  const map: CalendarMap = {};
  const push = (key: string, item: CalendarTopicItem) => {
    if (!map[key]) map[key] = [];
    map[key].push(item);
  };

  for (const { subject, chapter, topic } of walkTopics(plan)) {
    const base: Omit<CalendarTopicItem, 'isRevision'> = {
      topicId: topic.id,
      topicName: topic.name,
      chapterId: chapter.id,
      chapterName: chapter.name,
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      status: topic.status,
      size: effectiveSize(topic, chapter),
      progressPercent: progressPercentValue(topic),
      revisionScheduleType: topic.revisionScheduleType,
      revisionReminderDates: topic.revisionReminderDates,
    };
    if (topic.plannedDate) push(topic.plannedDate, { ...base, isRevision: false });
    for (const reminder of topic.revisionReminderDates) {
      if (topic.revisionCompletedDates.includes(reminder)) continue;
      push(reminder, { ...base, isRevision: true });
    }
  }
  return map;
}

export function topicsForDate(plan: StudyPlan, key: string): CalendarTopicItem[] {
  return buildCalendar(plan)[key] ?? [];
}

export function dayLoad(plan: StudyPlan, key: string): number {
  return walkTopics(plan)
    .filter((ref) => ref.topic.plannedDate === key && ref.topic.status !== 'done')
    .reduce((sum, ref) => sum + effortPoints(ref.topic, ref.chapter), 0);
}

/* ---------------------------------------------------------- topic updates */

export function clonePlan(plan: StudyPlan): StudyPlan {
  return {
    ...plan,
    offDays: [...plan.offDays],
    offDates: [...plan.offDates],
    closedStudyDays: [...plan.closedStudyDays],
    dailyTodos: plan.dailyTodos.map((todo) => ({ ...todo })),
    dailyTodoLogs: Object.fromEntries(Object.entries(plan.dailyTodoLogs).map(([key, ids]) => [key, [...ids]])),
    settings: { ...plan.settings, prioritySubjectNames: [...plan.settings.prioritySubjectNames], spacedRevisionOffsets: [...plan.settings.spacedRevisionOffsets] },
    features: { ...plan.features },
    restoreSnapshots: plan.restoreSnapshots.map((snapshot) => ({ ...snapshot, subjects: cloneSubjects(snapshot.subjects) })),
    subjects: cloneSubjects(plan.subjects),
  };
}

export function cloneSubjects(subjects: StudySubject[]): StudySubject[] {
  return subjects.map((subject) => ({
    ...subject,
    chapters: subject.chapters.map((chapter) => ({
      ...chapter,
      topics: chapter.topics.map((topic) => ({
        ...topic,
        revisionReminderDates: [...topic.revisionReminderDates],
        revisionCompletedDates: [...topic.revisionCompletedDates],
        revisionCompletionLog: topic.revisionCompletionLog.map((entry) => ({ ...entry })),
      })),
    })),
  }));
}

export function mutateTopic(plan: StudyPlan, topicId: string, patch: (topic: StudyTopic, chapter: StudyChapter, subject: StudySubject) => void): StudyPlan {
  const next = clonePlan(plan);
  const ref = findTopic(next, topicId);
  if (ref) patch(ref.topic, ref.chapter, ref.subject);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function setTopicStatus(plan: StudyPlan, topicId: string, status: TopicStatusValue, when = todayKey()): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.status = status;
    if (status === 'done') {
      topic.completedDate = when;
      topic.missedAt = null;
      if (topic.revisionScheduleType === 'none' && plan.settings.revisionScheduleType === 'spaced') {
        topic.revisionScheduleType = 'spaced';
        topic.revisionReminderDates = plan.settings.spacedRevisionOffsets.map((offset) => addDays(when, offset));
        topic.revisionMarkedAt = new Date().toISOString();
      }
    } else {
      topic.completedDate = null;
    }
    if (status === 'revision_needed') topic.revisionMarkedAt = new Date().toISOString();
  });
}

export function scheduleRevision(plan: StudyPlan, topicId: string, dates: string[], type: 'spaced' | 'custom'): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.revisionScheduleType = type;
    topic.revisionReminderDates = [...new Set(dates)].sort();
    topic.revisionMarkedAt = new Date().toISOString();
  });
}

export function removeRevision(plan: StudyPlan, topicId: string): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.revisionScheduleType = 'none';
    topic.revisionReminderDates = [];
  });
}

export function completeRevision(plan: StudyPlan, topicId: string, sessionDate: string, when = todayKey()): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    if (!topic.revisionCompletedDates.includes(sessionDate)) topic.revisionCompletedDates.push(sessionDate);
    topic.revisionCompletionLog.push({ sessionDate, completedDate: when });
  });
}

export function changeRevisionDate(plan: StudyPlan, topicId: string, oldDate: string, newDate: string): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.revisionReminderDates = topic.revisionReminderDates.map((date) => (date === oldDate ? newDate : date)).sort();
  });
}

export function moveTopicToDate(plan: StudyPlan, topicId: string, key: string | null): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.plannedDate = key;
    if (key && !topic.originalPlannedDate) topic.originalPlannedDate = key;
    topic.missedAt = null;
  });
}

export function swapTopics(plan: StudyPlan, firstId: string, secondId: string): StudyPlan {
  const next = clonePlan(plan);
  const first = findTopic(next, firstId);
  const second = findTopic(next, secondId);
  if (first && second) {
    const date = first.topic.plannedDate;
    first.topic.plannedDate = second.topic.plannedDate;
    second.topic.plannedDate = date;
  }
  return next;
}

export function setTopicSize(plan: StudyPlan, topicId: string, size: TopicSizeValue): StudyPlan {
  return mutateTopic(plan, topicId, (topic) => {
    topic.size = size;
  });
}

/* ------------------------------------------------------- finish day / undo */

export type FinishDayResult = { plan: StudyPlan; movedCount: number; undoToken: string };

/**
 * Close a study day: unfinished topics are marked missed and rolled over to the
 * next study day. Returns an undo token backed by a plan snapshot.
 */
export function finishDay(plan: StudyPlan, key = todayKey()): FinishDayResult {
  const snapshotToken = newId('undo');
  const snapshot: PlannerPlanSnapshot = {
    token: snapshotToken,
    label: `Finish day ${key}`,
    createdAt: new Date().toISOString(),
    subjects: cloneSubjects(plan.subjects),
  };

  const next = clonePlan(plan);
  const target = studyDays(next, addDays(key, 1))[0] ?? null;
  let movedCount = 0;

  for (const ref of walkTopics(next)) {
    if (ref.topic.plannedDate === key && ref.topic.status !== 'done') {
      ref.topic.missedAt = key;
      ref.topic.missedReason = 'Day closed';
      ref.topic.plannedDate = target;
      movedCount += 1;
    }
  }

  if (!next.closedStudyDays.includes(key)) next.closedStudyDays.push(key);
  next.restoreSnapshots = [snapshot, ...next.restoreSnapshots].slice(0, 10);
  next.rolloverDigest = { movedCount, fromDates: [key], undoToken: snapshotToken };
  next.undoToken = snapshotToken;
  next.updatedAt = new Date().toISOString();

  return { plan: next, movedCount, undoToken: snapshotToken };
}

export function undoSnapshot(plan: StudyPlan, token: string): StudyPlan {
  const snapshot = plan.restoreSnapshots.find((entry) => entry.token === token);
  if (!snapshot) return plan;
  const next = clonePlan(plan);
  next.subjects = cloneSubjects(snapshot.subjects);
  next.restoreSnapshots = next.restoreSnapshots.filter((entry) => entry.token !== token);
  next.rolloverDigest = null;
  next.undoToken = null;
  next.closedStudyDays = next.closedStudyDays.filter((day) => !snapshot.label.endsWith(day));
  next.updatedAt = new Date().toISOString();
  return next;
}

export function missedTopics(plan: StudyPlan): TopicRef[] {
  const today = todayKey();
  return walkTopics(plan).filter((ref) =>
    ref.topic.status !== 'done'
    && ((ref.topic.missedAt !== null) || (ref.topic.plannedDate !== null && diffDays(today, ref.topic.plannedDate) < 0)),
  );
}

export function unscheduledTopics(plan: StudyPlan): TopicRef[] {
  return walkTopics(plan).filter((ref) => ref.topic.status !== 'done' && ref.topic.plannedDate === null);
}

export function revisionQueue(plan: StudyPlan): { ref: TopicRef; date: string; overdue: boolean }[] {
  const today = todayKey();
  const queue: { ref: TopicRef; date: string; overdue: boolean }[] = [];
  for (const ref of walkTopics(plan)) {
    if (ref.topic.status === 'revision_needed' && ref.topic.revisionReminderDates.length === 0) {
      queue.push({ ref, date: ref.topic.plannedDate ?? today, overdue: false });
    }
    for (const date of ref.topic.revisionReminderDates) {
      if (ref.topic.revisionCompletedDates.includes(date)) continue;
      queue.push({ ref, date, overdue: diffDays(today, date) < 0 });
    }
  }
  return queue.sort((left, right) => left.date.localeCompare(right.date));
}

/* -------------------------------------------------------------- previews */

export function previewPlan(plan: StudyPlan): PlanPreviewResult {
  const distributed = autoDistribute(plan, { fromDate: todayKey(), lockExistingDates: false });
  const stats = syllabusStats(distributed.plan);
  return {
    draftId: newId('draft'),
    title: distributed.plan.title,
    examDate: distributed.plan.examDate,
    dailyGoal: distributed.plan.dailyGoal,
    summary: {
      subjectCount: stats.subjectCount,
      totalTopics: stats.topicCount,
      daysUntilExam: daysUntil(distributed.plan.examDate),
      requiredPerDay: requiredPerDay(distributed.plan),
      scheduleAssigned: distributed.assigned,
      scheduleSkipped: distributed.skipped,
    },
    warnings: distributed.warnings,
    calendarPreview: buildCalendar(distributed.plan),
  };
}

/** Push the exam date out and reschedule leftovers (Safar "Extend Your Plan"). */
export function extendPlan(plan: StudyPlan, newExamDate: string): AutoDistributeResult {
  const next = clonePlan(plan);
  next.examDate = newExamDate;
  return autoDistribute(next, { lockExistingDates: true });
}

/** Clear every planned date and completion (Safar "Reset plan"). */
export function resetPlan(plan: StudyPlan): StudyPlan {
  const next = clonePlan(plan);
  next.restoreSnapshots = [
    { token: newId('undo'), label: 'Plan reset', createdAt: new Date().toISOString(), subjects: cloneSubjects(plan.subjects) },
    ...next.restoreSnapshots,
  ].slice(0, 10);
  for (const ref of walkTopics(next)) {
    ref.topic.status = 'todo';
    ref.topic.plannedDate = null;
    ref.topic.completedDate = null;
    ref.topic.missedAt = null;
    ref.topic.revisionScheduleType = 'none';
    ref.topic.revisionReminderDates = [];
    ref.topic.revisionCompletedDates = [];
    ref.topic.revisionCompletionLog = [];
  }
  next.closedStudyDays = [];
  next.rolloverDigest = null;
  next.updatedAt = new Date().toISOString();
  return next;
}

/* ---------------------------------------------------------- paste import */

/**
 * Parse a pasted syllabus.
 *
 * Format (indentation or markers):
 *   Subject
 *     - Chapter
 *       * Topic
 * A line ending with `:` is treated as a subject; `-`/`#` as chapter; others as topics.
 */
export function parsePastedSyllabus(text: string): StudySubject[] {
  const palette = ['#3f6fd9', '#8256d0', '#2d8a67', '#df7b2f', '#c94f7c', '#3aa0a6', '#a86432', '#5063c9'];
  const subjects: StudySubject[] = [];
  let subject: StudySubject | null = null;
  let chapter: StudyChapter | null = null;

  const ensureSubject = (): StudySubject => {
    if (!subject) {
      subject = makeSubject('General', palette[subjects.length % palette.length]);
      subjects.push(subject);
    }
    return subject;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const indent = rawLine.length - rawLine.trimStart().length;
    const marker = /^([-–—*•+#]|\d+[.)])/.exec(line)?.[1] ?? '';
    const name = line.replace(/^([-–—*•+#]+|\d+[.)])\s*/, '').replace(/:$/, '').trim();
    if (!name) continue;

    const level: 'subject' | 'chapter' | 'topic' =
      line.endsWith(':') || (indent === 0 && marker === '') ? 'subject'
        : marker === '*' || marker === '•' || marker === '+' || indent >= 4 ? 'topic'
          : 'chapter';

    if (level === 'subject') {
      subject = makeSubject(name, palette[subjects.length % palette.length]);
      subjects.push(subject);
      chapter = null;
      continue;
    }

    if (level === 'chapter') {
      chapter = makeChapter(name);
      ensureSubject().chapters.push(chapter);
      continue;
    }

    if (!chapter) {
      chapter = makeChapter(name);
      ensureSubject().chapters.push(chapter);
      continue;
    }
    chapter.topics.push(makeTopic(name));
  }

  // A chapter with no topics keeps its own name as a single topic so nothing is lost.
  for (const entry of subjects) {
    for (const chapterEntry of entry.chapters) {
      if (chapterEntry.topics.length === 0) chapterEntry.topics.push(makeTopic(chapterEntry.name));
    }
  }
  return subjects.filter((entry) => entry.chapters.length > 0);
}

export function todayLabelForPlan(plan: StudyPlan): string {
  const left = daysUntil(plan.examDate);
  if (left === 0) return 'Exam today!';
  if (left === 1) return '1 day left';
  return `${left} days left`;
}

export function serialize(plan: StudyPlan): string {
  return JSON.stringify(plan);
}

export function deserialize(raw: string): StudyPlan | null {
  try {
    const parsed = JSON.parse(raw) as StudyPlan;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.subjects)) return null;
    return { ...createPlan({ title: parsed.title, examType: parsed.examType, examDate: parsed.examDate, dailyGoal: parsed.dailyGoal, offDays: parsed.offDays ?? [] }), ...parsed };
  } catch {
    return null;
  }
}

export { dateKey };
