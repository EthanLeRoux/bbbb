import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVaultReviewSchedule } from '../api/vaultSpacedRepetition';
import Skeleton from './Skeleton';
import NotesReviewDue from './NotesReviewDue';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

// ─── Urgency helpers ────────────────────────────────────────────────────────

const URGENCY = {
  critical: { label: 'Critical', bg: COLORS.error,     fg: COLORS.bg },
  high:     { label: 'High',     bg: COLORS.diffHard,  fg: COLORS.bg },
  medium:   { label: 'Medium',   bg: COLORS.diffMedium, fg: COLORS.bg },
  low:      { label: 'Low',      bg: COLORS.success,   fg: COLORS.bg },
};

function urgencyFromScore(score) {
  if (score >= 80) return URGENCY.critical;
  if (score >= 60) return URGENCY.high;
  if (score >= 40) return URGENCY.medium;
  return URGENCY.low;
}

function isOverdue(dateString) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  metaRow: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  filterRow: {
    display: 'flex',
    gap: SPACE.sm,
    marginBottom: SPACE.lg,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  select: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    cursor: 'pointer',
  },
  dateInputs: {
    display: 'flex',
    gap: SPACE.sm,
    alignItems: 'center',
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
  },
  dateInput: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
    marginTop: SPACE.lg,
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  card: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: `${SPACE.sm}px ${SPACE.md}px`,
    borderLeft: '3px solid transparent',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: `${SPACE.xs}px ${SPACE.md}px`,
    alignItems: 'start',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.xs,
  },
  conceptName: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  domainTag: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  reasonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: 2,
  },
  reasonText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACE.xs,
  },
  urgencyBadge: {
    padding: `2px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  metaText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textAlign: 'right',
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    padding: `${SPACE.xl}px ${SPACE.lg}px`,
  },
  errorState: {
    textAlign: 'center',
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    padding: SPACE.lg,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function QueueCard({ item, rank }) {
  const urgency = urgencyFromScore(item.priorityScore);
  const borderColor = urgency === URGENCY.critical ? COLORS.error
    : urgency === URGENCY.high   ? COLORS.diffHard
    : urgency === URGENCY.medium ? COLORS.diffMedium
    : COLORS.border;

  const title = item.vaultInfo?.title || item.entityId || 'Unknown';
  const domain = item.vaultInfo?.domain || item.domainId || '';
  const section = item.vaultInfo?.section || item.sectionId || '';
  const domainLabel = [domain, section].filter(Boolean).join(' › ');

  return (
    <div style={{ ...s.card, borderLeftColor: borderColor }}>
      <div style={s.cardLeft}>
        <div style={s.conceptName}>
          <span style={{ color: COLORS.muted, fontWeight: 400 }}>{rank}. </span>
          {title}
        </div>
        {domainLabel && (
          <div style={s.domainTag}>{domainLabel}</div>
        )}
        <div style={s.reasonRow}>
          <span style={s.reasonText}>
            {isOverdue(item.nextReviewAt) ? 'Overdue' : 'Due soon'}
          </span>
        </div>
      </div>

      <div style={s.cardRight}>
        <span style={{
          ...s.urgencyBadge,
          backgroundColor: urgency.bg,
          color: urgency.fg,
        }}>
          {urgency.label}
        </span>
        <div style={s.metaText}>
          Score: {item.avgScore?.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function VaultReviewDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [limit] = useState(20);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [domain, setDomain] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vault-review-schedule', timeRange, limit, customStart, customEnd],
    queryFn: () => {
      const options = { timeRange, limit };
      if (timeRange === 'custom') {
        if (customStart) options.startDate = customStart;
        if (customEnd) options.endDate = customEnd;
      }
      return getVaultReviewSchedule(options);
    },
    retry: (count, err) => {
      if (/404|500|Not Found|Internal Server/.test(err?.message)) return false;
      return count < 2;
    },
  });

  const isAPIUnavailable = /404|500|Not Found|Internal Server/.test(error?.message ?? '');

  // Derive lists from response
  const dueItems = useMemo(() => {
    let items = data?.due || [];
    if (domain) {
      items = items.filter(item => 
        (item.vaultInfo?.domain || item.domainId || '').toLowerCase() === domain.toLowerCase()
      );
    }
    if (overdueOnly) {
      items = items.filter(item => isOverdue(item.nextReviewAt));
    }
    return items;
  }, [data, domain, overdueOnly]);

  const upcomingItems = useMemo(() => {
    let items = data?.upcoming || [];
    if (domain) {
      items = items.filter(item => 
        (item.vaultInfo?.domain || item.domainId || '').toLowerCase() === domain.toLowerCase()
      );
    }
    return items;
  }, [data, domain]);

  // Collect unique domains for filter
  const domainOptions = useMemo(() => {
    const allItems = [...(data?.due || []), ...(data?.upcoming || [])];
    const domains = new Set();
    allItems.forEach(item => {
      const itemDomain = item.vaultInfo?.domain || item.domainId;
      if (itemDomain) {
        domains.add(itemDomain);
      }
    });
    return Array.from(domains).sort();
  }, [data]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <h2 style={s.title}>Review Dashboard</h2>
        </div>
        <Skeleton count={4} height={64} />
      </div>
    );
  }

  // ── API not yet live ───────────────────────────────────────────────────────
  if (isAPIUnavailable) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <h2 style={s.title}>Review Dashboard</h2>
        </div>
        <div style={s.emptyState}>
          Spaced repetition review scheduling is being implemented. Keep taking tests to build your review schedule.
        </div>
      </div>
    );
  }

  // ── Generic error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <h2 style={s.title}>Review Dashboard</h2>
        </div>
        <div style={s.errorState}>
          Failed to load schedule.{' '}
          <span style={{ color: COLORS.accent, cursor: 'pointer' }} onClick={() => refetch()}>
            Retry
          </span>
        </div>
      </div>
    );
  }

  // ── Happy path ─────────────────────────────────────────────────────────────
  const dueCount = dueItems.length;
  const upcomingCount = upcomingItems.length;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>Review Dashboard</h2>
        <div style={s.metaRow}>
          <span>{dueCount} due now</span>
          <span style={{ color: COLORS.muted }}> · </span>
          <span>{upcomingCount} upcoming</span>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <select
          style={s.select}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All</option>
          <option value="custom">Custom Range</option>
        </select>

        {timeRange === 'custom' && (
          <div style={s.dateInputs}>
            <input
              type="date"
              style={s.dateInput}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              placeholder="Start date"
            />
            <span>to</span>
            <input
              type="date"
              style={s.dateInput}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              placeholder="End date"
            />
          </div>
        )}

        {domainOptions.length > 0 && (
          <select
            style={s.select}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="">All domains</option>
            {domainOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        <label style={s.checkLabel}>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Overdue only
        </label>
      </div>

      {/* Notes due for review (note-level SR entities) */}
      <NotesReviewDue />

      {/* Due Reviews */}
      {dueCount > 0 && (
        <div>
          <h3 style={s.sectionTitle}>Due Now ({dueCount})</h3>
          <div style={s.queueList}>
            {dueItems.map((item, i) => (
              <QueueCard key={item.id} item={item} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {upcomingCount > 0 && (
        <div>
          <h3 style={s.sectionTitle}>Upcoming ({upcomingCount})</h3>
          <div style={s.queueList}>
            {upcomingItems.map((item, i) => (
              <QueueCard key={item.id} item={item} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dueCount === 0 && upcomingCount === 0 && (
        <div style={s.emptyState}>
          No reviews scheduled for this time period.
        </div>
      )}
    </div>
  );
}
