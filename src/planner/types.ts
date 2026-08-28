/**
 * Planner domain model.
 *
 * Mirrors the Safar exam-planner data model:
 * Plan -> Subject -> Chapter -> Topic, with topic status/size, chapter difficulty,
 * daily to-dos, off days, revision scheduling and progress rollups.
 */

export type TopicStatusValue = 'todo' | 'done' | 'revision_needed';
export type TopicSizeValue = 'small' | 'medium' | 'big';
export type ChapterDifficultyValue = 'easy' | 'normal' | 'tough';
export type RevisionScheduleType = 'none' | 'spaced' | 'custom';

export const TOPIC_STATUS: Record<TopicStatusValue, { label: string; short: string }> = {
  todo: { label: 'Not done', short: 'TODO' },
  done: { label: 'Done', short: 'DONE' },
  revision_needed: { label: 'To Revise', short: 'REVISE' },
};

export const TOPIC_SIZE: Record<TopicSizeValue, { label: string; points: number }> = {
  small: { label: 'Small', points: 1 },
  medium: { label: 'Medium', points: 2 },
  big: { label: 'Big', points: 4 },
};

export const CHAPTER_DIFFICULTY: Record<ChapterDifficultyValue, { label: string; size: TopicSizeValue }> = {
  easy: { label: 'Easy', size: 'small' },
  normal: { label: 'Normal', size: 'medium' },
  tough: { label: 'Tough', size: 'big' },
};

export type RevisionCompletion = { sessionDate: string; completedDate: string };

export type StudyTopic = {
  id: string;
  name: string;
  status: TopicStatusValue;
  size: TopicSizeValue | null;
  notes: string | null;
  pinned: boolean;
  plannedDate: string | null;
  originalPlannedDate: string | null;
  completedDate: string | null;
  missedAt: string | null;
  missedReason: string | null;
  revisionScheduleType: RevisionScheduleType;
  revisionReminderDates: string[];
  revisionCompletedDates: string[];
  revisionCompletionLog: RevisionCompletion[];
  revisionMarkedAt: string | null;
};

export type StudyChapter = {
  id: string;
  name: string;
  difficulty: ChapterDifficultyValue;
  topics: StudyTopic[];
};

export type StudySubject = {
  id: string;
  name: string;
  color: string;
  weeklyTarget: number | null;
  monthlyTarget: number | null;
  chapters: StudyChapter[];
};

export type DailyTodo = { id: string; name: string };

export type ChapterProgress = {
  chapterId: string;
  chapterName: string;
  totalTopics: number;
  doneTopics: number;
  completionPercent: number;
};

export type SubjectProgress = {
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  doneTopics: number;
  completionPercent: number;
  byChapter: ChapterProgress[];
};

export type PlanProgress = {
  totalTopics: number;
  doneTopics: number;
  inProgressTopics: number;
  revisionTopics: number;
  completionPercent: number;
  remainingPercent: number;
  plannerProgressPercent: number;
  dailyTodoProgressPercent: number;
  overallProgressPercent: number;
  bySubject: SubjectProgress[];
};

export type HeatmapPoint = { date: string; count: number };

export type PlannerAnalytics = { progress: PlanProgress; heatmap: HeatmapPoint[] };

export type PlannerRolloverDigest = { movedCount: number; fromDates: string[]; undoToken: string };

export type PlannerPlanSnapshot = {
  token: string;
  label: string;
  createdAt: string;
  /** Serialized subjects so a plan reset/rollover can be undone. */
  subjects: StudySubject[];
};

export type StudyPlannerFeatureFlags = { isPremium: boolean; unlockedAt: string | null };

export type PlanStrategy = 'balanced' | 'sequential' | 'priority';
export type OverloadMode = 'strict' | 'spread' | 'allow';
export type PriorityOrderMode = 'front' | 'daily';

export type PlanSettings = {
  strategy: PlanStrategy;
  overloadMode: OverloadMode;
  priorityOrderMode: PriorityOrderMode;
  prioritySubjectNames: string[];
  weightedPlanning: boolean;
  autoRollover: boolean;
  revisionScheduleType: RevisionScheduleType;
  spacedRevisionOffsets: number[];
};

export type StudyPlan = {
  id: string;
  userId: string;
  title: string;
  examType: string;
  examDate: string;
  description: string | null;
  templateId: string | null;
  /** Topics (weighted: effort points) per study day. */
  dailyGoal: number;
  /** Weekday indexes (0 = Sunday) that are rest days. */
  offDays: number[];
  /** Individual ISO dates excluded from study. */
  offDates: string[];
  closedStudyDays: string[];
  dailyTodos: DailyTodo[];
  dailyTodoLogs: Record<string, string[]>;
  subjects: StudySubject[];
  settings: PlanSettings;
  features: StudyPlannerFeatureFlags;
  rolloverDigest: PlannerRolloverDigest | null;
  restoreSnapshots: PlannerPlanSnapshot[];
  undoToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarTopicItem = {
  topicId: string;
  topicName: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  status: TopicStatusValue;
  size: TopicSizeValue;
  progressPercent: number;
  revisionScheduleType: RevisionScheduleType;
  revisionReminderDates: string[];
  /** True when the entry is a revision reminder rather than first study. */
  isRevision: boolean;
};

export type CalendarMap = Record<string, CalendarTopicItem[]>;

/* Templates -------------------------------------------------------------- */

export type TemplateTopic = { name: string; size: TopicSizeValue };
export type TemplateChapter = { name: string; difficulty?: ChapterDifficultyValue; topics: TemplateTopic[] };
export type TemplateSubject = { name: string; color: string; chapters: TemplateChapter[] };

export type ExamTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedDailyGoal: number;
  subjects: TemplateSubject[];
};

export type ExamTemplateSummary = {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedDailyGoal: number;
  subjectCount: number;
  chapterCount: number;
  topicCount: number;
};

export type SyllabusStats = { subjectCount: number; chapterCount: number; topicCount: number };

export type PlanPreviewSummary = {
  subjectCount: number;
  totalTopics: number;
  daysUntilExam: number;
  requiredPerDay: number;
  scheduleAssigned: number;
  scheduleSkipped: number;
};

export type PlanPreviewResult = {
  draftId: string;
  title: string;
  examDate: string;
  dailyGoal: number;
  summary: PlanPreviewSummary;
  warnings: string[];
  calendarPreview: CalendarMap;
};

export type PlanSource = 'template' | 'custom' | 'paste';

export type PlannerSectionId = 'plans' | 'syllabus' | 'calendar' | 'home' | 'insights' | 'revision';

export const PLANNER_SECTIONS: { id: PlannerSectionId; label: string }[] = [
  { id: 'plans', label: 'Plan' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'home', label: 'Home' },
  { id: 'insights', label: 'Progress' },
  { id: 'revision', label: 'Revision' },
];
