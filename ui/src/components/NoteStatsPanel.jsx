/**
 * NoteStatsPanel
 *
 * Displays spaced-repetition stats for a single vault note.
 * Uses the same compact card/stat-grid treatment as the rest of the app.
 *
 * Props
 *   noteId   — the note slug e.g. "mathematics/algebra/quadratics"
 *   noteTitle — optional display title (shown in header if provided)
 *
 * Fetches from /api/review-due, then finds the matching note_ doc.
 * Falls back gracefully if the endpoint isn't live yet.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/client';
import Skeleton from './Skeleton';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

// ─── Recall-quality badge ────────────────────────────────────────────────────

const RECALL_META = {
  fail:  { label: 'Fail',  bg: COLORS.error,      fg: COLORS.bg },
  again: { label: 'Again', bg: COLORS.diffHard,   fg: COLORS.bg },
  hard:  { label: 'Hard',  bg: COLORS.diffMedium, fg: COLORS.bg },
  good:  { label: 'Good',  bg: COLORS.diffEasy,   fg: COLORS.bg },
  easy:  { label: 'Easy',  bg: COLORS.success,    fg: COLORS.bg },
};

function recallMeta(quality) {
  return RECALL_META[quality?.toLowerCase()] ?? { label: quality ?? '—', bg: COLORS.border, fg: COLORS.text };
}

function scoreColor(score) {
  if (score == null) return COLORS.muted;
  if (score >= 80)   return COLORS.success;
  if (score >= 60)   return COLORS.diffEasy;
  if (score >= 40)   return COLORS.diffMedium;
  return COLORS.diffHard;
}

function formatDate(dateString) {
  if (!dateString) return 'Not scheduled';
  const d = new Date(dateString);
  if (isNaN(d)) return '—';
  const now = new Date();
  const diffDays = Math.round((d - now) / 86_400_000);
  if (diffDays < -1)  return `Overdue by ${Math.abs(diffDays)} days`;
  if (diffDays < 0)   return 'Due today (overdue)';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 14)  return `In ${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    marginBottom: SPACE.lg,
  },
  header: {
    marginBottom: SPACE.lg,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACE.md,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  recallBadge: {
    flexShrink: 0,
    padding: `3px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  statCard: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: SPACE.xs,
    letterSpacing: '0.04em',
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    fontWeight: 600,
    color: COLORS.text,
  },
  reasonBox: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.md,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    lineHeight: 1.5,
  },
  reasonLabel: {
    color: COLORS.text,
    fontWeight: 500,
    marginBottom: SPACE.xs,
  },
  emptyState: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: `${SPACE.lg}px 0`,
  },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NoteStatsPanel({ noteId, noteTitle }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review-due-for-note-stats', noteId],
    queryFn: () => get('/api/review-due'),
    enabled: !!noteId,
    retry: (count, err) => {
      if (/404|500|Not Found|Internal Server/.test(err?.message ?? '')) return false;
      return count < 2;
    },
  });

  const isAPIUnavailable = /404|500|Not Found|Internal Server/.test(error?.message ?? '');

  // Find this note's doc in the returned list
  const stats = useMemo(() => {
    const items = Array.isArray(data) ? data : (data?.items ?? data?.due ?? []);
    return (
      items.find(
        (item) =>
          item.entityType === 'note' &&
          (item.noteId === noteId ||
           item.entityId === noteId ||
           item.entityId === `note_${noteId}`),
      ) ?? null
    );
  }, [data, noteId]);

  if (isAPIUnavailable) return null;

  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.header}><h3 style={s.title}>Note Review Stats</h3></div>
        <Skeleton count={3} height={52} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.container}>
        <div style={s.header}><h3 style={s.title}>Note Review Stats</h3></div>
        <div style={s.emptyState}>Failed to load stats.</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={s.container}>
        <div style={s.header}><h3 style={s.title}>Note Review Stats</h3></div>
        <div style={s.emptyState}>
          No review data yet — take a test covering this note to start tracking progress.
        </div>
      </div>
    );
  }

  const rm = recallMeta(stats.recallQuality);

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Note Review Stats</h3>
          {(noteTitle || stats.noteTitle) && (
            <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.xs, color: COLORS.muted, marginTop: 4 }}>
              {noteTitle || stats.noteTitle}
            </div>
          )}
        </div>
        {stats.recallQuality && (
          <span style={{ ...s.recallBadge, backgroundColor: rm.bg, color: rm.fg }}>
            {rm.label}
          </span>
        )}
      </div>

      <div style={s.statsGrid}>
        {stats.avgScore != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Avg Score</div>
            <div style={{ ...s.statValue, color: scoreColor(stats.avgScore) }}>
              {stats.avgScore.toFixed(0)}%
            </div>
          </div>
        )}

        {stats.lastScore != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Last Score</div>
            <div style={{ ...s.statValue, color: scoreColor(stats.lastScore) }}>
              {stats.lastScore.toFixed(0)}%
            </div>
          </div>
        )}

        {stats.streak != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Streak</div>
            <div style={s.statValue}>{stats.streak}</div>
          </div>
        )}

        {stats.reviewCount != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Reviews</div>
            <div style={s.statValue}>{stats.reviewCount}</div>
          </div>
        )}

        {stats.lapseCount != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Lapses</div>
            <div style={{ ...s.statValue, color: stats.lapseCount > 0 ? COLORS.diffHard : COLORS.text }}>
              {stats.lapseCount}
            </div>
          </div>
        )}

        {stats.intervalDays != null && (
          <div style={s.statCard}>
            <div style={s.statLabel}>Interval</div>
            <div style={s.statValue}>{stats.intervalDays}d</div>
          </div>
        )}

        <div style={s.statCard}>
          <div style={s.statLabel}>Next Review</div>
          <div style={{
            fontFamily: FONTS.mono,
            fontSize: SIZE.sm,
            fontWeight: 600,
            color: stats.nextReviewAt && new Date(stats.nextReviewAt) < new Date()
              ? COLORS.error
              : COLORS.text,
          }}>
            {formatDate(stats.nextReviewAt)}
          </div>
        </div>
      </div>

      {stats.schedulingReason && (
        <div style={s.reasonBox}>
          <div style={s.reasonLabel}>Scheduling reason</div>
          <div>{stats.schedulingReason}</div>
        </div>
      )}
    </div>
  );
}
