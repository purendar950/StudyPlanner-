/**
 * Reusable syllabus building blocks.
 *
 * Exam templates are composed from these chapter groups the same way the
 * Safar planner ships one template per exam with a subject -> chapter -> topic tree.
 */
import type { TemplateChapter, TemplateSubject, TemplateTopic, TopicSizeValue, ChapterDifficultyValue } from '../types';

export const SUBJECT_COLORS = {
  quant: '#3f6fd9',
  reasoning: '#8256d0',
  english: '#2d8a67',
  ga: '#df7b2f',
  science: '#c94f7c',
  hindi: '#0b6b57',
  computer: '#3aa0a6',
  current: '#d08a22',
  polity: '#5063c9',
  history: '#a86432',
  geography: '#2f8f9d',
  economy: '#b3543a',
  ethics: '#7a5cc4',
  law: '#4b6b8a',
  aptitude: '#3f6fd9',
} as const;

/** Compact topic helper: `t('Averages', 'big')`. */
export const t = (name: string, size: TopicSizeValue = 'medium'): TemplateTopic => ({ name, size });

/** Compact chapter helper. */
export const ch = (
  name: string,
  topics: TemplateTopic[],
  difficulty: ChapterDifficultyValue = 'normal',
): TemplateChapter => ({ name, difficulty, topics });

export const subject = (name: string, color: string, chapters: TemplateChapter[]): TemplateSubject => ({
  name,
  color,
  chapters,
});

/* ---------------------------------------------------------------- Quant */

export const QUANT_ARITHMETIC: TemplateChapter[] = [
  ch('Number System', [
    t('Classification of numbers', 'small'),
    t('Divisibility rules', 'small'),
    t('Unit digit and cyclicity'),
    t('Number of zeros in factorial', 'small'),
    t('Remainder theorem', 'big'),
    t('LCM and HCF', 'big'),
    t('Fractions and decimals', 'small'),
    t('Surds and indices'),
  ]),
  ch('Simplification & Approximation', [
    t('BODMAS rules', 'small'),
    t('Square root and cube root'),
    t('Fraction comparison', 'small'),
    t('Approximation techniques'),
  ], 'easy'),
  ch('Percentage', [
    t('Percentage basics and conversions', 'small'),
    t('Percentage increase and decrease'),
    t('Successive percentage change', 'big'),
    t('Percentage in exam and population problems'),
  ]),
  ch('Ratio & Proportion', [
    t('Ratio basics', 'small'),
    t('Proportion, mean and third proportional'),
    t('Componendo and dividendo'),
    t('Ratio based word problems', 'big'),
  ]),
  ch('Average', [
    t('Average of numbers and series', 'small'),
    t('Weighted average'),
    t('Average of ages'),
    t('Change in average on replacement', 'big'),
  ]),
  ch('Age Problems', [t('Present age relations'), t('Past and future age'), t('Ratio based age problems')], 'easy'),
  ch('Profit & Loss', [
    t('Cost price, selling price, profit percent', 'small'),
    t('Successive discount', 'big'),
    t('Marked price and discount'),
    t('Dishonest dealer and false weight', 'big'),
    t('Partnership'),
  ]),
  ch('Simple & Compound Interest', [
    t('Simple interest basics', 'small'),
    t('Compound interest annually and half yearly', 'big'),
    t('Difference between SI and CI', 'big'),
    t('Installments'),
  ]),
  ch('Time, Speed & Distance', [
    t('Basic speed conversions', 'small'),
    t('Average speed'),
    t('Relative speed'),
    t('Trains', 'big'),
    t('Boats and streams', 'big'),
    t('Races and circular tracks'),
  ]),
  ch('Time & Work', [
    t('Work equivalence and efficiency'),
    t('Combined work and alternate days', 'big'),
    t('Wages sharing'),
    t('Pipes and cisterns', 'big'),
  ], 'tough'),
  ch('Mixture & Alligation', [t('Alligation rule'), t('Repeated replacement', 'big'), t('Mixing of two or more solutions')], 'tough'),
  ch('Problems on Numbers & Equations', [t('Linear equation word problems'), t('Digit based problems'), t('Age and coin problems')]),
];

export const QUANT_ADVANCED: TemplateChapter[] = [
  ch('Algebra', [
    t('Algebraic identities', 'small'),
    t('Linear equations in two variables'),
    t('Quadratic equations', 'big'),
    t('Polynomials and factorisation', 'big'),
    t('Componendo based algebra'),
    t('Maxima and minima of expressions', 'big'),
  ], 'tough'),
  ch('Geometry', [
    t('Lines and angles', 'small'),
    t('Triangles: properties and congruence', 'big'),
    t('Similarity and mid-point theorem'),
    t('Centres of a triangle', 'big'),
    t('Quadrilaterals and polygons'),
    t('Circles: chords and tangents', 'big'),
  ], 'tough'),
  ch('Mensuration', [
    t('Area and perimeter of plane figures'),
    t('Triangle and quadrilateral area formulas'),
    t('Circle, sector and segment'),
    t('Cube, cuboid and cylinder', 'big'),
    t('Cone, sphere and hemisphere', 'big'),
    t('Prism, pyramid and frustum', 'big'),
  ], 'tough'),
  ch('Trigonometry', [
    t('Trigonometric ratios and identities', 'big'),
    t('Complementary angles'),
    t('Maximum and minimum values'),
    t('Height and distance', 'big'),
  ], 'tough'),
  ch('Coordinate Geometry', [t('Distance and section formula'), t('Slope and equation of line'), t('Area of triangle from coordinates')]),
  ch('Data Interpretation', [
    t('Table based DI'),
    t('Bar graph'),
    t('Line graph'),
    t('Pie chart', 'big'),
    t('Mixed and caselet DI', 'big'),
  ]),
  ch('Statistics & Probability', [t('Mean, median, mode'), t('Permutation and combination', 'big'), t('Probability basics', 'big')], 'tough'),
];

export const QUANT_ELEMENTARY: TemplateChapter[] = [
  ...QUANT_ARITHMETIC.slice(0, 10),
  ch('Basic Algebra', [t('Algebraic identities', 'small'), t('Simple equations')], 'easy'),
  ch('Basic Geometry & Mensuration', [t('Triangles and circles'), t('Area and volume formulas'), t('Perimeter problems', 'small')]),
  ch('Data Interpretation Basics', [t('Table and bar graph', 'small'), t('Pie chart')], 'easy'),
];

/* ------------------------------------------------------------ Reasoning */

export const REASONING_VERBAL: TemplateChapter[] = [
  ch('Analogy', [t('Word analogy', 'small'), t('Number analogy', 'small'), t('Letter analogy', 'small'), t('Semantic and symbolic analogy')], 'easy'),
  ch('Classification (Odd One Out)', [t('Word classification', 'small'), t('Number classification', 'small'), t('Letter classification', 'small')], 'easy'),
  ch('Series', [t('Number series', 'big'), t('Alphabet series'), t('Alpha-numeric series'), t('Missing term series')]),
  ch('Coding-Decoding', [t('Letter coding'), t('Number coding'), t('Substitution coding', 'small'), t('Conditional coding', 'big')]),
  ch('Blood Relations', [t('Family tree basics'), t('Coded blood relations', 'big'), t('Puzzle based relations')]),
  ch('Direction & Distance', [t('Direction sense basics', 'small'), t('Shadow based questions'), t('Shortest distance')], 'easy'),
  ch('Ranking & Order', [t('Ranking from both ends', 'small'), t('Order and sequence arrangement')], 'easy'),
  ch('Syllogism', [t('Basic syllogism rules'), t('Venn diagram method', 'big'), t('Possibility cases', 'big')], 'tough'),
  ch('Seating Arrangement', [t('Linear arrangement', 'big'), t('Circular arrangement', 'big'), t('Double row arrangement', 'big')], 'tough'),
  ch('Puzzles', [t('Floor and box puzzles', 'big'), t('Scheduling puzzles', 'big'), t('Categorised puzzles', 'big')], 'tough'),
  ch('Inequality', [t('Direct inequality'), t('Coded inequality', 'big')]),
  ch('Statement & Conclusion', [t('Statement and assumption'), t('Statement and course of action'), t('Cause and effect')]),
  ch('Data Sufficiency', [t('Two statement sufficiency'), t('Three statement sufficiency')]),
  ch('Machine Input-Output', [t('Shifting based input-output', 'big'), t('Arithmetic based input-output', 'big')], 'tough'),
];

export const REASONING_NON_VERBAL: TemplateChapter[] = [
  ch('Non-Verbal Series', [t('Figure series', 'small'), t('Figure analogy', 'small'), t('Figure classification', 'small')], 'easy'),
  ch('Mirror & Water Images', [t('Mirror image', 'small'), t('Water image', 'small')], 'easy'),
  ch('Paper Folding & Cutting', [t('Paper folding'), t('Paper cutting')]),
  ch('Embedded & Hidden Figures', [t('Embedded figures', 'small'), t('Completion of figure')], 'easy'),
  ch('Cubes & Dice', [t('Dice: opposite faces'), t('Cube painting and cutting', 'big')], 'tough'),
  ch('Counting of Figures', [t('Counting triangles', 'small'), t('Counting squares and rectangles', 'small')], 'easy'),
  ch('Venn Diagram', [t('Basic Venn diagrams', 'small'), t('Venn diagram based calculation')]),
];

/* -------------------------------------------------------------- English */

export const ENGLISH_CORE: TemplateChapter[] = [
  ch('Grammar: Parts of Speech', [t('Noun and pronoun', 'small'), t('Adjective and adverb', 'small'), t('Verb and its forms'), t('Preposition', 'big'), t('Conjunction', 'small')]),
  ch('Tense & Sequence of Tenses', [t('Present, past, future tense'), t('Sequence of tenses', 'big')]),
  ch('Subject-Verb Agreement', [t('Rules of concord', 'big'), t('Common concord errors')]),
  ch('Error Detection', [t('Spotting errors: rules'), t('Sentence improvement', 'big'), t('Practice sets', 'big')], 'tough'),
  ch('Narration & Voice', [t('Active and passive voice', 'big'), t('Direct and indirect speech', 'big')], 'tough'),
  ch('Vocabulary', [t('Synonyms', 'small'), t('Antonyms', 'small'), t('One word substitution', 'big'), t('Spelling correction', 'small'), t('Homonyms and confusing words')]),
  ch('Idioms & Phrases', [t('Common idioms', 'big'), t('Phrasal verbs', 'big')]),
  ch('Cloze Test & Fillers', [t('Single fillers'), t('Double fillers'), t('Cloze test practice', 'big')]),
  ch('Sentence Rearrangement', [t('Para jumbles', 'big'), t('Sentence connectors')]),
  ch('Reading Comprehension', [t('RC strategy'), t('Fact based RC', 'big'), t('Inference based RC', 'big')]),
  ch('Writing Skills', [t('Precis and summary'), t('Letter and application'), t('Essay writing', 'big')]),
];

/* ---------------------------------------------------- General Awareness */

export const GA_HISTORY: TemplateChapter[] = [
  ch('Ancient India', [t('Indus Valley Civilisation', 'big'), t('Vedic period'), t('Jainism and Buddhism'), t('Mahajanapadas and Mauryas', 'big'), t('Gupta and post-Gupta era')]),
  ch('Medieval India', [t('Delhi Sultanate', 'big'), t('Vijayanagara and Bahmani'), t('Mughal Empire', 'big'), t('Bhakti and Sufi movements'), t('Marathas')]),
  ch('Modern India', [t('Advent of Europeans'), t('Battles and expansion of British rule', 'big'), t('Revolt of 1857'), t('Socio-religious reform movements', 'big'), t('Indian National Congress', 'big'), t('Gandhian movements', 'big'), t('Revolutionary movements'), t('Independence and partition')]),
  ch('Art & Culture', [t('Classical dances', 'small'), t('Music and instruments', 'small'), t('Architecture styles'), t('Festivals of India', 'small')], 'easy'),
];

export const GA_GEOGRAPHY: TemplateChapter[] = [
  ch('Physical Geography', [t('Universe and solar system'), t('Interior of the earth'), t('Landforms and rocks'), t('Atmosphere and climate', 'big'), t('Oceans and currents')]),
  ch('Indian Geography', [t('Physiographic divisions', 'big'), t('Rivers and drainage systems', 'big'), t('Climate and monsoon'), t('Soils and vegetation'), t('Agriculture and crops'), t('Minerals and industries')]),
  ch('World Geography', [t('Continents overview'), t('Important straits and canals', 'small'), t('World climatic regions'), t('Countries, capitals and currencies', 'small')]),
  ch('Environment & Ecology', [t('Ecosystem and biodiversity'), t('National parks and sanctuaries'), t('Climate change and conventions', 'big')]),
];

export const GA_POLITY: TemplateChapter[] = [
  ch('Constitution Basics', [t('Making of the Constitution'), t('Preamble', 'small'), t('Sources and features of Constitution'), t('Schedules and parts', 'small')]),
  ch('Fundamental Rights & Duties', [t('Fundamental Rights', 'big'), t('Directive Principles'), t('Fundamental Duties', 'small')]),
  ch('Union Government', [t('President and Vice-President', 'big'), t('Prime Minister and Council of Ministers'), t('Parliament: structure and functions', 'big'), t('Law making process')]),
  ch('Judiciary', [t('Supreme Court', 'big'), t('High Courts and subordinate courts'), t('Judicial review and PIL')]),
  ch('State & Local Government', [t('Governor and state legislature'), t('Panchayati Raj', 'big'), t('Urban local bodies')]),
  ch('Constitutional Bodies', [t('Election Commission'), t('CAG and UPSC'), t('Finance Commission'), t('Amendments and emergency provisions', 'big')]),
];

export const GA_ECONOMY: TemplateChapter[] = [
  ch('Basic Economics', [t('Microeconomics basics'), t('Demand and supply'), t('National income concepts', 'big')]),
  ch('Indian Economy', [t('Planning and NITI Aayog'), t('Agriculture and food policy'), t('Industry and MSME'), t('Poverty and unemployment', 'big')]),
  ch('Money & Banking', [t('RBI and monetary policy', 'big'), t('Banking structure in India'), t('Inflation and price indices', 'big')]),
  ch('Public Finance & Trade', [t('Budget and taxation', 'big'), t('GST'), t('Balance of payments and foreign trade')]),
];

export const GA_SCIENCE: TemplateChapter[] = [
  ch('Physics', [t('Motion, force and laws'), t('Work, energy and power'), t('Light and sound', 'big'), t('Electricity and magnetism', 'big'), t('Heat and thermodynamics'), t('Units and measurement', 'small')]),
  ch('Chemistry', [t('Matter and its states', 'small'), t('Atomic structure'), t('Periodic table', 'big'), t('Acids, bases and salts'), t('Metals and non-metals'), t('Carbon compounds'), t('Everyday chemistry', 'small')]),
  ch('Biology', [t('Cell and cell division'), t('Plant physiology'), t('Human body systems', 'big'), t('Nutrition and deficiency diseases'), t('Diseases and pathogens', 'big'), t('Genetics basics')]),
  ch('Science & Technology', [t('Space programmes of India', 'big'), t('Defence technology'), t('IT and computers'), t('Nuclear and energy technology')]),
];

export const GA_STATIC: TemplateChapter[] = [
  ch('Static GK', [t('Important days and dates', 'small'), t('Books and authors', 'small'), t('Awards and honours', 'small'), t('Sports and trophies'), t('Dances, folk arts and fairs', 'small'), t('First in India and world', 'small'), t('Superlatives: longest, largest, highest', 'small')], 'easy'),
  ch('Organisations & Institutions', [t('UN and its agencies'), t('International organisations HQ', 'small'), t('Indian research institutes', 'small')], 'easy'),
];

export const GA_CURRENT: TemplateChapter[] = [
  ch('Current Affairs', [t('National current affairs', 'big'), t('International current affairs', 'big'), t('Economy and banking news', 'big'), t('Government schemes', 'big'), t('Sports news'), t('Appointments and obituaries'), t('Summits and conferences'), t('Defence exercises'), t('Science and tech news')]),
];

/* ------------------------------------------------------------- Computer */

export const COMPUTER_BASICS: TemplateChapter[] = [
  ch('Computer Fundamentals', [t('Generations and types of computers', 'small'), t('Input and output devices', 'small'), t('Memory and storage'), t('Number systems')], 'easy'),
  ch('Software & OS', [t('Operating system basics'), t('MS Word', 'small'), t('MS Excel', 'big'), t('MS PowerPoint', 'small')]),
  ch('Internet & Networking', [t('Internet basics', 'small'), t('Networking devices and topologies'), t('Email and browsers', 'small')], 'easy'),
  ch('Cyber Security', [t('Threats: virus, malware, phishing'), t('Security practices and firewalls'), t('Digital payments and IT Act')]),
];

/* ---------------------------------------------------------------- Hindi */

export const HINDI_CORE: TemplateChapter[] = [
  ch('व्याकरण', [t('संज्ञा एवं सर्वनाम', 'small'), t('विशेषण एवं क्रिया'), t('काल एवं वाच्य'), t('कारक', 'small'), t('संधि', 'big'), t('समास', 'big')]),
  ch('शब्द ज्ञान', [t('पर्यायवाची', 'small'), t('विलोम शब्द', 'small'), t('अनेकार्थी शब्द', 'small'), t('वर्तनी शुद्धि'), t('शब्द युग्म')]),
  ch('मुहावरे एवं लोकोक्तियाँ', [t('प्रमुख मुहावरे', 'big'), t('लोकोक्तियाँ')]),
  ch('वाक्य एवं गद्यांश', [t('वाक्य शुद्धि', 'big'), t('रिक्त स्थान पूर्ति'), t('गद्यांश आधारित प्रश्न', 'big')]),
];
