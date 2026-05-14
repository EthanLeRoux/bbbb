export const COLORS = {
  bg:         '#0e0e0f',
  surface:    '#1a1a1c',
  border:     '#2a2a2c',
  text:       '#f0ede8',
  muted:      '#6b6b70',
  accent:     '#c8f135',
  diffEasy:   '#4ade80',
  diffMedium: '#fbbf24',
  diffHard:   '#f87171',
  diffMixed:  '#c8f135',
  error:      '#f87171',
  success:    '#4ade80',
};

export const FONTS = {
  mono:  "'IBM Plex Mono', monospace",
  serif: "'Instrument Serif', serif",
};

export const SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, xxl: 64 };
export const SIZE  = { xs: 11, sm: 13, md: 15, lg: 20, xl: 28, xxl: 40 };

export const LABELS = {
  appName: 'Benkyo.ai',
  nav: {
    dashboard:    'Dashboard',
    vault:        'Vault',
    generate:     'Generate',
    tests:        'Tests',
    attempts:     'Attempts',
    stats:        'Stats',
    reviewDue:    'Review Due',
  },
  empty: {
    tests:    'No tests yet - generate one to get started.',
    notes:    'No notes in this section.',
    search:   'No results found.',
    domains:  'No domains found in vault.',
    attempts: 'No attempts yet.',
  },
  error: {
    generic: 'Something went wrong.',
    retry:   'Retry',
  },
  generate: {
    title:       'Generate Test',
    domain:      'Domain',
    sections:    'Sections',
    allSections: 'All sections',
    difficulty:  'Difficulty',
    count:       'Questions',
    submit:      'Generate',
    generating:  'Generating...',
  },
  tests: {
    deleteBtn:     'Delete test',
    deleteConfirm: 'Delete this test? This cannot be undone.',
    backLink:      'Back to tests',
    startAttempt:  'Start attempt',
  },
  attempts: {
    backLink:    'Back to attempts',
    submit:      'Submit answers',
    submitting:  'Submitting...',
    showAnswer:  'Show answer',
    hideAnswer:  'Hide answer',
    showScore:   'Show Score',
    timeTaken:   'Time',
    score:       'Score',
    yourAnswer:  'Your answer',
    modelAnswer: 'Model answer',
  },
  difficulty: {
    easy:   'EASY',
    medium: 'MEDIUM',
    hard:   'HARD',
    mixed:  'MIXED',
  },
};

export const DIFF_COLOR = {
  easy:   COLORS.diffEasy,
  medium: COLORS.diffMedium,
  hard:   COLORS.diffHard,
  mixed:  COLORS.diffMixed,
};

export const PAGE_SIZE          = 20;
export const SEARCH_DEBOUNCE_MS = 400;
export const SIDEBAR_WIDTH      = 180;
