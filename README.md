# StudyPlanner

A beautiful, mobile-first study operating system for competitive exam preparation.

## Vision

**Plan → Learn → Practice → Revise → Improve**

StudyPlanner is being rebuilt from a clean foundation with a free-first, multi-user and offline-first architecture.

## Phase 1

- Professional responsive dashboard
- Exam-aware study workspace
- Daily plan and focused sessions
- Subject mastery overview
- Revision inbox foundation
- Mobile navigation
- React + TypeScript + Vite
- PWA-ready architecture

## Run locally

```bash
npm install
npm run dev
```

## Exam Planner

The planner is a full offline-first study system under `src/planner/`.

- **Six sections** — Home (today), Syllabus, Calendar, Revision, Progress, Plan.
- **Four-level hierarchy** — Plan → Subject → Chapter → Topic, with topic status
  (Not done / Done / To Revise), topic size (Small 1 / Medium 2 / Big 4 effort points)
  and chapter difficulty (Easy / Normal / Tough) that drives the default topic size.
- **19 exam templates** across SSC, Railways, Banking, UPSC & State PSC, Defence,
  Teaching and Police, each with the complete subject/chapter/topic tree
  (SSC CGL alone ships 5 subjects, 80 chapters and 303 topics).
- **Plan creation** from a template, a pasted syllabus, or from scratch, through a
  six-step wizard: source → exam & date → daily goal & rest days → chapter ratings →
  strategy → preview.
- **Weighted auto-distribution** with balanced / syllabus-order / priority-first
  strategies, overload handling (strict, slight overflow, fit-before-exam) and rest days.
- **Daily flow** — today's topics, daily to-do habits, streaks, finish-day rollover
  with undo, move/swap topics, and missed-topic recovery.
- **Spaced revision** at 1, 3, 7 and 21 days, plus custom revision dates.
- **Analytics** — syllabus completion, per-subject and per-chapter mastery, 90-day
  heatmap, 7-day consistency and required-topics-per-day guidance.

Plans persist in `localStorage`; no backend or API key is required.

```bash
npm install
npm run dev     # local dev server
npm test        # planner engine tests
npm run build   # typecheck + production build
```

## Product roadmap

1. Foundation & design system
2. Authentication and secure multi-user database
3. Exam and syllabus engine
4. Adaptive planner
5. Practice, PYQs and mock tests
6. Spaced revision and analytics
7. Optional AI features
8. Native Android app with Kotlin + Jetpack Compose

## Principle

The core learning experience should remain useful without paid AI APIs or premium infrastructure.
