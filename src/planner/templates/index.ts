/**
 * Exam template library.
 *
 * Every template carries the full subject -> chapter -> topic tree so a plan can be
 * generated offline, exactly like the Safar planner's "Create plan from template" flow.
 */
import type { ExamTemplate, ExamTemplateSummary, SyllabusStats } from '../types';
import {
  COMPUTER_BASICS, ENGLISH_CORE, GA_CURRENT, GA_ECONOMY, GA_GEOGRAPHY, GA_HISTORY, GA_POLITY,
  GA_SCIENCE, GA_STATIC, HINDI_CORE, QUANT_ADVANCED, QUANT_ARITHMETIC, QUANT_ELEMENTARY,
  REASONING_NON_VERBAL, REASONING_VERBAL, SUBJECT_COLORS, ch, subject, t,
} from './shared';

const GA_FULL = [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_ECONOMY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT];

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'ssc-cgl',
    name: 'SSC CGL',
    category: 'SSC Exams',
    description: 'Combined Graduate Level — Tier 1 & Tier 2 full syllabus',
    recommendedDailyGoal: 6,
    subjects: [
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED]),
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('English Language & Comprehension', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General Awareness', SUBJECT_COLORS.ga, GA_FULL),
      subject('Computer Knowledge (Tier 2)', SUBJECT_COLORS.computer, COMPUTER_BASICS),
    ],
  },
  {
    id: 'ssc-chsl',
    name: 'SSC CHSL',
    category: 'SSC Exams',
    description: 'Combined Higher Secondary Level (10+2) — LDC, JSA, DEO',
    recommendedDailyGoal: 5,
    subjects: [
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED.slice(0, 6)]),
      subject('General Intelligence', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('English Language', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_ECONOMY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
    ],
  },
  {
    id: 'ssc-mts',
    name: 'SSC MTS',
    category: 'SSC Exams',
    description: 'Multi-Tasking Staff & Havaldar — Session 1 & 2',
    recommendedDailyGoal: 4,
    subjects: [
      subject('Numerical & Mathematical Ability', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('Reasoning & Problem Solving', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL.slice(0, 10), ...REASONING_NON_VERBAL]),
      subject('English Language & Comprehension', SUBJECT_COLORS.english, ENGLISH_CORE.slice(0, 9)),
      subject('General Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
    ],
  },
  {
    id: 'ssc-cpo',
    name: 'SSC CPO',
    category: 'SSC Exams',
    description: 'Sub-Inspector in Delhi Police & CAPF — Paper 1 & 2',
    recommendedDailyGoal: 6,
    subjects: [
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED]),
      subject('English Language & Comprehension', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General Knowledge & Awareness', SUBJECT_COLORS.ga, GA_FULL),
    ],
  },
  {
    id: 'ssc-gd',
    name: 'SSC GD Constable',
    category: 'SSC Exams',
    description: 'Constable GD in CAPF, NIA, SSF & Rifleman in Assam Rifles',
    recommendedDailyGoal: 4,
    subjects: [
      subject('Elementary Mathematics', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL.slice(0, 10), ...REASONING_NON_VERBAL]),
      subject('General Knowledge & Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('English / Hindi', SUBJECT_COLORS.hindi, [...ENGLISH_CORE.slice(0, 7), ...HINDI_CORE]),
    ],
  },
  {
    id: 'ssc-je',
    name: 'SSC JE',
    category: 'SSC Exams',
    description: 'Junior Engineer — Paper 1 general subjects + technical base',
    recommendedDailyGoal: 5,
    subjects: [
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, REASONING_VERBAL),
      subject('General Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('General Engineering', SUBJECT_COLORS.aptitude, [
        ch('Engineering Mechanics', [t('Units and dimensions', 'small'), t('Forces and equilibrium'), t('Friction'), t('Centre of gravity')]),
        ch('Strength of Materials', [t('Stress and strain', 'big'), t('Shear force and bending moment', 'big'), t('Torsion')], 'tough'),
        ch('Surveying & Estimation', [t('Chain and compass surveying'), t('Levelling'), t('Estimation and costing', 'big')]),
        ch('Basic Electrical / Civil Practice', [t('Materials and testing'), t('Construction practice'), t('Circuits and machines', 'big')]),
      ]),
    ],
  },
  {
    id: 'rrb-ntpc',
    name: 'RRB NTPC',
    category: 'Railways',
    description: 'Non-Technical Popular Categories — CBT 1 & CBT 2',
    recommendedDailyGoal: 5,
    subjects: [
      subject('Mathematics', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED.slice(0, 6)]),
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('General Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_ECONOMY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('Computer Awareness', SUBJECT_COLORS.computer, COMPUTER_BASICS),
    ],
  },
  {
    id: 'rrb-group-d',
    name: 'RRB Group D',
    category: 'Railways',
    description: 'Level 1 posts — CBT single stage',
    recommendedDailyGoal: 4,
    subjects: [
      subject('Mathematics', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('General Science', SUBJECT_COLORS.science, GA_SCIENCE),
      subject('General Awareness & Current Affairs', SUBJECT_COLORS.current, [...GA_STATIC, ...GA_CURRENT, ...GA_POLITY.slice(0, 3)]),
    ],
  },
  {
    id: 'rrb-alp',
    name: 'RRB ALP / Technician',
    category: 'Railways',
    description: 'Assistant Loco Pilot & Technician — CBT 1, CBT 2 & CBAT',
    recommendedDailyGoal: 5,
    subjects: [
      subject('Mathematics', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('General Intelligence & Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...REASONING_NON_VERBAL]),
      subject('General Science', SUBJECT_COLORS.science, GA_SCIENCE),
      subject('Basic Science & Engineering', SUBJECT_COLORS.aptitude, [
        ch('Engineering Drawing', [t('Projections', 'small'), t('Views and symbols')], 'easy'),
        ch('Units, Measurements & Mechanics', [t('Units and measurements', 'small'), t('Work power energy'), t('Levers and simple machines')]),
        ch('Electricity & Electronics', [t('Basic electricity', 'big'), t('Electronic components'), t('Occupational safety and health')]),
      ]),
      subject('General Awareness & Current Affairs', SUBJECT_COLORS.current, [...GA_STATIC, ...GA_CURRENT]),
    ],
  },
  {
    id: 'ibps-po',
    name: 'IBPS PO',
    category: 'Banking & Insurance',
    description: 'Probationary Officer — Prelims & Mains',
    recommendedDailyGoal: 6,
    subjects: [
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED.slice(5)]),
      subject('Reasoning Ability', SUBJECT_COLORS.reasoning, REASONING_VERBAL),
      subject('English Language', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General & Banking Awareness', SUBJECT_COLORS.ga, [...GA_ECONOMY, ...GA_CURRENT, ...GA_STATIC,
        ch('Banking Awareness', [t('History of banking in India'), t('RBI functions and policy rates', 'big'), t('Types of accounts and deposits'), t('NPA, Basel norms and capital'), t('Financial markets and instruments', 'big'), t('Insurance and pension schemes')]),
      ]),
      subject('Computer Aptitude', SUBJECT_COLORS.computer, COMPUTER_BASICS),
    ],
  },
  {
    id: 'ibps-clerk',
    name: 'IBPS Clerk',
    category: 'Banking & Insurance',
    description: 'Clerical cadre — Prelims & Mains',
    recommendedDailyGoal: 5,
    subjects: [
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, QUANT_ARITHMETIC),
      subject('Reasoning Ability', SUBJECT_COLORS.reasoning, REASONING_VERBAL),
      subject('English Language', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General & Financial Awareness', SUBJECT_COLORS.ga, [...GA_ECONOMY, ...GA_CURRENT, ...GA_STATIC]),
      subject('Computer Aptitude', SUBJECT_COLORS.computer, COMPUTER_BASICS),
    ],
  },
  {
    id: 'sbi-po',
    name: 'SBI PO',
    category: 'Banking & Insurance',
    description: 'State Bank Probationary Officer — Prelims, Mains & Interview',
    recommendedDailyGoal: 6,
    subjects: [
      subject('Quantitative Aptitude', SUBJECT_COLORS.quant, [...QUANT_ARITHMETIC, ...QUANT_ADVANCED.slice(5)]),
      subject('Reasoning & Computer Aptitude', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL, ...COMPUTER_BASICS]),
      subject('English Language', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('Data Analysis & Interpretation', SUBJECT_COLORS.aptitude, [
        ch('Advanced DI', [t('Caselet DI', 'big'), t('Missing data DI', 'big'), t('Data sufficiency in DI')], 'tough'),
      ]),
      subject('General / Economy / Banking Awareness', SUBJECT_COLORS.ga, [...GA_ECONOMY, ...GA_CURRENT]),
    ],
  },
  {
    id: 'upsc-cse-prelims',
    name: 'UPSC CSE (Prelims)',
    category: 'UPSC & State PSC',
    description: 'Civil Services Prelims — GS Paper 1 & CSAT',
    recommendedDailyGoal: 6,
    subjects: [
      subject('History & Culture', SUBJECT_COLORS.history, GA_HISTORY),
      subject('Geography', SUBJECT_COLORS.geography, GA_GEOGRAPHY),
      subject('Polity & Governance', SUBJECT_COLORS.polity, GA_POLITY),
      subject('Economy', SUBJECT_COLORS.economy, GA_ECONOMY),
      subject('Environment & Science', SUBJECT_COLORS.science, [...GA_SCIENCE, ...GA_GEOGRAPHY.slice(3)]),
      subject('Current Affairs', SUBJECT_COLORS.current, GA_CURRENT),
      subject('CSAT (Paper 2)', SUBJECT_COLORS.aptitude, [...QUANT_ELEMENTARY.slice(0, 8), ...REASONING_VERBAL.slice(0, 10),
        ch('Comprehension & Decision Making', [t('Reading comprehension', 'big'), t('Logical reasoning and analytical ability', 'big'), t('Decision making and problem solving')]),
      ]),
    ],
  },
  {
    id: 'state-psc',
    name: 'State PSC (Prelims)',
    category: 'UPSC & State PSC',
    description: 'Generic state services prelims with state-specific section',
    recommendedDailyGoal: 5,
    subjects: [
      subject('History & Culture', SUBJECT_COLORS.history, GA_HISTORY),
      subject('Geography', SUBJECT_COLORS.geography, GA_GEOGRAPHY),
      subject('Polity', SUBJECT_COLORS.polity, GA_POLITY),
      subject('Economy', SUBJECT_COLORS.economy, GA_ECONOMY),
      subject('General Science', SUBJECT_COLORS.science, GA_SCIENCE),
      subject('State Specific GK', SUBJECT_COLORS.ga, [
        ch('State Profile', [t('History of the state', 'big'), t('Geography and rivers'), t('Polity and administration'), t('Economy and schemes'), t('Art, culture and festivals'), t('State current affairs', 'big')]),
      ]),
      subject('Current Affairs', SUBJECT_COLORS.current, GA_CURRENT),
    ],
  },
  {
    id: 'cds',
    name: 'CDS (IMA/INA/AFA/OTA)',
    category: 'Defence',
    description: 'Combined Defence Services written exam',
    recommendedDailyGoal: 4,
    subjects: [
      subject('English', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General Knowledge', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_ECONOMY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('Elementary Mathematics', SUBJECT_COLORS.quant, [...QUANT_ELEMENTARY, ...QUANT_ADVANCED.slice(0, 5)]),
    ],
  },
  {
    id: 'afcat',
    name: 'AFCAT',
    category: 'Defence',
    description: 'Air Force Common Admission Test',
    recommendedDailyGoal: 4,
    subjects: [
      subject('English', SUBJECT_COLORS.english, ENGLISH_CORE),
      subject('General Awareness', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('Numerical Ability', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('Reasoning & Military Aptitude', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL.slice(0, 8), ...REASONING_NON_VERBAL]),
    ],
  },
  {
    id: 'ctet',
    name: 'CTET',
    category: 'Teaching',
    description: 'Central Teacher Eligibility Test — Paper 1 & 2',
    recommendedDailyGoal: 4,
    subjects: [
      subject('Child Development & Pedagogy', SUBJECT_COLORS.ethics, [
        ch('Child Development', [t('Concept of development'), t('Piaget, Kohlberg and Vygotsky', 'big'), t('Socialisation and heredity'), t('Individual differences')]),
        ch('Inclusive Education', [t('Children with special needs', 'big'), t('Addressing learners from diverse backgrounds')]),
        ch('Learning & Pedagogy', [t('How children think and learn', 'big'), t('Motivation and learning'), t('Assessment and evaluation')]),
      ]),
      subject('Language 1 (Hindi)', SUBJECT_COLORS.hindi, HINDI_CORE),
      subject('Language 2 (English)', SUBJECT_COLORS.english, ENGLISH_CORE.slice(0, 8)),
      subject('Mathematics & Pedagogy', SUBJECT_COLORS.quant, [...QUANT_ELEMENTARY.slice(0, 8),
        ch('Mathematics Pedagogy', [t('Nature of mathematics'), t('Language of mathematics'), t('Evaluation and remedial teaching')]),
      ]),
      subject('EVS / Science & Social Studies', SUBJECT_COLORS.science, [...GA_SCIENCE.slice(0, 3), ...GA_GEOGRAPHY.slice(0, 2), ...GA_POLITY.slice(0, 2)]),
    ],
  },
  {
    id: 'delhi-police',
    name: 'Delhi Police Constable',
    category: 'Police & State Forces',
    description: 'Constable Executive — CBT with computer section',
    recommendedDailyGoal: 4,
    subjects: [
      subject('General Knowledge & Current Affairs', SUBJECT_COLORS.ga, [...GA_HISTORY, ...GA_GEOGRAPHY, ...GA_POLITY, ...GA_SCIENCE, ...GA_STATIC, ...GA_CURRENT]),
      subject('Reasoning', SUBJECT_COLORS.reasoning, [...REASONING_VERBAL.slice(0, 10), ...REASONING_NON_VERBAL]),
      subject('Numerical Ability', SUBJECT_COLORS.quant, QUANT_ELEMENTARY),
      subject('Computer Awareness', SUBJECT_COLORS.computer, COMPUTER_BASICS),
    ],
  },
  {
    id: 'custom-blank',
    name: 'Custom / Other Exam',
    category: 'Custom',
    description: 'Start empty and build your own subjects, chapters and topics',
    recommendedDailyGoal: 4,
    subjects: [],
  },
];

export function statsForTemplate(template: ExamTemplate): SyllabusStats {
  let chapterCount = 0;
  let topicCount = 0;
  for (const subj of template.subjects) {
    chapterCount += subj.chapters.length;
    for (const chapter of subj.chapters) topicCount += chapter.topics.length;
  }
  return { subjectCount: template.subjects.length, chapterCount, topicCount };
}

export function templateSummaries(): ExamTemplateSummary[] {
  return EXAM_TEMPLATES.map((template) => {
    const stats = statsForTemplate(template);
    return {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      recommendedDailyGoal: template.recommendedDailyGoal,
      ...stats,
    };
  });
}

export function templateById(id: string): ExamTemplate | undefined {
  return EXAM_TEMPLATES.find((template) => template.id === id);
}

export const TEMPLATE_CATEGORIES = [...new Set(EXAM_TEMPLATES.map((template) => template.category))];
