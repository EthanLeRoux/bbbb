import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttempts } from '../api/attempts';
import Skeleton from '../components/Skeleton';
import {
  ChartGrid,
  WeakestTopicsTrend,
  RecommendedFocusAreas,
  StudyStreakHeatmap,
  MistakeCategoryBreakdown,
  KnowledgeDecayAnalytics,
} from '../components/charts';
import { buildLearningInsightPipeline } from '../utils/learningInsightPipeline';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

/* ─── Styles ─────────────────────────────────────────────────────────────── */

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
  field: { display: 'flex', flexDirection: 'column', gap: SPACE.xs },
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
  summaryLabel: { fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, marginBottom: SPACE.xs },
  summaryValue: { fontFamily: FONTS.serif, fontSize: SIZE.xl, color: COLORS.text },
  insightPanel: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
    gap: SPACE.lg,
  },
  insightTitle: {
    margin: 0,
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
  },
  insightText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    lineHeight: 1.55,
  },
  insightMuted: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    lineHeight: 1.45,
  },
  insightList: {
    margin: 0,
    paddingLeft: SPACE.md,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  trendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: SPACE.sm,
  },
  trendCard: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.sm,
  },
  trendTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
    textTransform: 'uppercase',
    marginBottom: SPACE.xs,
  },
  chartWrap: { width: '100%', overflowX: 'auto' },
  chartToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
    flexWrap: 'wrap',
  },
  chartToolbarLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  chartSvg: { width: '100%', minWidth: 520, height: 280, display: 'block' },
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
  heatmap: { overflow: 'auto', maxHeight: 520, border: `1px solid ${COLORS.border}`, borderRadius: 6 },
  heatmapExpanded: { maxHeight: 'calc(90vh - 152px)' },
  heatmapGrid: { display: 'grid', minWidth: 'max-content' },
  heatmapHeader: {
    position: 'sticky', top: 0, zIndex: 2,
    backgroundColor: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: SPACE.sm,
    fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, whiteSpace: 'nowrap',
  },
  heatmapTest: {
    position: 'sticky', left: 0, zIndex: 1,
    backgroundColor: COLORS.bg,
    borderRight: `1px solid ${COLORS.border}`,
    padding: SPACE.sm,
    fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.text, whiteSpace: 'nowrap',
  },
  heatmapCell: {
    width: 92, minHeight: 38, padding: SPACE.xs,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRight: `1px solid ${COLORS.border}`,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.bg,
  },
  panelButton: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    cursor: 'pointer',
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
  },
};

/* ─── Chart layout constants ─────────────────────────────────────────────── */

const CHART = { width: 720, height: 280, left: 54, right: 18, top: 20, bottom: 48 };

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function dateValue(v) {
  if (!v) return null;
  if (typeof v?.toDate === 'function') {
    const d = v.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'object') {
    const seconds = v.seconds ?? v._seconds;
    if (Number.isFinite(seconds)) {
      const d = new Date(seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function formatDate(v) {
  const d = dateValue(v);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';
}
function formatShortDate(v) {
  const d = dateValue(v);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
}
function pct(v) { return `${Math.round(v || 0)}%`; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b)); }
function average(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }

function normalizeTopic(result, attempt) {
  return result.sourceNoteTopic || result.topic || result.sourceConcept ||
    result.conceptId || attempt.topic || attempt.testTopic || 'Untitled topic';
}
function scoreFromQuestion(r) {
  if (typeof r.aiScore === 'number') return clamp(r.aiScore, 0, 100);
  if (typeof r.score === 'number') return clamp(r.score, 0, 100);
  if (typeof r.correct === 'boolean') return r.correct ? 100 : 0;
  if (typeof r.isCorrect === 'boolean') return r.isCorrect ? 100 : 0;
  return null;
}
function scoreFromAttempt(attempt, qScores) {
  if (typeof attempt.scorePercent === 'number') return clamp(attempt.scorePercent, 0, 100);
  if (typeof attempt.score === 'number') return clamp(attempt.score, 0, 100);
  return qScores.length ? average(qScores) : 0;
}

function flattenAttempts(attempts = []) {
  const tests = [], questions = [];
  attempts.forEach((attempt, idx) => {
    const entries = Object.entries(attempt.perQuestionResults || {});
    const domain = attempt.domainId || attempt.domain || attempt.testDomain || 'General';
    const section = attempt.sectionId || attempt.section || attempt.testSection || 'Main';
    const date = dateValue(attempt.submittedAt || attempt.SubmittedAt || attempt.completedAt || attempt.updatedAt || attempt.createdAt);
    const testId = attempt.testId || attempt.id || `attempt-${idx + 1}`;
    const qScores = [];
    let totalTime = 0;

    entries.forEach(([qId, result]) => {
      const score = scoreFromQuestion(result);
      if (score == null) return;
      const timeSpent = Number(result.timing ?? result.timeSpent ?? attempt.timings?.[qId] ?? 0) || 0;
      qScores.push(score);
      totalTime += timeSpent;
      questions.push({
        id: `${attempt.id || testId}-${qId}`,
        domain, section, topic: normalizeTopic(result, attempt),
        timeSpent,
        score,
        confidence: result.confidence ?? result.aiConfidence ?? attempt.averageConfidence ?? null,
        testId,
        attemptId: attempt.id,
        date,
      });
    });

    const totalQuestions = qScores.length || Number(attempt.totalQuestions || 0) || 1;
    const fallbackTime = Number(attempt.avgTimePerQuestion || 0) * totalQuestions;
    tests.push({
      id: attempt.id || testId, testId, domain, section,
      topic: attempt.topic || attempt.testTopic || '', date,
      score: scoreFromAttempt(attempt, qScores),
      questionCount: totalQuestions,
      totalTime: totalTime || Number(attempt.totalTime || 0) || fallbackTime || 0,
    });
  });
  return { tests, questions };
}

function filterByDate(item, f) {
  const d = dateValue(item.date);
  if (!d) return true;
  if (f.startDate && d < new Date(`${f.startDate}T00:00:00`)) return false;
  if (f.endDate && d > new Date(`${f.endDate}T23:59:59`)) return false;
  return true;
}

function filterTest(test, f) {
  return (!f.domain || test.domain === f.domain) &&
    (!f.section || test.section === f.section) &&
    filterByDate(test, f);
}

function getGroupLevel(f) {
  if (!f.domain) return 'domain';
  if (!f.section) return 'section';
  return 'topic';
}

function topicPerformance(questions, groupLevel) {
  const groups = new Map();
  questions.forEach((q) => {
    const key = q[groupLevel] || 'Unknown';
    const g = groups.get(key) || { label: key, scores: [], questions: 0, time: 0 };
    g.scores.push(q.score); g.questions++; g.time += q.timeSpent;
    groups.set(key, g);
  });
  return Array.from(groups.values())
    .map((g) => ({ ...g, accuracy: average(g.scores) }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

function progressSeries(tests) {
  return [...tests]
    .filter((t) => dateValue(t.date))
    .sort((a, b) => dateValue(a.date) - dateValue(b.date))
    .map((t, i) => ({ ...t, index: i + 1 }));
}

function movingAverage(points, w = 3) {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - w + 1), i + 1);
    return { ...p, score: average(slice.map((x) => x.score)) };
  });
}

function heatmapData(questions, expanded = false) {
  const topics = uniq(questions.map((q) => q.topic));
  const byTest = new Map();
  questions.forEach((q) => {
    const row = byTest.get(q.testId) || { testId: q.testId, date: q.date, cells: new Map() };
    const cell = row.cells.get(q.topic) || [];
    cell.push(q.score);
    row.cells.set(q.topic, cell);
    byTest.set(q.testId, row);
  });
  const tests = Array.from(byTest.values())
    .sort((a, b) => (dateValue(b.date)?.getTime() || 0) - (dateValue(a.date)?.getTime() || 0))
    .slice(0, expanded ? 80 : 18);
  return { topics: topics.slice(0, expanded ? 40 : 14), tests };
}

function testsFromQuestions(questions, allTests) {
  const lookup = new Map(allTests.map((t) => [t.id, t]));
  const groups = new Map();
  questions.forEach((q) => {
    const key = q.attemptId || q.testId;
    const base = lookup.get(key);
    const g = groups.get(key) || {
      id: key, testId: q.testId, domain: q.domain, section: q.section,
      date: q.date || base?.date, scores: [], totalTime: 0, questionCount: 0,
    };
    g.scores.push(q.score); g.totalTime += q.timeSpent; g.questionCount++;
    groups.set(key, g);
  });
  return Array.from(groups.values()).map((g) => ({ ...g, score: average(g.scores) }));
}

function valueToColor(v) {
  if (v == null) return COLORS.bg;
  const r = clamp(v, 0, 100) / 100;
  if (r < 0.5) return COLORS.error;
  if (r < 0.75) return COLORS.diffMedium;
  if (r < 0.9) return COLORS.diffEasy;
  return COLORS.success;
}
function axisText() { return { fill: COLORS.muted, fontFamily: FONTS.mono, fontSize: 11 }; }
function EmptyChart({ children }) { return <div style={styles.empty}>{children}</div>; }
function chartSvgStyle(expanded, minWidth = 900, height = 460) {
  return { ...styles.chartSvg, height: expanded ? height : styles.chartSvg.height, minWidth: expanded ? minWidth : styles.chartSvg.minWidth };
}

/* ─── Chart Components ────────────────────────────────────────────────────── */

function BarChart({ data, groupLevel, expanded = false }) {
  const [sortBy, setSortBy] = useState('accuracy');
  if (!data.length) return <EmptyChart>No topic performance data for these filters.</EmptyChart>;

  const sorted = expanded
    ? [...data].sort((a, b) =>
        sortBy === 'label' ? a.label.localeCompare(b.label)
        : sortBy === 'questions' ? b.questions - a.questions
        : a.accuracy - b.accuracy)
    : data;

  const { width, height, left, right, top, bottom } = CHART;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const barGap = 10;
  const barWidth = Math.max(expanded ? 34 : 18, (innerW - barGap * (sorted.length - 1)) / sorted.length);
  const groupLabel = groupLevel === 'domain' ? 'Domains' : groupLevel === 'section' ? 'Sections' : 'Topics';
  const minWidth = Math.max(900, sorted.length * (expanded ? 86 : 56));

  return (
    <>
      {expanded && (
        <div style={styles.chartToolbar} onClick={(e) => e.stopPropagation()}>
          <span style={styles.chartToolbarLabel}>Sort by</span>
          {[['accuracy','Score'],['questions','Questions'],['label', groupLabel]].map(([val, txt]) => (
            <button key={val} type="button"
              style={{ ...styles.panelButton, borderColor: sortBy === val ? COLORS.accent : COLORS.border, color: sortBy === val ? COLORS.accent : COLORS.text }}
              onClick={() => setSortBy(val)}>{txt}</button>
          ))}
        </div>
      )}
      <div style={styles.chartWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} style={chartSvgStyle(expanded, minWidth, 500)} role="img" aria-label="Topic performance bar chart">
          <line x1={left} y1={top} x2={left} y2={top + innerH} stroke={COLORS.border} />
          <line x1={left} y1={top + innerH} x2={left + innerW} y2={top + innerH} stroke={COLORS.border} />
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = top + innerH - (tick / 100) * innerH;
            return (
              <g key={tick}>
                <line x1={left} y1={y} x2={left + innerW} y2={y} stroke={COLORS.border} opacity="0.35" />
                <text x={left - 10} y={y + 4} textAnchor="end" {...axisText()}>{tick}%</text>
              </g>
            );
          })}
          {sorted.map((item, i) => {
            const x = left + i * (barWidth + barGap);
            const bh = (item.accuracy / 100) * innerH;
            const y = top + innerH - bh;
            return (
              <g key={item.label}>
                <rect x={x} y={y} width={barWidth} height={bh} fill={valueToColor(item.accuracy)} rx="3">
                  <title>{`${item.label}: ${pct(item.accuracy)} across ${item.questions} question${item.questions === 1 ? '' : 's'}`}</title>
                </rect>
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill={COLORS.text} fontFamily={FONTS.mono} fontSize={expanded ? 13 : 11}>
                  {pct(item.accuracy)}
                </text>
                <text
                  x={x + barWidth / 2} y={top + innerH + 18}
                  textAnchor={expanded ? 'end' : 'middle'}
                  transform={expanded ? `rotate(-35 ${x + barWidth / 2} ${top + innerH + 18})` : undefined}
                  {...axisText()} fontSize={expanded ? 12 : 11}
                >
                  {expanded ? item.label : item.label.length > 10 ? `${item.label.slice(0, 10)}…` : item.label}
                </text>
                <text x={x + barWidth / 2} y={top + innerH + (expanded ? 38 : 34)} textAnchor="middle" {...axisText()}>
                  {item.questions}q
                </text>
              </g>
            );
          })}
          <text x={left + innerW / 2} y={height - 4} textAnchor="middle" {...axisText()}>{groupLabel}</text>
        </svg>
      </div>
    </>
  );
}

function LineChart({ data, showMovingAverage, expanded = false }) {
  if (data.length < 2) return <EmptyChart>Take at least two tests to see progress over time.</EmptyChart>;
  const { width, height, left, right, top, bottom } = CHART;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const xFor = (_, i) => left + (i / Math.max(1, data.length - 1)) * innerW;
  const yFor = (s) => top + innerH - (s / 100) * innerH;
  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p, i)} ${yFor(p.score)}`).join(' ');
  const ma = movingAverage(data);
  const maPath = ma.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p, i)} ${yFor(p.score)}`).join(' ');
  const tickEvery = Math.ceil(data.length / (expanded ? 12 : 6));

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} style={chartSvgStyle(expanded, Math.max(900, data.length * 88), 500)} role="img" aria-label="Progress over time line chart">
        <line x1={left} y1={top} x2={left} y2={top + innerH} stroke={COLORS.border} />
        <line x1={left} y1={top + innerH} x2={left + innerW} y2={top + innerH} stroke={COLORS.border} />
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={left} y1={y} x2={left + innerW} y2={y} stroke={COLORS.border} opacity="0.35" />
              <text x={left - 10} y={y + 4} textAnchor="end" {...axisText()}>{tick}%</text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={COLORS.accent} strokeWidth={expanded ? 4 : 3} />
        {showMovingAverage && <path d={maPath} fill="none" stroke={COLORS.success} strokeWidth={expanded ? 3 : 2} strokeDasharray="5 5" />}
        {data.map((p, i) => (
          <circle key={p.id} cx={xFor(p, i)} cy={yFor(p.score)} r={expanded ? 7 : 5} fill={COLORS.accent}>
            <title>{`${formatDate(p.date)}: ${pct(p.score)} (${p.questionCount} questions)`}</title>
          </circle>
        ))}
        {data.map((p, i) =>
          i % tickEvery === 0 ? (
            <text key={`lbl-${p.id}`} x={xFor(p, i)} y={top + innerH + 20} textAnchor="middle" {...axisText()} fontSize={expanded ? 12 : 11}>
              {expanded ? formatDate(p.date) : formatShortDate(p.date)}
            </text>
          ) : null
        )}
        {showMovingAverage && expanded && (
          <g>
            <line x1={left + innerW - 80} y1={top + 10} x2={left + innerW - 65} y2={top + 10} stroke={COLORS.accent} strokeWidth={3} />
            <text x={left + innerW - 60} y={top + 14} {...axisText()} fontSize={11}>Score</text>
            <line x1={left + innerW - 80} y1={top + 26} x2={left + innerW - 65} y2={top + 26} stroke={COLORS.success} strokeWidth={2} strokeDasharray="5 5" />
            <text x={left + innerW - 60} y={top + 30} {...axisText()} fontSize={11}>3-test avg</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function ScatterPlot({ data, expanded = false }) {
  if (!data.length) return <EmptyChart>No completed tests match these filters.</EmptyChart>;
  const { width, height, left, right, top, bottom } = CHART;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const maxTime = Math.max(...data.map((d) => d.totalTime), 1);
  const domains = uniq(data.map((d) => d.domain));
  const palette = [COLORS.accent, COLORS.diffEasy, COLORS.diffMedium, COLORS.error, COLORS.success];

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} style={chartSvgStyle(expanded, 960, 500)} role="img" aria-label="Time vs score scatter plot">
        <line x1={left} y1={top} x2={left} y2={top + innerH} stroke={COLORS.border} />
        <line x1={left} y1={top + innerH} x2={left + innerW} y2={top + innerH} stroke={COLORS.border} />
        {[0, 25, 50, 75, 100].map((tick) => (
          <text key={tick} x={left - 10} y={top + innerH - (tick / 100) * innerH + 4} textAnchor="end" {...axisText()}>{tick}%</text>
        ))}
        {[0, 0.5, 1].map((tick) => (
          <text key={tick} x={left + tick * innerW} y={top + innerH + 22} textAnchor="middle" {...axisText()}>
            {Math.round((maxTime * tick) / 60)}m
          </text>
        ))}
        {data.map((point) => {
          const x = left + (point.totalTime / maxTime) * innerW;
          const y = top + innerH - (point.score / 100) * innerH;
          const r = clamp((expanded ? 6 : 4) + point.questionCount, expanded ? 8 : 5, expanded ? 22 : 16);
          const color = palette[domains.indexOf(point.domain) % palette.length] || COLORS.accent;
          return (
            <circle key={point.id} cx={x} cy={y} r={r} fill={color} opacity="0.78" stroke={COLORS.bg} strokeWidth="1">
              <title>{`${point.domain} / ${point.section}\n${formatDate(point.date)}\nScore: ${pct(point.score)}\nTime: ${Math.round(point.totalTime / 60)}m\nQuestions: ${point.questionCount}`}</title>
            </circle>
          );
        })}
        {expanded && domains.slice(0, 5).map((d, i) => (
          <g key={d}>
            <circle cx={left + innerW - 100} cy={top + 14 + i * 20} r={6} fill={palette[i % palette.length]} opacity="0.85" />
            <text x={left + innerW - 90} y={top + 18 + i * 20} {...axisText()} fontSize={11}>{d.length > 14 ? `${d.slice(0, 14)}…` : d}</text>
          </g>
        ))}
        <text x={left + innerW / 2} y={height - 4} textAnchor="middle" {...axisText()}>Time spent per test</text>
      </svg>
    </div>
  );
}

function Heatmap({ data, expanded = false }) {
  const { topics, tests } = data;
  if (!topics.length || !tests.length) return <EmptyChart>No topic-by-test data for these filters.</EmptyChart>;
  const cellWidth = expanded ? 116 : 92;

  return (
    <div style={{ ...styles.heatmap, ...(expanded ? styles.heatmapExpanded : {}) }}>
      <div style={{ ...styles.heatmapGrid, gridTemplateColumns: `${expanded ? 220 : 180}px repeat(${topics.length}, ${cellWidth}px)` }}>
        <div style={{ ...styles.heatmapHeader, left: 0 }}>Test</div>
        {topics.map((topic) => (
          <div key={topic} style={styles.heatmapHeader} title={topic}>
            {expanded ? topic : topic.length > 12 ? `${topic.slice(0, 12)}…` : topic}
          </div>
        ))}
        {tests.map((test) => (
          <Fragment key={test.testId}>
            <div style={styles.heatmapTest} title={test.testId}>
              <div>{formatShortDate(test.date)}</div>
              <div style={{ color: COLORS.muted }}>{test.testId.slice(0, 12)}</div>
            </div>
            {topics.map((topic) => {
              const vals = test.cells.get(topic);
              const value = vals ? average(vals) : null;
              return (
                <div key={`${test.testId}-${topic}`}
                  style={{
                    ...styles.heatmapCell,
                    width: cellWidth,
                    minHeight: expanded ? 48 : styles.heatmapCell.minHeight,
                    fontSize: expanded ? SIZE.sm : styles.heatmapCell.fontSize,
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

/* ─── Statistics Page ─────────────────────────────────────────────────────── */

export default function Statistics() {
  const [filters, setFilters] = useState({ domain: '', section: '', topic: '', startDate: '', endDate: '' });
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  const { data: attempts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stats-attempts'],
    queryFn: () => getAttempts({ status: 'completed', limit: 1000, offset: 0 }),
  });

  const { tests, questions } = useMemo(() => flattenAttempts(attempts), [attempts]);

  const domainOptions = useMemo(() => uniq([
    ...questions.map((q) => q.domain),
    ...tests.map((t) => t.domain),
  ]), [questions, tests]);
  const sectionOptions = useMemo(
    () => uniq([
      ...questions.filter((q) => !filters.domain || q.domain === filters.domain).map((q) => q.section),
      ...tests.filter((t) => !filters.domain || t.domain === filters.domain).map((t) => t.section),
    ]),
    [questions, tests, filters.domain]
  );
  const topicOptions = useMemo(
    () => uniq(questions.filter((q) =>
      (!filters.domain || q.domain === filters.domain) &&
      (!filters.section || q.section === filters.section)
    ).map((q) => q.topic)),
    [questions, filters.domain, filters.section]
  );

  const filteredQuestions = useMemo(
    () => questions.filter((q) =>
      (!filters.domain || q.domain === filters.domain) &&
      (!filters.section || q.section === filters.section) &&
      (!filters.topic || q.topic === filters.topic) &&
      filterByDate(q, filters)
    ),
    [questions, filters]
  );

  const filteredTests = useMemo(() => {
    if (filters.topic) return testsFromQuestions(filteredQuestions, tests);
    return tests.filter((test) => filterTest(test, filters));
  }, [filteredQuestions, filters, tests]);

  const groupLevel = getGroupLevel(filters);
  const barData = useMemo(() => topicPerformance(filteredQuestions, groupLevel), [filteredQuestions, groupLevel]);
  const lineData = useMemo(() => progressSeries(filteredTests), [filteredTests]);
  const heatData = useMemo(() => heatmapData(filteredQuestions), [filteredQuestions]);
  const expandedHeatData = useMemo(() => heatmapData(filteredQuestions, true), [filteredQuestions]);

  const avgScore = average(filteredTests.map((t) => t.score));
  const avgTime = average(filteredTests.map((t) => t.totalTime));
  const weakest = barData[0]?.label || 'Not enough data';
  const insightPipeline = useMemo(
    () => buildLearningInsightPipeline({ questions: filteredQuestions, tests: filteredTests }),
    [filteredQuestions, filteredTests]
  );

  /**
   * Chart config — add more entries here to get a new chart with
   * fullscreen expansion for free. ChartGrid handles all layout + modal logic.
   */

  // Shared data bundle for the learning intelligence charts
  const intelligenceData = useMemo(() => ({
    questions: filteredQuestions,
    tests: filteredTests,
  }), [filteredQuestions, filteredTests]);

  const charts = useMemo(() => [
    // ── Core analytics ──────────────────────────────────────────────────────
    {
      id: 'topic-performance',
      title: 'Topic Performance',
      purpose: 'Compare strengths and weaknesses across the current hierarchy level.',
      component: BarChart,
      props: { data: barData, groupLevel },
    },
    {
      id: 'progress-over-time',
      title: 'Progress Over Time',
      purpose: 'See improvement trends and score consistency across tests.',
      component: LineChart,
      props: { data: lineData, showMovingAverage },
    },
    {
      id: 'time-vs-score',
      title: 'Time vs Score',
      purpose: 'Find whether longer attempts are improving accuracy or just costing time.',
      component: ScatterPlot,
      props: { data: filteredTests },
    },
    {
      id: 'topic-vs-test',
      title: 'Topic vs Test',
      purpose: 'Identify topics that stay weak across multiple tests.',
      component: Heatmap,
      props: { data: heatData },
      fullscreenProps: { data: expandedHeatData },
      wide: true,
    },
    // ── Learning intelligence ────────────────────────────────────────────────
    {
      id: 'weakest-topics-trend',
      title: 'Weakest Topics Trend',
      purpose: 'Track how your lowest-scoring topics improve or decline over time with rolling averages.',
      component: WeakestTopicsTrend,
      props: { data: intelligenceData },
      wide: true,
    },
    {
      id: 'recommended-focus',
      title: 'Recommended Focus Areas',
      purpose: 'Prioritised study suggestions scored by accuracy, decay, confidence, streak gaps, mistakes, and velocity.',
      component: RecommendedFocusAreas,
      props: { data: intelligenceData },
    },
    {
      id: 'study-streak',
      title: 'Study Streak Heatmap',
      purpose: 'GitHub-style activity calendar showing daily study intensity, streaks, and consistency.',
      component: StudyStreakHeatmap,
      props: { data: intelligenceData },
      wide: true,
    },
    {
      id: 'mistake-breakdown',
      title: 'Mistake Category Breakdown',
      purpose: 'Understand why you fail — conceptual gaps, careless errors, rushed answers, and more.',
      component: MistakeCategoryBreakdown,
      props: { data: intelligenceData },
    },
    {
      id: 'knowledge-decay',
      title: 'Knowledge Decay Analytics',
      purpose: 'Ebbinghaus-based retention curves showing which topics need urgent review before they fade.',
      component: KnowledgeDecayAnalytics,
      props: { data: intelligenceData },
      wide: true,
    },
  ], [barData, expandedHeatData, filteredTests, groupLevel, heatData, intelligenceData, lineData, showMovingAverage]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'domain') { next.section = ''; next.topic = ''; }
      if (key === 'section') { next.topic = ''; }
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
            {domainOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Section</label>
          <select value={filters.section} onChange={(e) => updateFilter('section', e.target.value)} style={styles.input}>
            <option value="">All sections</option>
            {sectionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{filters.section ? 'Topic' : filters.domain ? 'Topic / Section' : 'Topic / Domain'}</label>
          <select value={filters.topic} onChange={(e) => updateFilter('topic', e.target.value)} style={styles.input}>
            <option value="">All topics</option>
            {topicOptions.map((o) => <option key={o} value={o}>{o}</option>)}
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
            <div style={styles.summary}><div style={styles.summaryLabel}>Completed tests</div><div style={styles.summaryValue}>{filteredTests.length}</div></div>
            <div style={styles.summary}><div style={styles.summaryLabel}>Questions analyzed</div><div style={styles.summaryValue}>{filteredQuestions.length}</div></div>
            <div style={styles.summary}><div style={styles.summaryLabel}>Average score</div><div style={styles.summaryValue}>{filteredTests.length ? pct(avgScore) : '-'}</div></div>
            <div style={styles.summary}><div style={styles.summaryLabel}>Needs attention</div><div style={styles.summaryValue}>{weakest}</div></div>
            <div style={styles.summary}><div style={styles.summaryLabel}>Avg time/test</div><div style={styles.summaryValue}>{filteredTests.length ? `${Math.round(avgTime / 60)}m` : '-'}</div></div>
          </div>

          {/* ↓ All chart rendering is now handled by ChartGrid ↓ */}
          <div style={styles.summaryRow}>
            {insightPipeline.summaryCards.map((card) => (
              <div key={card.key} style={styles.summary}>
                <div style={styles.summaryLabel}>{card.title}</div>
                <div style={styles.summaryValue}>{card.value || '-'}</div>
                <div style={styles.insightMuted}>{card.label || 'Not enough data'}</div>
              </div>
            ))}
          </div>

          <section style={styles.insightPanel}>
            <div>
              <h2 style={styles.insightTitle}>AI Learning Insights</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
              {insightPipeline.insights.length ? (
                <ul style={{ ...styles.insightList, ...styles.insightText }}>
                  {insightPipeline.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              ) : (
                <div style={styles.insightMuted}>Complete more tests to generate personalized learning insights.</div>
              )}
              <div style={styles.trendGrid}>
                {insightPipeline.trends.length ? insightPipeline.trends.map((trend) => (
                  <div key={trend.type} style={{
                    ...styles.trendCard,
                    borderColor: trend.tone === 'risk' ? COLORS.error : trend.tone === 'positive' ? COLORS.success : COLORS.border,
                  }}>
                    <div style={{
                      ...styles.trendTitle,
                      color: trend.tone === 'risk' ? COLORS.error : trend.tone === 'positive' ? COLORS.success : COLORS.text,
                    }}>
                      {trend.title}
                    </div>
                    <div style={styles.insightMuted}>{trend.text}</div>
                  </div>
                )) : (
                  <div style={styles.trendCard}>
                    <div style={styles.trendTitle}>Trend detection</div>
                    <div style={styles.insightMuted}>No sustained improvement, plateau, regression, or burnout pattern detected yet.</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <ChartGrid charts={charts} />
        </>
      )}
    </div>
  );
}
