import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3, BookOpen, CalendarDays, ChevronRight, Flame, Home, LayoutList, Menu, Plus, Repeat, Search, Target, Trophy, X,
} from 'lucide-react';
import { PlannerWorkspace, usePlannerStore } from './planner';
import type { PlannerSectionId } from './planner';
import { currentStreak, planProgress, revisionQueue } from './planner';
import { daysUntil, todayKey } from './planner/dates';

type NavId = PlannerSectionId | 'practice';

const NAV: { id: NavId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'revision', label: 'Revision', icon: Repeat },
  { id: 'insights', label: 'Progress', icon: BarChart3 },
  { id: 'plans', label: 'Plan', icon: LayoutList },
  { id: 'practice', label: 'Practice', icon: Target },
];

function App() {
  const store = usePlannerStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [tab, setTab] = useState<NavId>(store.section);

  const { plan } = store;
  const progress = useMemo(() => (plan ? planProgress(plan) : null), [plan]);
  const streak = useMemo(() => (plan ? currentStreak(plan) : 0), [plan]);
  const dueRevisions = useMemo(
    () => (plan ? revisionQueue(plan).filter((entry) => entry.date <= todayKey()).length : 0),
    [plan],
  );

  const go = (id: NavId) => {
    setTab(id);
    setWizard(false);
    if (id !== 'practice') store.setSection(id);
    setMenuOpen(false);
  };

  const activeLabel = wizard ? 'Create Plan' : NAV.find((entry) => entry.id === tab)?.label ?? 'Home';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={19} /></div>
          <div><strong>StudyPlanner</strong><span>EXAM PREP OS</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <button className="exam-switcher" onClick={() => go('plans')}>
          <span>ACTIVE EXAM</span>
          <strong>{plan ? plan.title : 'No plan yet'}</strong>
          <ChevronRight size={16} />
        </button>

        <nav>
          <small>WORKSPACE</small>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${tab === id && !wizard ? 'active' : ''}`} onClick={() => go(id)}>
              <Icon size={18} />
              <span>{label}</span>
              {id === 'revision' && dueRevisions > 0 && <b>{dueRevisions}</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="primary-button block" onClick={() => { setWizard(true); setMenuOpen(false); }}>
            <Plus size={16} /> Create Your New Plan
          </button>
          <div className="streak-mini">
            <Flame size={18} />
            <div>
              <strong>{streak} day streak</strong>
              <span>{plan ? `${daysUntil(plan.examDate)} days to exam` : 'Keep it going'}</span>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={23} /></button>
          <div className="breadcrumb">
            <span>StudyPlanner</span>
            <ChevronRight size={14} />
            <strong>{activeLabel}</strong>
          </div>
          <div className="top-actions">
            {progress && <span className="top-progress">{progress.completionPercent}% syllabus</span>}
            <button className="icon-button" aria-label="Search"><Search size={19} /></button>
            <button className="icon-button" aria-label="Achievements"><Trophy size={19} /></button>
          </div>
        </header>

        <div className="content">
          {tab === 'practice' && !wizard ? (
            <PracticePage />
          ) : (
            <PlannerWorkspace store={store} wizard={wizard} setWizard={setWizard} />
          )}
        </div>
      </main>

      <nav className="mobile-nav">
        {NAV.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id && !wizard ? 'active' : ''} onClick={() => go(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function PracticePage(): ReactNode {
  return (
    <div className="placeholder-page">
      <div className="page-title">
        <p className="eyebrow">STUDYPLANNER</p>
        <h1>Practice</h1>
        <p className="subtle">Turn your syllabus into timed practice, PYQs and topic tests.</p>
      </div>
      <div className="coming-card">
        <div className="coming-icon"><Target size={25} /></div>
        <h2>Built on your planner</h2>
        <p>Practice will pull directly from the subjects, chapters and topics in your active plan.</p>
      </div>
    </div>
  );
}

export default App;
