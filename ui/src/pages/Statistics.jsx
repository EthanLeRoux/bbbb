import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttempts } from '../api/attempts';
import Skeleton from '../components/Skeleton';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.lg,
  },
  header: {
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: SPACE.md,
  },
  title: {
    margin: 0,
    fontFamily: FONTS.serif,
    fontSize: SIZE.xxl,
    color: COLORS.text,
  },
  subtitle: {
    marginTop: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    outline: 'none',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: SPACE.md,
  },
  summary: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
  },
  summaryLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
  },
  summaryValue: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: SPACE.lg,
  },
  panel: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    minHeight: 360,
    overflow: 'hidden',
  },
  panelWide: {
    gridColumn: '1 / -1',
  },
  panelTitle: {
    margin: 0,
    marginBottom: SPACE.xs,
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
  },
  panelPurpose: {
    marginBottom: SPACE.md,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  chartWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  chartSvg: {
    width: '100%',
    minWidth: 520,
    height: 280,
    display: 'block',
  },
  empty: {
    minHeight: 220,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    textAlign: 'center',
  },
  error: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
    color: COLORS.text,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
  heatmap: {
    overflow: 'auto',
    maxHeight: 520,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
  },
  heatmapGrid: {
    display: 'grid',
    minWidth: 'max-content',
  },
  heatmapHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: SPACE.sm,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    whiteSpace: 'nowrap',
  },
  heatmapTest: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    backgroundColor: COLORS.bg,
    borderRight: `1px solid ${COLORS.border}`,
    padding: SPACE.sm,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
    whiteSpace: 'nowrap',
  },
  heatmapCell: {
    width: 92,
    minHeight: 38,
    padding: SPACE.xs,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: `1px solid ${COLORS.border}`,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.bg,
  },
};

const CHART = {
  width: 720,
  height: 280,
  left: 54,
  right: 18,
  top: 20,
  bottom: 48,
};

function dateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = dateValue(value);
  if (!d) return 'Unknown date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(value) {
  const d = dateValue(value);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function pct(value) {
  return `${Math.round(value || 0)}%`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalizeTopic(result, attempt) {
  return result.sourceNoteTopic ||
    result.topic ||
    result.sourceConcept ||
    result.conceptId ||
    attempt.topic ||
    attempt.testTopic ||
    'Untitled topic';
}

function scoreFromQuestion(result) {
  if (typeof result.aiScore === 'number') return clamp(result.aiScore, 0, 100);
  if (typeof result.score === 'number') return clamp(result.score, 0, 100);
  if (typeof result.correct === 'boolean') return result.correct ? 100 : 0;
  if (typeof result.isCorrect === 'boolean') return result.isCorrect ? 100 : 0;
  return null;
}

function scoreFromAttempt(attempt, questionScores) {
  if (typeof attempt.scorePercent === 'number') return clamp(attempt.scorePercent, 0, 100);
  if (typeof attempt.score === 'number') return clamp(attempt.score, 0, 100);
  if (questionScores.length) {
    return questionScores.reduce((sum, value) => sum + value, 0) / questionScores.length;
  }
  return 0;
}

function flattenAttempts(attempts = []) {
  const tests = [];
  const questions = [];

  attempts.forEach((attempt, index) => {
    const resultEntries = Object.entries(attempt.perQuestionResults || {});
    const domain = attempt.domainId || attempt.domain || attempt.testDomain || 'General';
    const section = attempt.sectionId || attempt.section || attempt.testSection || 'Main';
    const submittedAt = attempt.submittedAt || attempt.SubmittedAt || attempt.completedAt || attempt.updatedAt || attempt.createdAt;
    const testId = attempt.testId || attempt.id || `attempt-${index + 1}`;
    const questionScores = [];
    let totalTime = 0;

    resultEntries.forEach(([questionId, result]) => {
      const score = scoreFromQuestion(result);
      if (score == null) return;

      const timeSpent = Number(result.timing ?? result.timeSpent ?? attempt.timings?.[questionId] ?? 0) || 0;
      const topic = normalizeTopic(result, attempt);
      questionScores.push(score);
      totalTime += timeSpent;

      questions.push({
        id: `${attempt.id || testId}-${questionId}`,
        domain,
        section,
        topic,
        timeSpent,
        score,
        testId,
        attemptId: attempt.id,
        date: submittedAt,
      });
    });

    const fallbackTotalQuestions = Number(attempt.totalQuestions || 0);
    const totalQuestions = questionScores.length || fallbackTotalQuestions || 1;
    const fallbackTime = Number(attempt.avgTimePerQuestion || 0) * totalQuestions;
    const score = scoreFromAttempt(attempt, questionScores);

    tests.push({
      id: attempt.id || testId,
      testId,
      domain,
      section,
      topic: attempt.topic || attempt.testTopic || '',
      date: submittedAt,
      score,
      questionCount: totalQuestions,
      totalTime: totalTime || Number(attempt.totalTime || 0) || fallbackTime || 0,
    });
  });

  return { tests, questions };
}

function filterByDate(item, filters) {
  const d = dateValue(item.date);
  if (!d) return true;
  if (filters.startDate && d < new Date(`${filters.startDate}T00:00:00`)) return false;
  if (filters.endDate && d > new Date(`${filters.endDate}T23:59:59`)) return false;
  return true;
}

function getGroupLevel(filters) {
  if (!filters.domain) return 'domain';
  if (!filters.section) return 'section';
  return 'topic';
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function topicPerformance(questions, groupLevel) {
  const groups = new Map();
  questions.forEach((item) => {
    const key = item[groupLevel] || 'Unknown';
    const group = groups.get(key) || { label: key, scores: [], questions: 0, time: 0 };
    group.scores.push(item.score);
    group.questions += 1;
    group.time += item.timeSpent;
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map(group => ({
      ...group,
      accuracy: average(group.scores),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

function progressSeries(tests) {
  return [...tests]
    .filter(test => dateValue(test.date))
    .sort((a, b) => dateValue(a.date) - dateValue(b.date))
    .map((test, index) => ({ ...test, index: index + 1 }));
}

function movingAverage(points, windowSize = 3) {
  return points.map((point, index) => {
    const slice = points.slice(Math.max(0, index - windowSize + 1), index + 1);
    return { ...point, score: average(slice.map(item => item.score)) };
  });
}

function heatmapData(questions) {
  const topics = uniq(questions.map(item => item.topic));
  const byTest = new Map();

  questions.forEach((item) => {
    const row = byTest.get(item.testId) || {
      testId: item.testId,
      date: item.date,
      cells: new Map(),
    };
    const cell = row.cells.get(item.topic) || [];
    cell.push(item.score);
    row.cells.set(item.topic, cell);
    byTest.set(item.testId, row);
  });

  const tests = Array.from(byTest.values())
    .sort((a, b) => (dateValue(b.date)?.getTime() || 0) - (dateValue(a.date)?.getTime() || 0))
    .slice(0, 18);

  return { topics: topics.slice(0, 14), tests };
}

function testsFromQuestions(questions, allTests) {
  const testLookup = new Map(allTests.map(test => [test.id, test]));
  const groups = new Map();

  questions.forEach((item) => {
    const key = item.attemptId || item.testId;
    const base = testLookup.get(key);
    const group = groups.get(key) || {
      id: key,
      testId: item.testId,
      domain: item.domain,
      section: item.section,
      date: item.date || base?.date,
      scores: [],
      totalTime: 0,
      questionCount: 0,
    };

    group.scores.push(item.score);
    group.totalTime += item.timeSpent;
    group.questionCount += 1;
    groups.set(key, group);
  });

  return Array.from(groups.values()).map(group => ({
    ...group,
    score: average(group.scores),
  }));
}

function valueToColor(value) {
  if (value == null) return COLORS.bg;
  const ratio = clamp(value, 0, 100) / 100;
  if (ratio < 0.5) return COLORS.error;
  if (ratio < 0.75) return COLORS.diffMedium;
  if (ratio < 0.9) return COLORS.diffEasy;
  return COLORS.success;
}

function axisTextProps() {
  return {
    fill: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: 11,
  };
}

function EmptyChart({ children }) {
  return <div style={styles.empty}>{children}</div>;
}

function BarChart({ data, groupLevel }) {
  if (!data.length) return <EmptyChart>No topic performance data for these filters.</EmptyChart>;

  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const barGap = 10;
  const barWidth = Math.max(18, (innerWidth - barGap * (data.length - 1)) / data.length);
  const label = groupLevel === 'domain' ? 'Domains' : groupLevel === 'section' ? 'Sections' : 'Topics';

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} style={styles.chartSvg} role="img" aria-label="Topic performance bar chart">
        <line x1={CHART.left} y1={CHART.top} x2={CHART.left} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        <line x1={CHART.left} y1={CHART.top + innerHeight} x2={CHART.left + innerWidth} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        {[0, 25, 50, 75, 100].map(tick => {
          const y = CHART.top + innerHeight - (tick / 100) * innerHeight;
          return (
            <g key={tick}>
              <line x1={CHART.left} y1={y} x2={CHART.left + innerWidth} y2={y} stroke={COLORS.border} opacity="0.35" />
              <text x={CHART.left - 10} y={y + 4} textAnchor="end" {...axisTextProps()}>{tick}%</text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const x = CHART.left + index * (barWidth + barGap);
          const height = (item.accuracy / 100) * innerHeight;
          const y = CHART.top + innerHeight - height;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barWidth} height={height} fill={valueToColor(item.accuracy)} rx="3">
                <title>{`${item.label}: ${pct(item.accuracy)} across ${item.questions} question${item.questions === 1 ? '' : 's'}`}</title>
              </rect>
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill={COLORS.text} fontFamily={FONTS.mono} fontSize="11">
                {pct(item.accuracy)}
              </text>
              <text x={x + barWidth / 2} y={CHART.top + innerHeight + 18} textAnchor="middle" {...axisTextProps()}>
                {item.label.length > 10 ? `${item.label.slice(0, 10)}...` : item.label}
              </text>
              <text x={x + barWidth / 2} y={CHART.top + innerHeight + 34} textAnchor="middle" {...axisTextProps()}>
                {item.questions}q
              </text>
            </g>
          );
        })}
        <text x={CHART.left + innerWidth / 2} y={CHART.height - 4} textAnchor="middle" {...axisTextProps()}>{label}</text>
      </svg>
    </div>
  );
}

function LineChart({ data, showMovingAverage }) {
  if (data.length < 2) return <EmptyChart>Take at least two tests to see progress over time.</EmptyChart>;

  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const xFor = (_, index) => CHART.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const yFor = score => CHART.top + innerHeight - (score / 100) * innerHeight;
  const path = data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(point, index)} ${yFor(point.score)}`).join(' ');
  const ma = movingAverage(data);
  const maPath = ma.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(point, index)} ${yFor(point.score)}`).join(' ');

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} style={styles.chartSvg} role="img" aria-label="Progress over time line chart">
        <line x1={CHART.left} y1={CHART.top} x2={CHART.left} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        <line x1={CHART.left} y1={CHART.top + innerHeight} x2={CHART.left + innerWidth} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        {[0, 25, 50, 75, 100].map(tick => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={CHART.left} y1={y} x2={CHART.left + innerWidth} y2={y} stroke={COLORS.border} opacity="0.35" />
              <text x={CHART.left - 10} y={y + 4} textAnchor="end" {...axisTextProps()}>{tick}%</text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={COLORS.accent} strokeWidth="3" />
        {showMovingAverage && <path d={maPath} fill="none" stroke={COLORS.success} strokeWidth="2" strokeDasharray="5 5" />}
        {data.map((point, index) => (
          <circle key={point.id} cx={xFor(point, index)} cy={yFor(point.score)} r="5" fill={COLORS.accent}>
            <title>{`${formatDate(point.date)}: ${pct(point.score)} (${point.questionCount} questions)`}</title>
          </circle>
        ))}
        {data.map((point, index) => (
          index % Math.ceil(data.length / 6) === 0 && (
            <text key={`label-${point.id}`} x={xFor(point, index)} y={CHART.top + innerHeight + 20} textAnchor="middle" {...axisTextProps()}>
              {formatShortDate(point.date)}
            </text>
          )
        ))}
      </svg>
    </div>
  );
}

function ScatterPlot({ data }) {
  if (!data.length) return <EmptyChart>No completed tests match these filters.</EmptyChart>;

  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const maxTime = Math.max(...data.map(item => item.totalTime), 1);
  const domains = uniq(data.map(item => item.domain));
  const palette = [COLORS.accent, COLORS.diffEasy, COLORS.diffMedium, COLORS.error, COLORS.success];

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} style={styles.chartSvg} role="img" aria-label="Time vs score scatter plot">
        <line x1={CHART.left} y1={CHART.top} x2={CHART.left} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        <line x1={CHART.left} y1={CHART.top + innerHeight} x2={CHART.left + innerWidth} y2={CHART.top + innerHeight} stroke={COLORS.border} />
        {[0, 25, 50, 75, 100].map(tick => {
          const y = CHART.top + innerHeight - (tick / 100) * innerHeight;
          return <text key={tick} x={CHART.left - 10} y={y + 4} textAnchor="end" {...axisTextProps()}>{tick}%</text>;
        })}
        {[0, 0.5, 1].map(tick => {
          const x = CHART.left + tick * innerWidth;
          return <text key={tick} x={x} y={CHART.top + innerHeight + 22} textAnchor="middle" {...axisTextProps()}>{Math.round((maxTime * tick) / 60)}m</text>;
        })}
        {data.map((point) => {
          const x = CHART.left + (point.totalTime / maxTime) * innerWidth;
          const y = CHART.top + innerHeight - (point.score / 100) * innerHeight;
          const r = clamp(4 + point.questionCount, 5, 16);
          const color = palette[domains.indexOf(point.domain) % palette.length] || COLORS.accent;
          return (
            <circle key={point.id} cx={x} cy={y} r={r} fill={color} opacity="0.78" stroke={COLORS.bg} strokeWidth="1">
              <title>{`${point.domain} / ${point.section}\n${formatDate(point.date)}\nScore: ${pct(point.score)}\nTime: ${Math.round(point.totalTime / 60)}m\nQuestions: ${point.questionCount}`}</title>
            </circle>
          );
        })}
        <text x={CHART.left + innerWidth / 2} y={CHART.height - 4} textAnchor="middle" {...axisTextProps()}>Time spent per test</text>
      </svg>
    </div>
  );
}

function Heatmap({ data }) {
  const { topics, tests } = data;
  if (!topics.length || !tests.length) return <EmptyChart>No topic-by-test data for these filters.</EmptyChart>;

  return (
    <div style={styles.heatmap}>
      <div
        style={{
          ...styles.heatmapGrid,
          gridTemplateColumns: `180px repeat(${topics.length}, 92px)`,
        }}
      >
        <div style={{ ...styles.heatmapHeader, left: 0 }}>Test</div>
        {topics.map(topic => (
          <div key={topic} style={styles.heatmapHeader} title={topic}>
            {topic.length > 12 ? `${topic.slice(0, 12)}...` : topic}
          </div>
        ))}
        {tests.map(test => (
          <Fragment key={test.testId}>
            <div key={`${test.testId}-label`} style={styles.heatmapTest} title={test.testId}>
              <div>{formatShortDate(test.date)}</div>
              <div style={{ color: COLORS.muted }}>{test.testId.slice(0, 12)}</div>
            </div>
            {topics.map(topic => {
              const values = test.cells.get(topic);
              const value = values ? average(values) : null;
              return (
                <div
                  key={`${test.testId}-${topic}`}
                  style={{
                    ...styles.heatmapCell,
                    backgroundColor: valueToColor(value),
                    opacity: value == null ? 0.22 : 0.92,
                    color: value == null ? COLORS.muted : COLORS.bg,
                  }}
                  title={`${topic} / ${test.testId}: ${value == null ? 'No questions' : pct(value)}`}
                >
                  {value == null ? '-' : pct(value)}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default function Statistics() {
  const [filters, setFilters] = useState({
    domain: '',
    section: '',
    topic: '',
    startDate: '',
    endDate: '',
  });
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  const {
    data: attempts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stats-attempts'],
    queryFn: () => getAttempts({ status: 'completed', limit: 1000, offset: 0 }),
  });

  const { tests, questions } = useMemo(() => flattenAttempts(attempts), [attempts]);

  const domainOptions = useMemo(() => uniq(questions.map(item => item.domain)), [questions]);
  const sectionOptions = useMemo(() => uniq(questions.filter(item => !filters.domain || item.domain === filters.domain).map(item => item.section)), [questions, filters.domain]);
  const topicOptions = useMemo(() => uniq(questions.filter(item =>
    (!filters.domain || item.domain === filters.domain) &&
    (!filters.section || item.section === filters.section)
  ).map(item => item.topic)), [questions, filters.domain, filters.section]);

  const filteredQuestions = useMemo(() => questions.filter(item =>
    (!filters.domain || item.domain === filters.domain) &&
    (!filters.section || item.section === filters.section) &&
    (!filters.topic || item.topic === filters.topic) &&
    filterByDate(item, filters)
  ), [questions, filters]);

  const filteredTests = useMemo(() => testsFromQuestions(filteredQuestions, tests), [filteredQuestions, tests]);

  const groupLevel = getGroupLevel(filters);
  const barData = useMemo(() => topicPerformance(filteredQuestions, groupLevel), [filteredQuestions, groupLevel]);
  const lineData = useMemo(() => progressSeries(filteredTests), [filteredTests]);
  const heatData = useMemo(() => heatmapData(filteredQuestions), [filteredQuestions]);
  const avgScore = average(filteredTests.map(test => test.score));
  const avgTime = average(filteredTests.map(test => test.totalTime));
  const weakest = barData[0]?.label || 'Not enough data';

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'domain') {
        next.section = '';
        next.topic = '';
      }
      if (key === 'section') {
        next.topic = '';
      }
      return next;
    });
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          {LABELS.error.generic}
          <button type="button" onClick={refetch} style={{ ...styles.input, width: 'auto', marginTop: SPACE.sm, cursor: 'pointer' }}>
            {LABELS.error.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Study Analytics</h1>
        <div style={styles.subtitle}>Performance insights by Domain → Section → Topic</div>
      </div>

      <div style={styles.filters}>
        <div style={styles.field}>
          <label style={styles.label}>Domain</label>
          <select value={filters.domain} onChange={(e) => updateFilter('domain', e.target.value)} style={styles.input}>
            <option value="">All domains</option>
            {domainOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Section</label>
          <select value={filters.section} onChange={(e) => updateFilter('section', e.target.value)} style={styles.input}>
            <option value="">All sections</option>
            {sectionOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{filters.section ? 'Topic' : filters.domain ? 'Topic / Section' : 'Topic / Domain'}</label>
          <select value={filters.topic} onChange={(e) => updateFilter('topic', e.target.value)} style={styles.input}>
            <option value="">All topics</option>
            {topicOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Start date</label>
          <input type="date" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>End date</label>
          <input type="date" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} style={styles.input} />
        </div>
        <label style={{ ...styles.checkbox, alignSelf: 'end', paddingBottom: SPACE.sm }}>
          <input type="checkbox" checked={showMovingAverage} onChange={(e) => setShowMovingAverage(e.target.checked)} />
          Moving average
        </label>
      </div>

      {isLoading ? (
        <>
          <Skeleton height={82} count={1} />
          <Skeleton height={360} count={2} />
        </>
      ) : (
        <>
          <div style={styles.summaryRow}>
            <div style={styles.summary}>
              <div style={styles.summaryLabel}>Completed tests</div>
              <div style={styles.summaryValue}>{filteredTests.length}</div>
            </div>
            <div style={styles.summary}>
              <div style={styles.summaryLabel}>Questions analyzed</div>
              <div style={styles.summaryValue}>{filteredQuestions.length}</div>
            </div>
            <div style={styles.summary}>
              <div style={styles.summaryLabel}>Average score</div>
              <div style={styles.summaryValue}>{filteredTests.length ? pct(avgScore) : '-'}</div>
            </div>
            <div style={styles.summary}>
              <div style={styles.summaryLabel}>Needs attention</div>
              <div style={styles.summaryValue}>{weakest}</div>
            </div>
            <div style={styles.summary}>
              <div style={styles.summaryLabel}>Avg time/test</div>
              <div style={styles.summaryValue}>{filteredTests.length ? `${Math.round(avgTime / 60)}m` : '-'}</div>
            </div>
          </div>

          <div style={styles.grid}>
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>Topic Performance</h2>
              <div style={styles.panelPurpose}>Compare strengths and weaknesses across the current hierarchy level.</div>
              <BarChart data={barData} groupLevel={groupLevel} />
            </section>

            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>Progress Over Time</h2>
              <div style={styles.panelPurpose}>See improvement trends and score consistency across tests.</div>
              <LineChart data={lineData} showMovingAverage={showMovingAverage} />
            </section>

            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>Time vs Score</h2>
              <div style={styles.panelPurpose}>Find whether longer attempts are improving accuracy or just costing time.</div>
              <ScatterPlot data={filteredTests} />
            </section>

            <section style={{ ...styles.panel, ...styles.panelWide }}>
              <h2 style={styles.panelTitle}>Topic vs Test</h2>
              <div style={styles.panelPurpose}>Identify topics that stay weak across multiple tests.</div>
              <Heatmap data={heatData} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
