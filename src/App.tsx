import { useState } from 'react';
import {
  ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, CircleUserRound,
  Flame, LayoutDashboard, Menu, MoreHorizontal, Play, Plus, Search, Sparkles,
  Target, TrendingUp, Trophy, X, Zap,
} from 'lucide-react';

const subjects = [
  { name: 'Quantitative Aptitude', value: 61, tone: 'danger', next: 'Time & Work' },
  { name: 'General Awareness', value: 53, tone: 'warning', next: 'Modern History' },
  { name: 'English', value: 84, tone: 'success', next: 'Vocabulary' },
  { name: 'Reasoning', value: 78, tone: 'success', next: 'Analogy' },
];

const tasks = [
  { time: '07:00', subject: 'Mathematics', topic: 'Time & Work', duration: '45 min', done: true },
  { time: '10:30', subject: 'English', topic: 'Vocabulary revision', duration: '30 min', done: true },
  { time: '16:00', subject: 'Polity', topic: 'Fundamental Rights', duration: '60 min', done: false },
  { time: '19:30', subject: 'Reasoning', topic: 'Analogy practice', duration: '45 min', done: false },
];

function App() {
  const [active, setActive] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const nav = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Planner', icon: CalendarDays },
    { label: 'Syllabus', icon: BookOpen },
    { label: 'Practice', icon: Target },
    { label: 'Revision', icon: Zap },
    { label: 'Progress', icon: TrendingUp },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={19} strokeWidth={2.4} /></div>
          <div><strong>StudyPlanner</strong><span>EXAM PREP OS</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={20}/></button>
        </div>
        <div className="exam-switcher">
          <span>ACTIVE EXAM</span>
          <strong>SSC CGL 2026</strong>
          <ChevronRight size={16}/>
        </div>
        <nav>
          <small>WORKSPACE</small>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(label); setMenuOpen(false); }}>
              <Icon size={18}/><span>{label}</span>{label === 'Revision' && <b>7</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-mini"><Flame size={18}/><div><strong>7 day streak</strong><span>Keep it going</span></div></div>
          <button className="profile"><div className="avatar">P</div><div><strong>Purendar</strong><span>Student</span></div><MoreHorizontal size={18}/></button>
        </div>
      </aside>

      {menuOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={23}/></button>
          <div className="breadcrumb"><span>StudyPlanner</span><ChevronRight size={14}/><strong>{active}</strong></div>
          <div className="top-actions">
            <button className="icon-button"><Search size={19}/></button>
            <button className="icon-button"><Trophy size={19}/></button>
            <div className="top-avatar">P</div>
          </div>
        </header>

        {active === 'Dashboard' ? (
          <div className="content">
            <section className="welcome-row">
              <div>
                <p className="eyebrow">THURSDAY · AUGUST 28, 2026</p>
                <h1>Good evening, Purendar.</h1>
                <p className="subtle">Your next best study session is ready.</p>
              </div>
              <button className="primary-button" onClick={() => setShowPlan(true)}><Play size={17} fill="currentColor"/> Continue studying</button>
            </section>

            <section className="hero-grid">
              <div className="focus-card">
                <div className="card-top"><div><span className="label">TODAY'S FOCUS</span><h2>Time & Work</h2><p>Quantitative Aptitude · 45 min</p></div><div className="focus-icon"><Target size={22}/></div></div>
                <div className="focus-progress"><div><strong>38%</strong><span>mastery</span></div><span>Needs attention</span></div>
                <div className="progress-track"><i style={{ width: '38%' }}/></div>
                <button className="light-button" onClick={() => setShowPlan(true)}>Start focused session <ArrowRight size={17}/></button>
              </div>
              <div className="countdown-card">
                <div className="countdown-head"><span className="label">SSC CGL 2026</span><span className="status-pill">ON TRACK</span></div>
                <strong className="days">47</strong><span className="days-label">days remaining</span>
                <div className="mini-stats"><div><strong>67%</strong><span>mastery</span></div><div><strong>24h</strong><span>this week</span></div><div><strong>76%</strong><span>accuracy</span></div></div>
              </div>
            </section>

            <div className="section-heading"><div><h2>Today's plan</h2><p>4h 30m planned · 2h 45m completed</p></div><button className="text-button" onClick={() => setActive('Planner')}>View full plan <ArrowRight size={16}/></button></div>
            <section className="plan-card">
              <div className="day-progress"><span>61%</span><div className="progress-track"><i style={{width:'61%'}}/></div><span>3 / 6 tasks</span></div>
              {tasks.map((task) => <div className={`task ${task.done ? 'done' : ''}`} key={task.time}>
                <span className="task-time">{task.time}</span><div className="task-check">{task.done && <Check size={14}/>}</div><div className="task-info"><strong>{task.topic}</strong><span>{task.subject}</span></div><span className="task-duration">{task.duration}</span><button className="task-action">{task.done ? 'Done' : 'Start'}{!task.done && <ChevronRight size={15}/>}</button>
              </div>)}
            </section>

            <div className="section-heading compact"><div><h2>Subject mastery</h2><p>Where your next hours will have the most impact.</p></div><button className="icon-text"><MoreHorizontal size={18}/></button></div>
            <section className="subject-grid">
              {subjects.map((s) => <article className="subject-card" key={s.name}><div className="subject-title"><div className={`subject-dot ${s.tone}`}/><div><strong>{s.name}</strong><span>Next: {s.next}</span></div><b>{s.value}%</b></div><div className="progress-track"><i className={s.tone} style={{width:`${s.value}%`}}/></div></article>)}
            </section>

            <section className="bottom-grid">
              <div className="weekly-card"><div className="section-heading compact"><div><h2>Study consistency</h2><p>Last 7 days</p></div><span className="score">91%</span></div><div className="bars">{['M','T','W','T','F','S','S'].map((d,i)=><div key={`${d}-${i}`}><i style={{height:`${[62,48,82,67,91,36,74][i]}%`}}/><span>{d}</span></div>)}</div></div>
              <div className="revision-card"><div className="revision-icon"><Zap size={20}/></div><div><span className="label">REVISION DUE</span><h3>7 topics need review</h3><p>Protect what you've already learned.</p></div><button className="round-arrow" onClick={() => setActive('Revision')}><ArrowRight size={18}/></button></div>
            </section>
          </div>
        ) : (
          <div className="content placeholder-page"><div className="page-title"><p className="eyebrow">STUDYPLANNER</p><h1>{active}</h1><p className="subtle">This workspace is part of the new foundation.</p></div><div className="coming-card"><div className="coming-icon"><Sparkles size={24}/></div><h2>Built for your study system</h2><p>The {active.toLowerCase()} experience will connect to your exam, syllabus, mastery and daily plan.</p><button className="primary-button" onClick={() => setActive('Dashboard')}>Back to dashboard</button></div></div>
        )}
      </main>

      <nav className="mobile-nav">{nav.slice(0,5).map(({label, icon:Icon})=><button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={19}/><span>{label === 'Dashboard' ? 'Home' : label}</span></button>)}</nav>

      {showPlan && <div className="modal-layer" onClick={() => setShowPlan(false)}><div className="session-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowPlan(false)}><X size={19}/></button><div className="focus-icon large"><Target size={25}/></div><span className="label">FOCUSED SESSION</span><h2>Time & Work</h2><p>Quantitative Aptitude · 45 minutes</p><div className="timer">45:00</div><button className="primary-button wide" onClick={()=>setShowPlan(false)}><Play size={17} fill="currentColor"/> Start session</button></div></div>}
    </div>
  );
}

export default App;
