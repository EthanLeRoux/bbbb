/**
 * NoteBreakdown
 *
 * Shown on the post-attempt results screen.
 * Displays which vault notes each question was drawn from, that note's
 * last score, and when it's next scheduled for review.
 *
 * Props
 *   sourceNotes  — array from the test document: [{ noteId, noteTitle, section }]
 *   noteStats    — map of noteId → review_stats doc fetched from Firestore after
 *                  submission: { lastScore, avgScore, recallQuality, nextReviewAt,
 *                                intervalDays, streak, schedulingReason }
 *                  Can be null / undefined while loading.
 */

import { COLORS, FONTS, SIZE, SPACE } from '../constants';

// ─── Recall-quality badge colours ────────────────────────────────────────────

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

function formatNextReview(dateString) {
  if (!dateString) return 'Not scheduled';
  const d = new Date(dateString);
  if (isNaN(d)) return '—';
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays < 0)  return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 30)  return `In ${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: {
    marginTop: SPACE.xl,
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  count: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  card: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: `${SPACE.xs}px ${SPACE.md}px`,
    alignItems: 'center',
  },
  noteTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    color: COLORS.text,
  },
  noteSection: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginTop: 2,
  },
  noteId: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    opacity: 0.6,
    marginTop: 1,
  },
  meta: {
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
  scoreText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    textAlign: 'right',
  },
  nextReview: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textAlign: 'right',
  },
  loading: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    fontStyle: 'italic',
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

// ─── Sub-component ─────────────────────────────────────────────────────────────

function NoteCard({ note, stats }) {
  const rm = stats ? recallMeta(stats.recallQuality) : null;
  const hasStats = !!stats;

  return (
    <div style={s.card}>
      <div>
        <div style={s.noteTitle}>{note.noteTitle || note.noteId}</div>
        {note.section && <div style={s.noteSection}>{note.section}</div>}
        <div style={s.noteId}>{note.noteId}</div>
      </div>

      <div style={s.meta}>
        {!hasStats && (
          <span style={s.loading}>syncing…</span>
        )}

        {hasStats && rm && (
          <span style={{ ...s.recallBadge, backgroundColor: rm.bg, color: rm.fg }}>
            {rm.label}
          </span>
        )}

        {hasStats && stats.lastScore != null && (
          <span style={{ ...s.scoreText, color: scoreColor(stats.lastScore) }}>
            {stats.lastScore.toFixed(0)}%
          </span>
        )}

        {hasStats && (
          <span style={s.nextReview}>
            {formatNextReview(stats.nextReviewAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NoteBreakdown({ sourceNotes, noteStats }) {
  if (!sourceNotes || sourceNotes.length === 0) return null;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h3 style={s.title}>Source Notes</h3>
        <span style={s.count}>{sourceNotes.length} note{sourceNotes.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={s.list}>
        {sourceNotes.map((note) => (
          <NoteCard
            key={note.noteId}
            note={note}
            stats={noteStats?.[note.noteId] ?? null}
          />
        ))}
      </div>
    </div>
  );
}