import { useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight,
  Flame, LayoutDashboard, Menu, Play, Plus, Search, Sparkles, Target, TrendingUp, Trophy, X, Zap,
} from 'lucide-react';

type Page = 'Dashboard' | 'Plan' | 'Syllabus' | 'Practice' | 'Revision' | 'Progress';
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

type Exam = { category: string; name: string; subtitle: string; subjects: string[] };

const exams: Exam[] = [
  { category: 'SSC Exams', name: 'SSC CGL', subtitle: 'Combined Graduate Level', subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'] },
  { category: 'SSC Exams', name: 'SSC CHSL', subtitle: 'Combined Higher Secondary Level', subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'] },
  { category: 'SSC Exams', name: 'SSC CPO', subtitle: 'Sub-Inspector & ASI', subjects: ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'] },
  { category: 'SSC Exams', name: 'SSC GD', subtitle: 'Constable', subjects: ['Reasoning', 'General Awareness', 'Elementary Mathematics', 'English/Hindi'] },
  { category: 'Railways', name: 'RRB NTPC', subtitle: 'Non-Technical Popular Categories', subjects: ['Mathematics', 'Reasoning', 'General Awareness'] },
  { category: 'Railways', name: 'RRB Group D', subtitle: 'Level 1', subjects: ['Mathematics', 'Reasoning', 'General Science', 'General Awareness'] },
  { category: 'Banking', name: 'IBPS PO', subtitle: 'Probationary Officer', subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'] },
  { category: 'Banking', name: 'SBI PO', subtitle: 'Probationary Officer', subjects: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'] },
  { category: 'UPSC & State PSC', name: 'UPSC CSE', subtitle: 'Civil Services Examination', subjects: ['General Studies I', 'General Studies II', 'General Studies III', 'General Studies IV'] },
  { category: 'Defense', name: 'CDS', subtitle: 'Combined Defence Services', subjects: ['English', 'General Knowledge', 'Elementary Mathematics'] },
];

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

const nav: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Plan', icon: CalendarDays },
  { label: 'Syllabus', icon: BookOpen }, { label: 'Practice', icon: Target },
  { label: 'Revision', icon: Zap }, { label: 'Progress', icon: TrendingUp },
];

function App() {
  const [active, setActive] = useState<Page>('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [exam, setExam] = useState<Exam>(exams[0]);
  const [date, setDate] = useState('2026-10-15');
  const [hours, setHours] = useState(4);
  const [level, setLevel] = useState('Some preparation');
  const [focus, setFocus] = useState<string[]>(['Quantitative Aptitude', 'General Awareness']);
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState('SSC Exams');
  const [completed, setCompleted] = useState<string[]>([]);
  const days = useMemo(() => Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)), [date]);
  const categories = [...new Set(exams.map((e) => e.category))];
  const filtered = exams.filter((e) => `${e.name} ${e.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  const go = (page: Page) => { setActive(page); setMenuOpen(false); };
  const toggleFocus = (name: string) => setFocus((current) => current.includes(name) ? current.filter((x) => x !== name) : [...current, name]);
  const startWizard = () => { setWizard(true); setStep(1); };
  const finishWizard = () => { setWizard(false); setActive('Plan'); };
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BookOpen size={19}/></div><div><strong>StudyPlanner</strong><span>EXAM PREP OS</span></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={20}/></button></div>
      <button className="exam-switcher" onClick={() => go('Plan')}><span>ACTIVE EXAM</span><strong>{exam.name} 2026</strong><ChevronRight size={16}/></button>
      <nav><small>WORKSPACE</small>{nav.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => go(label)}><Icon size={18}/><span>{label}</span>{label === 'Revision' && <b>7</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak-mini"><Flame size={18}/><div><strong>7 day streak</strong><span>Keep it going</span></div></div><button className="profile"><div className="avatar">P</div><div><strong>Purendar</strong><span>Student</span></div></button></div>
    </aside>
    {menuOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)}/>} 
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu size={23}/></button><div className="breadcrumb"><span>StudyPlanner</span><ChevronRight size={14}/><strong>{wizard ? 'Create Plan' : active}</strong></div><div className="top-actions"><button className="icon-button"><Search size={19}/></button><button className="icon-button"><Trophy size={19}/></button><div className="top-avatar">P</div></div></header>
      {wizard ? <Wizard step={step} setStep={setStep} exam={exam} setExam={setExam} date={date} setDate={setDate} hours={hours} setHours={setHours} level={level} setLevel={setLevel} focus={focus} toggleFocus={toggleFocus} days={days} finish={finishWizard} back={() => step === 1 ? setWizard(false) : setStep((step - 1) as WizardStep)} search={search} setSearch={setSearch} openCategory={openCategory} setOpenCategory={setOpenCategory} categories={categories} filtered={filtered}/> : <PageContent active={active} go={go} startWizard={startWizard} completed={completed} setCompleted={setCompleted}/>} 
    </main>
    <nav className="mobile-nav">{nav.slice(0,5).map(({label, icon:Icon}) => <button key={label} className={active===label && !wizard ? 'active' : ''} onClick={() => go(label)}><Icon size={19}/><span>{label === 'Dashboard' ? 'Home' : label}</span></button>)}</nav>
  </div>;
}

function PageContent({ active, go, startWizard, completed, setCompleted }: { active: Page; go:(p:Page)=>void; startWizard:()=>void; completed:string[]; setCompleted:Dispatch<SetStateAction<string[]>> }) {
  if (active === 'Plan') return <PlanPage startWizard={startWizard}/>;
  if (active === 'Syllabus') return <SyllabusPage/>;
  if (active === 'Practice') return <SimplePage title="Practice" icon={<Target size={25}/>} text="Turn your syllabus into timed practice, PYQs and topic tests."/>;
  if (active === 'Revision') return <RevisionPage/>;
  if (active === 'Progress') return <ProgressPage/>;
  return <Dashboard go={go} startWizard={startWizard} completed={completed} setCompleted={setCompleted}/>;
}

function Dashboard({ go, startWizard, completed, setCompleted }: { go:(p:Page)=>void; startWizard:()=>void; completed:string[]; setCompleted:Dispatch<SetStateAction<string[]>> }) {
  const done = tasks.filter(t => completed.includes(t.topic) || t.done).length;
  const percent = Math.round((done / 6) * 100);
  return <div className="content"><section className="welcome-row"><div><p className="eyebrow">THURSDAY · AUGUST 28, 2026</p><h1>Good evening, Purendar.</h1><p className="subtle">Your next best study session is ready.</p></div><button className="primary-button" onClick={startWizard}><PlusIcon/> Create study plan</button></section><section className="hero-grid"><div className="focus-card"><div className="card-top"><div><span className="label">TODAY'S FOCUS</span><h2>Time & Work</h2><p>Quantitative Aptitude · 45 min</p></div><div className="focus-icon"><Target size={22}/></div></div><div className="focus-progress"><div><strong>38%</strong><span>mastery</span></div><span>Needs attention</span></div><div className="progress-track"><i style={{width:'38%'}}/></div><button className="light-button" onClick={()=>go('Practice')}>Start focused session <ArrowRight size={17}/></button></div><div className="countdown-card"><div className="countdown-head"><span className="label">SSC CGL 2026</span><span className="status-pill">ON TRACK</span></div><strong className="days">47</strong><span className="days-label">days remaining</span><div className="mini-stats"><div><strong>67%</strong><span>mastery</span></div><div><strong>24h</strong><span>this week</span></div><div><strong>76%</strong><span>accuracy</span></div></div></div></section><div className="section-heading"><div><h2>Today's plan</h2><p>4h 30m planned · {Math.min(done * 45,165)}m completed</p></div><button className="text-button" onClick={()=>go('Plan')}>View full plan <ArrowRight size={16}/></button></div><section className="plan-card"><div className="day-progress"><span>{percent}%</span><div className="progress-track"><i style={{width:`${percent}%`}}/></div><span>{done} / 6 tasks</span></div>{tasks.map(task=><div className={`task ${task.done || completed.includes(task.topic) ? 'done':''}`} key={task.time}><span className="task-time">{task.time}</span><button className="task-check" aria-label={`Mark ${task.topic} complete`} onClick={()=>setCompleted(c=>c.includes(task.topic)?c.filter(x=>x!==task.topic):[...c,task.topic])}>{(task.done||completed.includes(task.topic))&&<Check size={14}/>}</button><div className="task-info"><strong>{task.topic}</strong><span>{task.subject}</span></div><span className="task-duration">{task.duration}</span><button className="task-action">{task.done||completed.includes(task.topic)?'Done':'Start'}{!task.done&&!completed.includes(task.topic)&&<ChevronRight size={15}/>}</button></div>)}</section><div className="section-heading compact"><div><h2>Subject mastery</h2><p>Where your next hours will have the most impact.</p></div></div><section className="subject-grid">{subjects.map(s=><article className="subject-card" key={s.name}><div className="subject-title"><div className={`subject-dot ${s.tone}`}/><div><strong>{s.name}</strong><span>Next: {s.next}</span></div><b>{s.value}%</b></div><div className="progress-track"><i className={s.tone} style={{width:`${s.value}%`}}/></div></article>)}</section><section className="bottom-grid"><div className="weekly-card"><div className="section-heading compact"><div><h2>Study consistency</h2><p>Last 7 days</p></div><span className="score">91%</span></div><div className="bars">{['M','T','W','T','F','S','S'].map((d,i)=><div key={`${d}-${i}`}><i style={{height:`${[62,48,82,67,91,36,74][i]}%`}}/><span>{d}</span></div>)}</div></div><div className="revision-card"><div className="revision-icon"><Zap size={20}/></div><div><span className="label">REVISION DUE</span><h3>7 topics need review</h3><p>Protect what you've already learned.</p></div><button className="round-arrow" onClick={()=>go('Revision')}><ArrowRight size={18}/></button></div></section></div>;
}

function PlanPage({startWizard}:{startWizard:()=>void}) { return <div className="content"><section className="page-title"><p className="eyebrow">YOUR STUDY SYSTEM</p><h1>Plans</h1><p className="subtle">Build a plan around your exam, time and current level.</p></section><div className="plan-actions"><button className="plan-choice featured" onClick={startWizard}><div className="choice-icon"><Sparkles size={23}/></div><div><span className="choice-kicker">RECOMMENDED</span><h2>Start with an exam</h2><p>We'll build the structure and schedule for you.</p></div><ArrowRight/></button><button className="plan-choice" onClick={startWizard}><div className="choice-icon orange"><BookOpen size={23}/></div><div><span className="choice-kicker">ADVANCED</span><h2>Build it myself</h2><p>Choose your own subjects, topics and study rhythm.</p></div><ArrowRight/></button></div></div>; }

function Wizard({step,setStep,exam,setExam,date,setDate,hours,setHours,level,setLevel,focus,toggleFocus,days,finish,back,search,setSearch,openCategory,setOpenCategory,categories,filtered}:{step:WizardStep;setStep:Dispatch<SetStateAction<WizardStep>>;exam:Exam;setExam:Dispatch<SetStateAction<Exam>>;date:string;setDate:Dispatch<SetStateAction<string>>;hours:number;setHours:Dispatch<SetStateAction<number>>;level:string;setLevel:Dispatch<SetStateAction<string>>;focus:string[];toggleFocus:(x:string)=>void;days:number;finish:()=>void;back:()=>void;search:string;setSearch:Dispatch<SetStateAction<string>>;openCategory:string;setOpenCategory:Dispatch<SetStateAction<string>>;categories:string[];filtered:Exam[]}) {
  const titles=['Choose your exam','Confirm your exam','Set your target','Tell us where you are','Choose your focus','Your plan is ready'];
  const next=()=>step<6?setStep((step+1) as WizardStep):finish();
  return <div className="wizard"><div className="wizard-top"><button className="back-link" onClick={back}><ArrowLeft size={18}/> Back</button><div className="wizard-brand"><div className="brand-mark"><BookOpen size={17}/></div><strong>CREATE YOUR PLAN</strong></div><span className="step-count">{step} / 6</span></div><div className="wizard-progress"><i style={{width:`${(step/6)*100}%`}}/></div><div className="wizard-body"><p className="eyebrow">STEP {step}</p><h1>{titles[step-1]}</h1><p className="subtle">{step===1?'Start with the exam you are preparing for.':step===2?'We found the syllabus structure for this exam.':step===3?'Give your plan a finish line and a realistic daily budget.':step===4?'Your answer helps us prioritise the right work.':step===5?'Tell StudyPlanner what deserves more attention.':'Review your setup before starting.'}</p>{step===1&&<ExamPicker search={search} setSearch={setSearch} openCategory={openCategory} setOpenCategory={setOpenCategory} categories={categories} filtered={filtered} exam={exam} setExam={setExam}/>} {step===2&&<div className="exam-confirm"><div className="exam-hero-icon"><BookOpen size={28}/></div><span className="choice-kicker">SELECTED EXAM</span><h2>{exam.name}</h2><p>{exam.subtitle}</p><div className="subject-chips">{exam.subjects.map(s=><span key={s}>{s}</span>)}</div></div>} {step===3&&<div className="form-grid"><label>Exam date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><div className="range-card"><div><span>Daily study time</span><strong>{hours} hours</strong></div><input type="range" min="1" max="10" value={hours} onChange={e=>setHours(Number(e.target.value))}/><div className="range-labels"><span>1h</span><span>10h</span></div></div><div className="target-preview"><strong>{days}</strong><span>days to prepare</span></div></div>} {step===4&&<div className="option-grid">{['Starting from scratch','Some preparation','Most syllabus complete','Revision phase'].map(x=><button key={x} className={`option-card ${level===x?'selected':''}`} onClick={()=>setLevel(x)}><span>{level===x?'✓':'○'}</span><strong>{x}</strong></button>)}</div>} {step===5&&<div className="focus-grid">{exam.subjects.map(s=><button key={s} className={`focus-card-mini ${focus.includes(s)?'selected':''}`} onClick={()=>toggleFocus(s)}><span className="focus-check">{focus.includes(s)?<Check size={15}/>:''}</span><strong>{s}</strong><span>{focus.includes(s)?'Priority':'Tap to prioritise'}</span></button>)}</div>} {step===6&&<Summary exam={exam} date={date} hours={hours} level={level} focus={focus} days={days}/>}<div className="wizard-footer"><button className="secondary-button" onClick={back}>{step===1?'Cancel':'Back'}</button><button className="primary-button" onClick={next}>{step===6?'Create my plan':'Continue'} <ArrowRight size={17}/></button></div></div></div>;
}

function ExamPicker({search,setSearch,openCategory,setOpenCategory,categories,filtered,exam,setExam}:{search:string;setSearch:Dispatch<SetStateAction<string>>;openCategory:string;setOpenCategory:Dispatch<SetStateAction<string>>;categories:string[];filtered:Exam[];exam:Exam;setExam:Dispatch<SetStateAction<Exam>>}) { return <div className="exam-picker"><div className="search-field"><Search size={17}/><input placeholder="Search exams..." value={search} onChange={e=>setSearch(e.target.value)}/></div>{categories.map(cat=>{const list=filtered.filter(e=>e.category===cat);if(!list.length)return null;return <div className="category-block" key={cat}><button className="category-head" onClick={()=>setOpenCategory(openCategory===cat?'':cat)}><span>{cat}</span><small>{list.length} exams</small><ChevronDown className={openCategory===cat?'rotated':''} size={19}/></button>{openCategory===cat&&<div className="exam-list">{list.map(e=><button key={e.name} className={`exam-row ${exam.name===e.name?'selected':''}`} onClick={()=>setExam(e)}><div><strong>{e.name}</strong><span>{e.subtitle}</span></div>{exam.name===e.name?<Check size={18}/>:<ChevronRight size={18}/>}</button>)}</div>}</div>})}</div>; }

function Summary({exam,date,hours,level,focus,days}:{exam:Exam;date:string;hours:number;level:string;focus:string[];days:number}) { return <div className="summary-card"><div className="ready-mark"><Check size={28}/></div><span className="choice-kicker">READY TO BUILD</span><h2>{exam.name} study system</h2><p>{days} days · {hours}h/day · {level}</p><div className="summary-grid"><div><span>Target</span><strong>{new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</strong></div><div><span>Priority</span><strong>{focus.length||'Balanced'} subjects</strong></div><div><span>Subjects</span><strong>{exam.subjects.length} core areas</strong></div></div></div>; }

function SyllabusPage(){return <div className="content"><section className="page-title"><p className="eyebrow">SSC CGL 2026</p><h1>Syllabus</h1><p className="subtle">A clear map from first concept to mastery.</p></section><div className="syllabus-overview"><div><span>OVERALL MASTERY</span><strong>67%</strong><div className="progress-track"><i style={{width:'67%'}}/></div></div><div><span>TOPICS</span><strong>84 / 126</strong><small>covered</small></div><div><span>REVISION</span><strong>7</strong><small>due today</small></div></div>{subjects.map(s=><div className="syllabus-row" key={s.name}><div className={`subject-dot ${s.tone}`}/><div><strong>{s.name}</strong><span>12 topics · Next: {s.next}</span></div><b>{s.value}%</b><ChevronRight size={18}/></div>)}</div>}
function RevisionPage(){return <div className="content"><section className="page-title"><p className="eyebrow">REVIEW QUEUE</p><h1>Revision</h1><p className="subtle">Short reviews that protect long-term memory.</p></section><div className="revision-hero"><div className="revision-icon big"><Zap size={25}/></div><div><span className="choice-kicker">DUE TODAY</span><h2>7 topics are ready</h2><p>Start with the weakest topic first.</p></div><button className="primary-button">Start revision <ArrowRight size={16}/></button></div>{['Time & Work','Fundamental Rights','Modern History','Ratio & Proportion','Vocabulary'].map((x,i)=><div className="revision-item" key={x}><div className={`priority p${i+1}`}>{i<2?'HIGH':i<4?'MED':'LOW'}</div><div><strong>{x}</strong><span>Last review {i+2} days ago</span></div><button className="text-button">Review <ArrowRight size={15}/></button></div>)}</div>}
function ProgressPage(){return <div className="content"><section className="page-title"><p className="eyebrow">YOUR PERFORMANCE</p><h1>Progress</h1><p className="subtle">Measure the habits that move your score.</p></section><div className="stats-grid"><div><span>Study time</span><strong>24h 35m</strong><small>This week</small></div><div><span>Questions</span><strong>486</strong><small>76% accuracy</small></div><div><span>Topics mastered</span><strong>12</strong><small>+4 this week</small></div><div><span>Consistency</span><strong>91%</strong><small>Last 7 days</small></div></div><div className="progress-panel"><h2>Subject performance</h2>{subjects.map(s=><div className="metric-row" key={s.name}><span>{s.name}</span><div className="progress-track"><i className={s.tone} style={{width:`${s.value}%`}}/></div><b>{s.value}%</b></div>)}</div></div>}
function SimplePage({title,icon,text}:{title:string;icon:ReactNode;text:string}){return <div className="content placeholder-page"><div className="page-title"><p className="eyebrow">STUDYPLANNER</p><h1>{title}</h1><p className="subtle">{text}</p></div><div className="coming-card"><div className="coming-icon">{icon}</div><h2>Designed around your exam</h2><p>This workspace will connect directly to your syllabus, mastery and study plan.</p></div></div>}
function PlusIcon(){return <span className="plus-icon">+</span>}
export default App;
