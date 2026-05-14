/**
 * LearningIntelligenceCharts.jsx
 *
 * Five advanced analytics charts:
 *  1. WeakestTopicsTrend      — rolling avg trend lines per topic over time
 *  2. RecommendedFocusAreas   — ranked study recommendations with scoring
 *  3. StudyStreakHeatmap       — GitHub-style activity heatmap
 *  4. MistakeCategoryBreakdown— why users fail (conceptual, careless, etc.)
 *  5. KnowledgeDecayAnalytics — retention decay curves over inactivity periods
 *
 * Each component accepts { data, expanded, fullscreen } matching the ChartRenderer
 * contract so they slot cleanly into ChartGrid.
 */

import { useMemo, useState } from 'react';
import { COLORS, FONTS, SPACE, SIZE } from '../../constants';
import { scoreTopicRecommendations } from '../../utils/learningInsightPipeline';

/* ─── Shared helpers ─────────────────────────────────────────────────────── */

function axisText(extra = {}) {
  return { fill: COLORS.muted, fontFamily: FONTS.mono, fontSize: 11, ...extra };
}
function pct(v) { return `${Math.round(v ?? 0)}%`; }
function average(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dateOf(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function isoDate(d) { return d.toISOString().slice(0, 10); }
function movingAvg(points, w = 3) {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - w + 1), i + 1);
    return { ...p, score: average(slice.map((x) => x.score)) };
  });
}
function EmptyChart({ children }) {
  return (
    <div style={{
      minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: COLORS.muted, fontFamily: FONTS.mono, fontSize: SIZE.sm, textAlign: 'center',
      padding: SPACE.lg,
    }}>
      {children}
    </div>
  );
}

const PALETTE = [
  COLORS.accent,        // lime
  '#60a5fa',            // blue
  '#f472b6',            // pink
  '#fb923c',            // orange
  '#a78bfa',            // violet
  '#34d399',            // emerald
  '#f59e0b',            // amber
  '#38bdf8',            // sky
];

/* ─── 1. Weakest Topics Trend ────────────────────────────────────────────── */

/**
 * Expected input: questions[] from flattenAttempts, tests[] from flattenAttempts
 * { topic, score, date, domain, section, ... }
 */
export function WeakestTopicsTrend({ data = {}, expanded = false }) {
  const { questions = [], tests = [] } = data;
  const [topN, setTopN] = useState(5);
  const [window_, setWindow] = useState(3);

  // ── Build per-topic time series ──────────────────────────────────────────
  const series = useMemo(() => {
    // group scores by (topic, date-week)
    const byTopic = new Map();
    questions.forEach((q) => {
      const d = dateOf(q.date);
      if (!d) return;
      const week = isoDate(new Date(d.getFullYear(), 0, 1 + Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000) * 7));
      const key = q.topic;
      const t = byTopic.get(key) || { topic: key, byWeek: new Map() };
      const wk = t.byWeek.get(week) || [];
      wk.push(q.score);
      t.byWeek.set(week, wk);
      byTopic.set(key, t);
    });

    return Array.from(byTopic.values())
      .map((t) => {
        const points = Array.from(t.byWeek.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([week, scores]) => ({ week, score: average(scores) }));
        const recent = average(points.slice(-3).map((p) => p.score));
        return { topic: t.topic, points, recent };
      })
      .sort((a, b) => a.recent - b.recent)   // weakest first
      .slice(0, topN);
  }, [questions, topN]);

  const allWeeks = useMemo(() => {
    const weeks = new Set();
    series.forEach((s) => s.points.forEach((p) => weeks.add(p.week)));
    return Array.from(weeks).sort();
  }, [series]);

  if (!series.length || allWeeks.length < 2)
    return <EmptyChart>Not enough data to show topic trends. Complete more tests across multiple weeks.</EmptyChart>;

  const W = expanded ? 900 : 720;
  const H = expanded ? 480 : 280;
  const L = 56, R = 16, T = 20, B = expanded ? 64 : 48;
  const iW = W - L - R, iH = H - T - B;
  const xFor = (week) => L + (allWeeks.indexOf(week) / Math.max(1, allWeeks.length - 1)) * iW;
  const yFor = (s) => T + iH - clamp(s, 0, 100) / 100 * iH;

  return (
    <>
      {expanded && (
        <div style={{ display: 'flex', gap: SPACE.sm, marginBottom: SPACE.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, textTransform: 'uppercase' }}>Show weakest</span>
          {[3, 5, 8, 10].map((n) => (
            <button key={n} type="button" onClick={() => setTopN(n)} style={{
              background: COLORS.bg, border: `1px solid ${topN === n ? COLORS.accent : COLORS.border}`,
              color: topN === n ? COLORS.accent : COLORS.text, borderRadius: 6,
              fontFamily: FONTS.mono, fontSize: SIZE.xs, padding: `${SPACE.xs}px ${SPACE.sm}px`, cursor: 'pointer',
            }}>{n} topics</button>
          ))}
          <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, textTransform: 'uppercase', marginLeft: SPACE.md }}>Rolling avg</span>
          {[2, 3, 5].map((w) => (
            <button key={w} type="button" onClick={() => setWindow(w)} style={{
              background: COLORS.bg, border: `1px solid ${window_ === w ? COLORS.accent : COLORS.border}`,
              color: window_ === w ? COLORS.accent : COLORS.text, borderRadius: 6,
              fontFamily: FONTS.mono, fontSize: SIZE.xs, padding: `${SPACE.xs}px ${SPACE.sm}px`, cursor: 'pointer',
            }}>{w}-week</button>
          ))}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: expanded ? 760 : 520, height: H, display: 'block' }}>
          {/* axes */}
          <line x1={L} y1={T} x2={L} y2={T + iH} stroke={COLORS.border} />
          <line x1={L} y1={T + iH} x2={L + iW} y2={T + iH} stroke={COLORS.border} />
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={L} y1={y} x2={L + iW} y2={y} stroke={COLORS.border} opacity="0.3" />
                <text x={L - 8} y={y + 4} textAnchor="end" {...axisText()}>{tick}%</text>
              </g>
            );
          })}

          {/* x-axis labels */}
          {allWeeks.map((wk, i) => {
            if (i % Math.max(1, Math.ceil(allWeeks.length / (expanded ? 14 : 7))) !== 0) return null;
            const x = xFor(wk);
            const label = wk.slice(5); // MM-DD
            return (
              <text key={wk} x={x} y={T + iH + 18} textAnchor="middle" {...axisText()}>{label}</text>
            );
          })}

          {/* series lines */}
          {series.map((s, si) => {
            const color = PALETTE[si % PALETTE.length];
            const raw = s.points;
            const smoothed = movingAvg(raw, window_);
            const rawPath = raw.filter((p) => allWeeks.includes(p.week))
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.week)} ${yFor(p.score)}`).join(' ');
            const maPath = smoothed.filter((p) => allWeeks.includes(p.week))
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.week)} ${yFor(p.score)}`).join(' ');
            return (
              <g key={s.topic}>
                <path d={rawPath} fill="none" stroke={color} strokeWidth={1.5} opacity="0.35" />
                <path d={maPath} fill="none" stroke={color} strokeWidth={expanded ? 3 : 2} />
                {/* last-point label */}
                {(() => {
                  const last = s.points[s.points.length - 1];
                  if (!last) return null;
                  return (
                    <text x={xFor(last.week) + 4} y={yFor(last.score) + 4}
                      fill={color} fontFamily={FONTS.mono} fontSize={expanded ? 11 : 10}>
                      {s.topic.length > (expanded ? 24 : 12) ? `${s.topic.slice(0, expanded ? 24 : 12)}…` : s.topic}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* legend when expanded */}
          {expanded && series.map((s, si) => (
            <g key={`leg-${s.topic}`}>
              <line x1={L + 10} y1={T + 14 + si * 20} x2={L + 30} y2={T + 14 + si * 20}
                stroke={PALETTE[si % PALETTE.length]} strokeWidth={3} />
              <text x={L + 34} y={T + 18 + si * 20} {...axisText()} fill={COLORS.text}>
                {pct(s.recent)} — {s.topic.length > 28 ? `${s.topic.slice(0, 28)}…` : s.topic}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}

/* ─── 2. Recommended Focus Areas ─────────────────────────────────────────── */

const FOCUS_FACTORS = [
  { key: 'accuracy',             label: 'Accuracy',             weight: 0.25, icon: 'ACC' },
  { key: 'decay',                label: 'Decay',                weight: 0.18, icon: 'DEC' },
  { key: 'confidence',           label: 'Confidence',           weight: 0.12, icon: 'CONF' },
  { key: 'streakGap',            label: 'Streak gaps',          weight: 0.15, icon: 'GAP' },
  { key: 'mistakeFrequency',     label: 'Mistake frequency',    weight: 0.18, icon: 'ERR' },
  { key: 'improvementVelocity',  label: 'Improvement velocity', weight: 0.12, icon: 'VEL' },
];

function computeFocusScore(topic, questions) {
  return scoreTopicRecommendations(questions).find((recommendation) => recommendation.topic === topic) || null;
}

export function RecommendedFocusAreas({ data = {}, expanded = false }) {
  const { questions = [] } = data;
  const [showFactors, setShowFactors] = useState(null);

  const recommendations = useMemo(() => {
    const topics = Array.from(new Set(questions.map((q) => q.topic).filter(Boolean)));
    return topics
      .map((t) => computeFocusScore(t, questions))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, expanded ? 12 : 6);
  }, [questions, expanded]);

  if (!recommendations.length)
    return <EmptyChart>No topic data found. Complete some tests to see personalized recommendations.</EmptyChart>;

  const maxScore = Math.max(...recommendations.map((r) => r.score), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
      {/* header */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px 60px', gap: SPACE.sm,
        fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, textTransform: 'uppercase',
        paddingBottom: SPACE.xs, borderBottom: `1px solid ${COLORS.border}` }}>
        <span>#</span><span>Topic</span><span>Priority</span><span>Avg</span><span>Last active</span>
      </div>

      {recommendations.map((r, i) => {
        const urgencyColor = r.score > 70 ? COLORS.error : r.score > 45 ? COLORS.diffMedium : COLORS.diffEasy;
        const isOpen = showFactors === r.topic;
        return (
          <div key={r.topic} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            <div
              style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px 60px',
                gap: SPACE.sm, alignItems: 'center', padding: `${SPACE.xs}px 0`, cursor: 'pointer' }}
              onClick={() => setShowFactors(isOpen ? null : r.topic)}
            >
              {/* rank */}
              <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>
                {i + 1}.
              </span>
              {/* topic */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.topic}
                </div>
                {/* bar */}
                <div style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${(r.score / maxScore) * 100}%`,
                    backgroundColor: urgencyColor, borderRadius: 2, transition: 'width 400ms ease' }} />
                </div>
              </div>
              {/* priority score */}
              <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: urgencyColor, fontWeight: 600 }}>
                {Math.round(r.score)}/100
              </span>
              {/* avg */}
              <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>
                {pct(r.avgScore)}
              </span>
              {/* last active */}
              <span style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>
                {r.daysSince > 999 ? 'never' : r.daysSince < 1 ? 'today' : `${Math.round(r.daysSince)}d`}
              </span>
            </div>

            {/* expanded factor breakdown */}
            {isOpen && (
              <div style={{ padding: `${SPACE.sm}px ${SPACE.md}px`, backgroundColor: COLORS.bg,
                borderRadius: 6, marginBottom: SPACE.sm, display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                {FOCUS_FACTORS.map((f) => {
                  const val = r.factors[f.key] * 100;
                  const fc = val > 65 ? COLORS.error : val > 35 ? COLORS.diffMedium : COLORS.diffEasy;
                  return (
                    <div key={f.key} style={{ minWidth: 110, flex: '1 0 110px' }}>
                      <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>{f.icon} {f.label}</div>
                      <div style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 3 }}>
                        <div style={{ height: '100%', width: `${val}%`, backgroundColor: fc, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: fc, marginTop: 2 }}>
                        {Math.round(val)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 3. Study Streak Heatmap ────────────────────────────────────────────── */

export function StudyStreakHeatmap({ data = {}, expanded = false }) {
  const { tests = [] } = data;

  const { grid, stats } = useMemo(() => {
    // Build a set of all active dates
    const activityMap = new Map(); // isoDate -> { count, totalScore }
    tests.forEach((t) => {
      const d = dateOf(t.date);
      if (!d) return;
      const key = isoDate(d);
      const entry = activityMap.get(key) || { count: 0, totalScore: 0 };
      entry.count++;
      entry.totalScore += t.score;
      activityMap.set(key, entry);
    });

    // Build weeks grid spanning last 52 weeks
    const today = new Date();
    const weeks = expanded ? 52 : 26;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7) + 1);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const cols = [];
    let cursor = new Date(startDate);
    while (cursor <= today) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const key = isoDate(cursor);
        const act = activityMap.get(key);
        col.push({ date: key, ...act });
        cursor = new Date(cursor.getTime() + 86400000);
      }
      cols.push(col);
    }

    // Stats
    const activeDates = Array.from(activityMap.keys()).sort();
    let longest = 0, current = 0, prev = null;
    activeDates.forEach((d) => {
      if (prev) {
        const diff = (new Date(d) - new Date(prev)) / 86400000;
        current = diff === 1 ? current + 1 : 1;
      } else { current = 1; }
      longest = Math.max(longest, current);
      prev = d;
    });
    // current streak (up to today)
    let currentStreak = 0;
    let check = new Date(today);
    while (true) {
      const key = isoDate(check);
      if (!activityMap.has(key)) {
        if (currentStreak === 0 && isoDate(today) === key) { check.setDate(check.getDate() - 1); continue; }
        break;
      }
      currentStreak++;
      check.setDate(check.getDate() - 1);
    }

    return { grid: cols, stats: { longest, currentStreak, totalDays: activityMap.size, totalTests: tests.length } };
  }, [tests, expanded]);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cellSize = expanded ? 18 : 14;
  const gap = 3;

  function cellColor(cell) {
    if (!cell?.count) return COLORS.surface;
    const intensity = clamp(cell.count / 4, 0, 1); // 4+ = max intensity
    const avg = cell.count ? cell.totalScore / cell.count : 0;
    // blend between accent dim and accent bright based on activity
    if (avg >= 80) return `color-mix(in srgb, ${COLORS.accent} ${20 + intensity * 70}%, transparent)`;
    if (avg >= 60) return `color-mix(in srgb, ${COLORS.diffMedium} ${20 + intensity * 70}%, transparent)`;
    return `color-mix(in srgb, ${COLORS.error} ${20 + intensity * 70}%, transparent)`;
  }

  if (!tests.length)
    return <EmptyChart>No study activity recorded yet. Complete tests to see your streak heatmap.</EmptyChart>;

  return (
    <div>
      {/* stats bar */}
      <div style={{ display: 'flex', gap: SPACE.lg, marginBottom: SPACE.md, flexWrap: 'wrap' }}>
        {[
          { label: 'Current streak', value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`, color: COLORS.accent },
          { label: 'Longest streak', value: `${stats.longest} days`, color: COLORS.diffEasy },
          { label: 'Active days', value: stats.totalDays, color: COLORS.text },
          { label: 'Total tests', value: stats.totalTests, color: COLORS.text },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: `${SPACE.sm}px ${SPACE.md}px` }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>{s.label}</div>
            <div style={{ fontFamily: FONTS.serif, fontSize: SIZE.lg, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* heatmap grid */}
      <div style={{ overflowX: 'auto', paddingBottom: SPACE.sm }}>
        <div style={{ display: 'inline-flex', gap: 0, flexDirection: 'column' }}>
          {/* day-of-week labels */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
            <div style={{ width: 28 }} />
            {grid.map((_, ci) => {
              // show month label at start of month
              const firstDay = grid[ci][0];
              if (!firstDay?.date) return <div key={ci} style={{ width: cellSize + gap }} />;
              const d = new Date(firstDay.date + 'T00:00:00');
              const showMonth = d.getDate() <= 7;
              return (
                <div key={ci} style={{ width: cellSize + gap, fontFamily: FONTS.mono,
                  fontSize: 9, color: COLORS.muted, textAlign: 'center', flexShrink: 0 }}>
                  {showMonth ? d.toLocaleString('en', { month: 'short' }) : ''}
                </div>
              );
            })}
          </div>
          {/* 7 day rows */}
          {[0,1,2,3,4,5,6].map((dayIdx) => (
            <div key={dayIdx} style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: gap }}>
              <div style={{ width: 28, fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, textAlign: 'right',
                paddingRight: 4, flexShrink: 0 }}>
                {dayIdx % 2 === 1 ? DAYS[dayIdx] : ''}
              </div>
              {grid.map((col, ci) => {
                const cell = col[dayIdx];
                const bg = cellColor(cell);
                return (
                  <div key={ci} style={{ width: cellSize, height: cellSize, marginRight: gap,
                    borderRadius: 3, backgroundColor: bg, flexShrink: 0, cursor: cell?.count ? 'default' : 'default' }}
                    title={cell?.date
                      ? cell.count
                        ? `${cell.date}: ${cell.count} test${cell.count !== 1 ? 's' : ''}, avg ${pct(cell.totalScore / cell.count)}`
                        : cell.date
                      : ''
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.sm,
        fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2,
            backgroundColor: i === 0 ? COLORS.surface : `color-mix(in srgb, ${COLORS.accent} ${15 + i * 70}%, transparent)` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ─── 4. Mistake Category Breakdown ─────────────────────────────────────── */

const MISTAKE_CATEGORIES = [
  { key: 'conceptual',   label: 'Conceptual',    icon: '🧠', color: '#f472b6', desc: 'Missing core knowledge' },
  { key: 'careless',     label: 'Careless',       icon: '⚡', color: '#fb923c', desc: 'Fast answers, low accuracy' },
  { key: 'guessing',     label: 'Guessing',       icon: '🎲', color: '#a78bfa', desc: 'Very low confidence answers' },
  { key: 'terminology',  label: 'Terminology',    icon: '📖', color: '#38bdf8', desc: 'Topic-specific vocabulary' },
  { key: 'memoryFail',   label: 'Memory Failure', icon: '💭', color: '#fbbf24', desc: 'Inactive topic decay' },
  { key: 'rushed',       label: 'Rushed',         icon: '⏩', color: COLORS.error, desc: 'Unusually low time spent' },
];

function classifyMistake(q, avgTimeForTopic) {
  if (q.score >= 60) return null; // not a mistake
  const cats = [];

  // Guessing: very wrong (< 20%)
  if (q.score < 20) cats.push('guessing');

  // Rushed: time well below avg for topic
  if (avgTimeForTopic > 0 && q.timeSpent < avgTimeForTopic * 0.4 && q.timeSpent > 0)
    cats.push('rushed');
  else if (q.timeSpent > 0 && q.timeSpent < 10)
    cats.push('careless');

  // Memory: if topic hasn't been practiced in a while
  // (use low score on topics that had higher scores earlier — handled in trend)
  // Fallback: classify by score band
  if (!cats.length) {
    if (q.score < 40) cats.push('conceptual');
    else cats.push('careless');
  }

  return cats[0];
}

export function MistakeCategoryBreakdown({ data = {}, expanded = false }) {
  const { questions = [] } = data;
  const [view, setView] = useState('chart'); // 'chart' | 'topics'

  const { categories, byTopic, total, recentTrend } = useMemo(() => {
    // compute avg time per topic
    const topicTimeMap = new Map();
    questions.forEach((q) => {
      const t = topicTimeMap.get(q.topic) || [];
      if (q.timeSpent > 0) t.push(q.timeSpent);
      topicTimeMap.set(q.topic, t);
    });
    const avgTimeFor = (topic) => {
      const ts = topicTimeMap.get(topic) || [];
      return ts.length ? average(ts) : 0;
    };

    const counts = Object.fromEntries(MISTAKE_CATEGORIES.map((c) => [c.key, 0]));
    const topicCats = new Map();

    questions.forEach((q) => {
      const cat = classifyMistake(q, avgTimeFor(q.topic));
      if (!cat) return;
      counts[cat]++;
      const tc = topicCats.get(q.topic) || {};
      tc[cat] = (tc[cat] || 0) + 1;
      topicCats.set(q.topic, tc);
    });

    const totalMistakes = Object.values(counts).reduce((s, v) => s + v, 0) || 1;

    const categories = MISTAKE_CATEGORIES.map((c) => ({
      ...c, count: counts[c.key], pct: (counts[c.key] / totalMistakes) * 100,
    })).sort((a, b) => b.count - a.count);

    // top topics per leading category
    const topCat = categories[0]?.key;
    const byTopic = topCat
      ? Array.from(topicCats.entries())
          .map(([topic, cats]) => ({ topic, count: cats[topCat] || 0, cats }))
          .filter((t) => t.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      : [];

    // split recent vs old to show trend
    const midIdx = Math.floor(questions.length / 2);
    const oldQs = questions.slice(0, midIdx);
    const newQs = questions.slice(midIdx);
    const oldCount = Object.fromEntries(MISTAKE_CATEGORIES.map((c) => [c.key, 0]));
    const newCount = Object.fromEntries(MISTAKE_CATEGORIES.map((c) => [c.key, 0]));
    oldQs.forEach((q) => { const c = classifyMistake(q, avgTimeFor(q.topic)); if (c) oldCount[c]++; });
    newQs.forEach((q) => { const c = classifyMistake(q, avgTimeFor(q.topic)); if (c) newCount[c]++; });
    const oldTotal = Object.values(oldCount).reduce((s, v) => s + v, 0) || 1;
    const newTotal = Object.values(newCount).reduce((s, v) => s + v, 0) || 1;
    const recentTrend = Object.fromEntries(
      MISTAKE_CATEGORIES.map((c) => [c.key, {
        old: (oldCount[c.key] / oldTotal) * 100,
        new: (newCount[c.key] / newTotal) * 100,
      }])
    );

    return { categories, byTopic, total: totalMistakes, recentTrend };
  }, [questions]);

  const mistakes = questions.filter((q) => q.score < 60).length;
  if (!mistakes)
    return <EmptyChart>No mistakes recorded yet. Keep practicing — patterns will appear here.</EmptyChart>;

  // Pie / donut chart
  const CX = 100, CY = 100, R = 80, IR = 50;
  let angle = -Math.PI / 2;
  const slices = categories.map((c) => {
    const start = angle;
    const sweep = (c.pct / 100) * Math.PI * 2;
    angle += sweep;
    const lx = CX + (R + 18) * Math.cos(start + sweep / 2);
    const ly = CY + (R + 18) * Math.sin(start + sweep / 2);
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(start + sweep), y2 = CY + R * Math.sin(start + sweep);
    const ix1 = CX + IR * Math.cos(start), iy1 = CY + IR * Math.sin(start);
    const ix2 = CX + IR * Math.cos(start + sweep), iy2 = CY + IR * Math.sin(start + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...c, start, sweep, lx, ly, x1, y1, x2, y2, ix1, iy1, ix2, iy2, large };
  });

  return (
    <div>
      {expanded && (
        <div style={{ display: 'flex', gap: SPACE.sm, marginBottom: SPACE.md }}>
          {['chart', 'topics'].map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} style={{
              background: COLORS.bg, border: `1px solid ${view === v ? COLORS.accent : COLORS.border}`,
              color: view === v ? COLORS.accent : COLORS.text, borderRadius: 6,
              fontFamily: FONTS.mono, fontSize: SIZE.xs, padding: `${SPACE.xs}px ${SPACE.sm}px`, cursor: 'pointer',
            }}>{v === 'chart' ? 'Breakdown chart' : 'Topic correlations'}</button>
          ))}
        </div>
      )}

      {view === 'chart' ? (
        <div style={{ display: 'flex', gap: SPACE.lg, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Donut */}
          <svg viewBox="0 0 200 200" style={{ width: 200, height: 200, flexShrink: 0 }}>
            {slices.map((s) => s.count > 0 && (
              <path key={s.key}
                d={`M ${s.ix1} ${s.iy1} L ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.large} 1 ${s.x2} ${s.y2} L ${s.ix2} ${s.iy2} A ${IR} ${IR} 0 ${s.large} 0 ${s.ix1} ${s.iy1} Z`}
                fill={s.color} opacity="0.85"
              >
                <title>{`${s.label}: ${Math.round(s.pct)}%`}</title>
              </path>
            ))}
            <text x={CX} y={CY - 8} textAnchor="middle" fontFamily={FONTS.serif} fontSize={22} fill={COLORS.text}>{mistakes}</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontFamily={FONTS.mono} fontSize={9} fill={COLORS.muted}>mistakes</text>
          </svg>

          {/* Legend + bars */}
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
            {categories.map((c) => {
              const trend = recentTrend[c.key];
              const delta = trend.new - trend.old;
              const trendStr = Math.abs(delta) < 2 ? '→' : delta > 0 ? `↑${Math.round(delta)}%` : `↓${Math.round(-delta)}%`;
              const trendColor = delta > 3 ? COLORS.error : delta < -3 ? COLORS.diffEasy : COLORS.muted;
              return (
                <div key={c.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: FONTS.mono, fontSize: SIZE.xs, marginBottom: 3 }}>
                    <span style={{ color: COLORS.text }}>{c.icon} {c.label}</span>
                    <span>
                      <span style={{ color: c.color, fontWeight: 600 }}>{Math.round(c.pct)}%</span>
                      <span style={{ color: trendColor, marginLeft: SPACE.xs }}>{trendStr}</span>
                    </span>
                  </div>
                  <div style={{ height: 5, backgroundColor: COLORS.border, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${c.pct}%`, backgroundColor: c.color, borderRadius: 2,
                      transition: 'width 500ms ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* topic correlations table */
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted,
            marginBottom: SPACE.sm }}>
            Topics most affected by <strong style={{ color: categories[0]?.color }}>{categories[0]?.label}</strong> mistakes:
          </div>
          {byTopic.map((t) => (
            <div key={t.topic} style={{ display: 'flex', alignItems: 'center', gap: SPACE.md,
              padding: `${SPACE.xs}px 0`, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ flex: 1, fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.topic}</div>
              <div style={{ display: 'flex', gap: SPACE.xs }}>
                {MISTAKE_CATEGORIES.map((c) => t.cats[c.key] ? (
                  <div key={c.key} style={{ width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: c.color, opacity: 0.8 }} title={`${t.cats[c.key]} ${c.label}`} />
                ) : null)}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted,
                minWidth: 40, textAlign: 'right' }}>{t.count} err</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 5. Knowledge Decay Analytics ──────────────────────────────────────── */

const DECAY_HALF_LIFE_DAYS = 21; // Ebbinghaus forgetting curve approximation
function retentionAfterDays(days) {
  return Math.exp(-Math.log(2) * days / DECAY_HALF_LIFE_DAYS) * 100;
}

export function KnowledgeDecayAnalytics({ data = {}, expanded = false }) {
  const { questions = [] } = data;
  const [highlightTopic, setHighlightTopic] = useState(null);

  const topicDecay = useMemo(() => {
    const byTopic = new Map();
    questions.forEach((q) => {
      const d = dateOf(q.date);
      if (!d) return;
      const t = byTopic.get(q.topic) || { topic: q.topic, dates: [], scores: [] };
      t.dates.push(d);
      t.scores.push(q.score);
      byTopic.set(q.topic, t);
    });

    const now = Date.now();
    return Array.from(byTopic.values())
      .map((t) => {
        const pairs = t.dates.map((d, i) => ({ d, s: t.scores[i] })).sort((a, b) => a.d - b.d);
        const lastActive = pairs[pairs.length - 1]?.d;
        const daysSince = lastActive ? (now - lastActive.getTime()) / 86400000 : 999;
        const lastScore = pairs[pairs.length - 1]?.s ?? 0;
        const estimatedRetention = retentionAfterDays(daysSince) * (lastScore / 100);
        const reviewUrgency = clamp((100 - estimatedRetention) / 100, 0, 1);
        return {
          topic: t.topic,
          lastScore,
          daysSince,
          estimatedRetention,
          reviewUrgency,
          history: pairs.map((p) => ({ date: p.d, score: p.s })),
        };
      })
      .sort((a, b) => a.estimatedRetention - b.estimatedRetention) // most decayed first
      .slice(0, expanded ? 12 : 8);
  }, [questions]);

  if (!topicDecay.length)
    return <EmptyChart>No data to analyze decay. Study topics across multiple sessions to see retention estimates.</EmptyChart>;

  // Decay curve visualization
  const W = expanded ? 860 : 680, H = expanded ? 320 : 220;
  const L = 52, R = 16, T = 16, B = 48;
  const iW = W - L - R, iH = H - T - B;
  const maxDays = 90;
  const decayCurvePoints = Array.from({ length: 91 }, (_, i) => ({
    d: i, r: retentionAfterDays(i),
  }));
  const xFor = (d) => L + (d / maxDays) * iW;
  const yFor = (r) => T + iH - (r / 100) * iH;
  const curvePath = decayCurvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.d)} ${yFor(p.r)}`).join(' ');

  return (
    <div>
      {/* decay curve */}
      <div style={{ overflowX: 'auto', marginBottom: SPACE.md }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 480, height: H, display: 'block' }}>
          {/* axes */}
          <line x1={L} y1={T} x2={L} y2={T + iH} stroke={COLORS.border} />
          <line x1={L} y1={T + iH} x2={L + iW} y2={T + iH} stroke={COLORS.border} />
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={L} y1={y} x2={L + iW} y2={y} stroke={COLORS.border} opacity="0.25" />
                <text x={L - 8} y={y + 4} textAnchor="end" {...axisText()}>{tick}%</text>
              </g>
            );
          })}
          {[0, 7, 14, 21, 30, 60, 90].map((d) => (
            <text key={d} x={xFor(d)} y={T + iH + 18} textAnchor="middle" {...axisText()}>{d}d</text>
          ))}

          {/* decay curve */}
          <path d={curvePath} fill="none" stroke={COLORS.muted} strokeWidth={1.5} strokeDasharray="4 3" />

          {/* danger zones */}
          <rect x={xFor(21)} y={T} width={xFor(45) - xFor(21)} height={iH} fill={COLORS.diffMedium} opacity="0.06" />
          <rect x={xFor(45)} y={T} width={xFor(90) - xFor(45)} height={iH} fill={COLORS.error} opacity="0.06" />
          <text x={xFor(30)} y={T + 12} textAnchor="middle" fontFamily={FONTS.mono} fontSize={9} fill={COLORS.diffMedium}>Review needed</text>
          <text x={xFor(65)} y={T + 12} textAnchor="middle" fontFamily={FONTS.mono} fontSize={9} fill={COLORS.error}>Critical decay</text>

          {/* topic dots on curve */}
          {topicDecay.map((t, i) => {
            const d = Math.min(t.daysSince, maxDays);
            const r = retentionAfterDays(d);
            const x = xFor(d);
            const y = yFor(r);
            const color = t.reviewUrgency > 0.7 ? COLORS.error : t.reviewUrgency > 0.4 ? COLORS.diffMedium : COLORS.diffEasy;
            const isHL = highlightTopic === t.topic;
            return (
              <g key={t.topic} style={{ cursor: 'pointer' }} onClick={() => setHighlightTopic(isHL ? null : t.topic)}>
                <circle cx={x} cy={y} r={isHL ? 9 : 6} fill={color} opacity="0.9">
                  <title>{`${t.topic}\nLast: ${Math.round(t.daysSince)}d ago\nEst. retention: ${pct(t.estimatedRetention)}`}</title>
                </circle>
                {(isHL || expanded) && (
                  <text x={x + 10} y={y + 4} fontFamily={FONTS.mono} fontSize={9} fill={color}>
                    {t.topic.length > 16 ? `${t.topic.slice(0, 16)}…` : t.topic}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* topic urgency list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: SPACE.sm }}>
        {topicDecay.map((t) => {
          const urgencyColor = t.reviewUrgency > 0.7 ? COLORS.error : t.reviewUrgency > 0.4 ? COLORS.diffMedium : COLORS.diffEasy;
          const urgencyLabel = t.reviewUrgency > 0.7 ? 'Critical' : t.reviewUrgency > 0.4 ? 'Review soon' : 'OK';
          return (
            <div key={t.topic}
              onClick={() => setHighlightTopic(highlightTopic === t.topic ? null : t.topic)}
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${highlightTopic === t.topic ? urgencyColor : COLORS.border}`,
                borderRadius: 8, padding: SPACE.sm, cursor: 'pointer',
                transition: 'border-color 150ms ease' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: SPACE.xs }}>{t.topic}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>Est. retention</div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: SIZE.lg, color: urgencyColor }}>
                    {pct(t.estimatedRetention)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted }}>
                    {Math.round(t.daysSince)}d inactive
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: urgencyColor,
                    fontWeight: 600, marginTop: 2 }}>{urgencyLabel}</div>
                </div>
              </div>
              {/* retention bar */}
              <div style={{ height: 3, backgroundColor: COLORS.border, borderRadius: 2, marginTop: SPACE.sm }}>
                <div style={{ height: '100%', width: `${t.estimatedRetention}%`,
                  backgroundColor: urgencyColor, borderRadius: 2, transition: 'width 500ms ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
