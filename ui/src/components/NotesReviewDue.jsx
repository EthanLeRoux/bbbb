/**
 * NotesReviewDue
 *
 * Fetches from /review-due, filters to entityType === 'note' and
 * nextReviewAt <= now, then renders a list of due notes with:
 *   - noteTitle
 *   - recallQuality colour-coded badge
 *   - intervalDays
 *
 * Designed to slot into VaultReviewDashboard or any study dashboard page.
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

// Border accent colour mirrors existing urgency logic
function accentFromRecall(quality) {
  const q = quality?.toLowerCase();
  if (q === 'fail' || q === 'again') return COLORS.error;
  if (q === 'hard')  return COLORS.diffMedium;
  if (q === 'good')  return COLORS.diffEasy;
  if (q === 'easy')  return COLORS.success;
  return COLORS.border;
}

function formatNextReview(dateString) {
  if (!dateString) return 'Not scheduled';
  const d = new Date(dateString);
  if (isNaN(d)) return '—';
  const now = new Date();
  const diffDays = Math.round((d - now) / 86_400_000);
  if (diffDays < 0)   return `Overdue ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays}d`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: {
    marginBottom: SPACE.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  countBubble: {
    backgroundColor: `${COLORS.error}20`,
    color: COLORS.error,
    border: `1px solid ${COLORS.error}40`,
    borderRadius: 10,
    padding: `1px 8px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  card: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderLeft: '3px solid transparent',
    borderRadius: 6,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: `${SPACE.xs}px ${SPACE.md}px`,
    alignItems: 'start',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  noteTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    color: COLORS.text,
  },
  noteMeta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACE.xs,
  },
  recallBadge: {
    padding: `2px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  interval: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textAlign: 'right',
  },
  nextReview: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textAlign: 'right',
  },
  emptyState: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: `${SPACE.lg}px 0`,
  },
  errorState: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.error,
    padding: SPACE.md,
  },
};

// ─── Sub-component ─────────────────────────────────────────────────────────────

function NoteReviewCard({ item }) {
  const rm = recallMeta(item.recallQuality);
  const accent = accentFromRecall(item.recallQuality);

  return (
    <div style={{ ...s.card, borderLeftColor: accent }}>
      <div style={s.cardLeft}>
        <div style={s.noteTitle}>{item.noteTitle || item.noteId || 'Untitled note'}</div>
        {item.section && (
          <div style={s.noteMeta}>{item.section}</div>
        )}
        <div style={{ ...s.noteMeta, marginTop: 2 }}>
          {formatNextReview(item.nextReviewAt)}
        </div>
      </div>

      <div style={s.cardRight}>
        <span style={{ ...s.recallBadge, backgroundColor: rm.bg, color: rm.fg }}>
          {rm.label}
        </span>
        {item.intervalDays != null && (
          <span style={s.interval}>
            {item.intervalDays}d interval
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NotesReviewDue() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['review-due-notes'],
    queryFn: () => get('/api/review-due'),
    retry: (count, err) => {
      if (/404|500|Not Found|Internal Server/.test(err?.message ?? '')) return false;
      return count < 2;
    },
  });

  const isAPIUnavailable = /404|500|Not Found|Internal Server/.test(error?.message ?? '');

  // Filter to note-level docs that are due (nextReviewAt <= now)
  const dueNotes = useMemo(() => {
    const items = Array.isArray(data) ? data : (data?.items ?? data?.due ?? []);
    const now = new Date();
    return items.filter(
      (item) =>
        item.entityType === 'note' &&
        item.nextReviewAt &&
        new Date(item.nextReviewAt) <= now,
    );
  }, [data]);

  if (isAPIUnavailable || isLoading && !data) {
    if (isAPIUnavailable) return null; // silently hide if endpoint not live
  }

  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.sectionTitle}>Notes Due for Review</div>
        <Skeleton count={3} height={56} />
      </div>
    );
  }

  if (error && !isAPIUnavailable) {
    return (
      <div style={s.container}>
        <div style={s.sectionTitle}>Notes Due for Review</div>
        <div style={s.errorState}>Failed to load note reviews.</div>
      </div>
    );
  }

  if (dueNotes.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.sectionTitle}>
          Notes Due for Review
        </div>
        <div style={s.emptyState}>
          No notes due right now — great work!
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.sectionTitle}>
        Notes Due for Review
        <span style={s.countBubble}>{dueNotes.length}</span>
      </div>

      <div style={s.list}>
        {dueNotes.map((item) => (
          <NoteReviewCard
            key={item.id ?? item.noteId ?? item.entityId}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}