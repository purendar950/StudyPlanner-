/** Syllabus tab: subject -> chapter -> topic tree with add/rename/delete, bulk add and reorder. */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { ChapterDifficultyValue, StudyChapter, StudyPlan, StudySubject, TopicSizeValue } from '../types';
import { CHAPTER_DIFFICULTY, TOPIC_SIZE } from '../types';
import { clonePlan, effectiveSize, makeChapter, makeSubject, makeTopic, planProgress, syllabusStats } from '../engine';
import { Bar, Card, Chips, Empty, Sheet, Toast } from './primitives';

const PALETTE = ['#3f6fd9', '#8256d0', '#2d8a67', '#df7b2f', '#c94f7c', '#3aa0a6', '#a86432', '#5063c9', '#b3543a', '#7a5cc4'];

type Sheets =
  | { kind: 'subject'; subjectId?: string }
  | { kind: 'chapter'; subjectId: string; chapterId?: string }
  | { kind: 'topic'; subjectId: string; chapterId: string; topicId?: string }
  | { kind: 'bulk'; subjectId: string; chapterId: string }
  | null;

export function SyllabusTab({ plan, onChange }: { plan: StudyPlan; onChange: (plan: StudyPlan) => void }) {
  const [openSubjects, setOpenSubjects] = useState<string[]>(() => plan.subjects.slice(0, 1).map((subject) => subject.id));
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheets>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const progress = useMemo(() => planProgress(plan), [plan]);
  const stats = useMemo(() => syllabusStats(plan), [plan]);
  const needle = query.trim().toLowerCase();

  const toggle = (list: string[], setList: (value: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]);

  const mutate = (mutator: (draft: StudyPlan) => void, message?: string) => {
    const next = clonePlan(plan);
    mutator(next);
    next.updatedAt = new Date().toISOString();
    onChange(next);
    if (message) setToast(message);
  };

  const moveSubject = (subjectId: string, direction: -1 | 1) =>
    mutate((draft) => {
      const index = draft.subjects.findIndex((subject) => subject.id === subjectId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= draft.subjects.length) return;
      const [item] = draft.subjects.splice(index, 1);
      draft.subjects.splice(target, 0, item);
    }, 'Syllabus order updated');

  const moveChapter = (subjectId: string, chapterId: string, direction: -1 | 1) =>
    mutate((draft) => {
      const subject = draft.subjects.find((entry) => entry.id === subjectId);
      if (!subject) return;
      const index = subject.chapters.findIndex((chapter) => chapter.id === chapterId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= subject.chapters.length) return;
      const [item] = subject.chapters.splice(index, 1);
      subject.chapters.splice(target, 0, item);
    }, 'Syllabus order updated');

  return (
    <div className="pl-stack">
      <Card title="Your syllabus" subtitle="Your study plan is made from these subjects and topics.">
        <div className="pl-stat-row">
          <div><strong>{stats.subjectCount}</strong><span>Subjects</span></div>
          <div><strong>{stats.chapterCount}</strong><span>Chapters</span></div>
          <div><strong>{stats.topicCount}</strong><span>Topics</span></div>
          <div><strong>{progress.completionPercent}%</strong><span>Complete</span></div>
        </div>
        <label className="pl-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics…" aria-label="Search topics" />
        </label>
        <div className="pl-row-actions">
          <button className="pl-btn primary" onClick={() => setSheet({ kind: 'subject' })}><Plus size={15} /> Add Subject</button>
        </div>
      </Card>

      {plan.subjects.length === 0 ? (
        <Card>
          <Empty
            title="No subjects yet"
            body="Add your first one to start building the syllabus."
            action={<button className="pl-btn primary" onClick={() => setSheet({ kind: 'subject' })}>Add your first subject</button>}
          />
        </Card>
      ) : (
        plan.subjects.map((subject, subjectIndex) => {
          const subjectProgress = progress.bySubject.find((entry) => entry.subjectId === subject.id);
          const open = openSubjects.includes(subject.id) || needle.length > 0;
          const chapters = needle
            ? subject.chapters.filter((chapter) =>
                chapter.name.toLowerCase().includes(needle) || chapter.topics.some((topic) => topic.name.toLowerCase().includes(needle)))
            : subject.chapters;
          if (needle && chapters.length === 0 && !subject.name.toLowerCase().includes(needle)) return null;

          return (
            <section key={subject.id} className="pl-tree-subject">
              <header>
                <button className="pl-tree-toggle" onClick={() => toggle(openSubjects, setOpenSubjects, subject.id)} aria-expanded={open}>
                  {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  <i style={{ background: subject.color }} />
                  <div>
                    <strong>{subject.name}</strong>
                    <span>{subjectProgress?.doneTopics ?? 0}/{subjectProgress?.totalTopics ?? 0} topics · {subject.chapters.length} chapters</span>
                  </div>
                </button>
                <div className="pl-tree-actions">
                  <span className="pl-pct">{subjectProgress?.completionPercent ?? 0}%</span>
                  <button className="pl-icon-btn" aria-label="Move subject up" disabled={subjectIndex === 0} onClick={() => moveSubject(subject.id, -1)}><GripVertical size={15} /></button>
                  <button className="pl-icon-btn" aria-label="Rename subject" onClick={() => setSheet({ kind: 'subject', subjectId: subject.id })}><Pencil size={15} /></button>
                  <button
                    className="pl-icon-btn danger"
                    aria-label="Delete subject"
                    onClick={() => {
                      if (!confirm(`Delete this subject?\n\n${subject.name} and all its chapters and topics will be removed.`)) return;
                      mutate((draft) => { draft.subjects = draft.subjects.filter((entry) => entry.id !== subject.id); }, 'Subject deleted');
                    }}
                  ><Trash2 size={15} /></button>
                </div>
              </header>
              <Bar value={subjectProgress?.completionPercent ?? 0} tone={subject.color} />

              {open && (
                <div className="pl-tree-body">
                  {chapters.length === 0 ? (
                    <p className="pl-hint">No chapters yet. Add your first chapter to this subject.</p>
                  ) : (
                    chapters.map((chapter, chapterIndex) => {
                      const chapterOpen = openChapters.includes(chapter.id) || needle.length > 0;
                      const topics = needle ? chapter.topics.filter((topic) => topic.name.toLowerCase().includes(needle)) : chapter.topics;
                      const done = chapter.topics.filter((topic) => topic.status === 'done').length;
                      return (
                        <div key={chapter.id} className="pl-tree-chapter">
                          <header>
                            <button className="pl-tree-toggle" onClick={() => toggle(openChapters, setOpenChapters, chapter.id)} aria-expanded={chapterOpen}>
                              {chapterOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              <div>
                                <strong>{chapter.name}</strong>
                                <span>{done}/{chapter.topics.length} topics · {CHAPTER_DIFFICULTY[chapter.difficulty].label}</span>
                              </div>
                            </button>
                            <div className="pl-tree-actions">
                              <select
                                aria-label={`Difficulty for ${chapter.name}`}
                                value={chapter.difficulty}
                                onChange={(event) => mutate((draft) => {
                                  const target = draft.subjects.find((entry) => entry.id === subject.id)?.chapters.find((entry) => entry.id === chapter.id);
                                  if (target) target.difficulty = event.target.value as ChapterDifficultyValue;
                                }, 'Chapter rated')}
                              >
                                <option value="easy">Easy</option>
                                <option value="normal">Normal</option>
                                <option value="tough">Tough</option>
                              </select>
                              <button className="pl-icon-btn" aria-label="Move chapter up" disabled={chapterIndex === 0} onClick={() => moveChapter(subject.id, chapter.id, -1)}><GripVertical size={14} /></button>
                              <button className="pl-icon-btn" aria-label="Rename chapter" onClick={() => setSheet({ kind: 'chapter', subjectId: subject.id, chapterId: chapter.id })}><Pencil size={14} /></button>
                              <button
                                className="pl-icon-btn danger"
                                aria-label="Delete chapter"
                                onClick={() => {
                                  if (!confirm(`Delete this chapter?\n\n${chapter.name} and its topics will be removed.`)) return;
                                  mutate((draft) => {
                                    const target = draft.subjects.find((entry) => entry.id === subject.id);
                                    if (target) target.chapters = target.chapters.filter((entry) => entry.id !== chapter.id);
                                  }, 'Chapter deleted');
                                }}
                              ><Trash2 size={14} /></button>
                            </div>
                          </header>

                          {chapterOpen && (
                            <>
                              {topics.length === 0 ? (
                                <p className="pl-hint">No topics in this chapter.</p>
                              ) : (
                                <ul className="pl-topic-rows">
                                  {topics.map((topic) => (
                                    <li key={topic.id} className={topic.status === 'done' ? 'done' : ''}>
                                      <div>
                                        <strong>{topic.name}</strong>
                                        <span>
                                          {topic.plannedDate ?? 'No date'} · {TOPIC_SIZE[effectiveSize(topic, chapter)].label}
                                          {topic.status === 'revision_needed' && ' · To revise'}
                                        </span>
                                      </div>
                                      <div className="pl-tree-actions">
                                        <select
                                          aria-label={`Size for ${topic.name}`}
                                          value={topic.size ?? ''}
                                          onChange={(event) => mutate((draft) => {
                                            const target = draft.subjects.find((entry) => entry.id === subject.id)
                                              ?.chapters.find((entry) => entry.id === chapter.id)
                                              ?.topics.find((entry) => entry.id === topic.id);
                                            if (target) target.size = (event.target.value || null) as TopicSizeValue | null;
                                          })}
                                        >
                                          <option value="">Auto</option>
                                          <option value="small">Small</option>
                                          <option value="medium">Medium</option>
                                          <option value="big">Big</option>
                                        </select>
                                        <button className="pl-icon-btn" aria-label="Rename topic" onClick={() => setSheet({ kind: 'topic', subjectId: subject.id, chapterId: chapter.id, topicId: topic.id })}><Pencil size={14} /></button>
                                        <button
                                          className="pl-icon-btn danger"
                                          aria-label="Delete topic"
                                          onClick={() => mutate((draft) => {
                                            const target = draft.subjects.find((entry) => entry.id === subject.id)?.chapters.find((entry) => entry.id === chapter.id);
                                            if (target) target.topics = target.topics.filter((entry) => entry.id !== topic.id);
                                          }, 'Topic deleted')}
                                        ><Trash2 size={14} /></button>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="pl-row-actions">
                                <button className="pl-btn ghost" onClick={() => setSheet({ kind: 'topic', subjectId: subject.id, chapterId: chapter.id })}><Plus size={14} /> Add topic</button>
                                <button className="pl-btn ghost" onClick={() => setSheet({ kind: 'bulk', subjectId: subject.id, chapterId: chapter.id })}>Bulk add topics</button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div className="pl-row-actions">
                    <button className="pl-btn ghost" onClick={() => setSheet({ kind: 'chapter', subjectId: subject.id })}><Plus size={14} /> Add Chapter</button>
                  </div>
                </div>
              )}
            </section>
          );
        })
      )}

      {sheet && (
        <NameSheet
          plan={plan}
          sheet={sheet}
          onClose={() => setSheet(null)}
          onSubmit={(value) => {
            mutate((draft) => {
              if (sheet.kind === 'subject') {
                if (sheet.subjectId) {
                  const target = draft.subjects.find((entry) => entry.id === sheet.subjectId);
                  if (target) target.name = value;
                } else {
                  draft.subjects.push(makeSubject(value, PALETTE[draft.subjects.length % PALETTE.length]));
                }
                return;
              }
              const subject = draft.subjects.find((entry) => entry.id === sheet.subjectId);
              if (!subject) return;
              if (sheet.kind === 'chapter') {
                if (sheet.chapterId) {
                  const target = subject.chapters.find((entry) => entry.id === sheet.chapterId);
                  if (target) target.name = value;
                } else {
                  subject.chapters.push(makeChapter(value));
                }
                return;
              }
              const chapter = subject.chapters.find((entry) => entry.id === sheet.chapterId);
              if (!chapter) return;
              if (sheet.kind === 'topic') {
                if (sheet.topicId) {
                  const target = chapter.topics.find((entry) => entry.id === sheet.topicId);
                  if (target) target.name = value;
                } else {
                  chapter.topics.push(makeTopic(value));
                }
                return;
              }
              for (const line of value.split(/\r?\n/)) {
                const name = line.replace(/^[-*•\d.)\s]+/, '').trim();
                if (name) chapter.topics.push(makeTopic(name));
              }
            }, 'Saved');
            setSheet(null);
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function NameSheet({ plan, sheet, onClose, onSubmit }: {
  plan: StudyPlan;
  sheet: NonNullable<Sheets>;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const existing = useMemo(() => {
    if (sheet.kind === 'subject' && sheet.subjectId) return plan.subjects.find((entry) => entry.id === sheet.subjectId)?.name ?? '';
    if (sheet.kind === 'chapter' && sheet.chapterId) {
      return plan.subjects.find((entry) => entry.id === sheet.subjectId)?.chapters.find((entry) => entry.id === sheet.chapterId)?.name ?? '';
    }
    if (sheet.kind === 'topic' && sheet.topicId) {
      return plan.subjects.find((entry) => entry.id === sheet.subjectId)
        ?.chapters.find((entry: StudyChapter) => entry.id === sheet.chapterId)
        ?.topics.find((entry) => entry.id === sheet.topicId)?.name ?? '';
    }
    return '';
  }, [plan, sheet]);

  const [value, setValue] = useState(existing);
  const bulk = sheet.kind === 'bulk';
  const titles: Record<string, string> = {
    subject: sheet.kind === 'subject' && sheet.subjectId ? 'Rename Subject' : 'Add Subject',
    chapter: sheet.kind === 'chapter' && sheet.chapterId ? 'Rename Chapter' : 'Add Chapter',
    topic: sheet.kind === 'topic' && sheet.topicId ? 'Rename Topic' : 'Add topic',
    bulk: 'Bulk add topics',
  };

  return (
    <Sheet
      title={titles[sheet.kind]}
      onClose={onClose}
      footer={
        <>
          <button className="pl-btn ghost" onClick={onClose}>Cancel</button>
          <button className="pl-btn primary" disabled={value.trim().length === 0} onClick={() => onSubmit(value.trim())}>
            {bulk ? 'Save topics' : 'Save'}
          </button>
        </>
      }
    >
      <div className="pl-field">
        <label htmlFor="name-input">{bulk ? 'Topic names in this chapter (one per line)' : 'Name'}</label>
        {bulk ? (
          <textarea id="name-input" rows={10} value={value} onChange={(event) => setValue(event.target.value)} placeholder={'Percentage basics\nSuccessive change\nApplication sums'} />
        ) : (
          <input id="name-input" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type the name" autoFocus />
        )}
      </div>
      {sheet.kind === 'topic' && !sheet.topicId && (
        <Chips
          value={'medium' as TopicSizeValue}
          options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'big', label: 'Big' }]}
          onChange={() => undefined}
        />
      )}
    </Sheet>
  );
}
