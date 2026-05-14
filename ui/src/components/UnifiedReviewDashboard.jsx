import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/client';
import { getReviewSchedule } from '../api/spacedRepetition';
import { getVaultReviewSchedule } from '../api/vaultSpacedRepetition';
import Skeleton from './Skeleton';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
  },
  header: {
    marginBottom: SPACE.lg,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
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
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    alignItems: 'center',
    marginBottom: SPACE.lg,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  select: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  stat: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
  },
  statValue: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACE.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  calendar: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
  },
  dayGroup: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: SPACE.md,
    paddingBottom: SPACE.md,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  dayCount: {
    display: 'block',
    color: COLORS.muted,
    fontSize: SIZE.xs,
    marginTop: 2,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderLeft: '3px solid transparent',
    borderRadius: 8,
    padding: SPACE.md,
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: SPACE.md,
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.xs,
    justifyContent: 'flex-end',
  },
  tag: {
    padding: `2px ${SPACE.sm}px`,
    borderRadius: 4,
    border: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
    whiteSpace: 'nowrap',
  },
  empty: {
    padding: SPACE.xl,
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    backgroundColor: COLORS.surface,
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 8,
  },
  error: {
    padding: SPACE.md,
    color: COLORS.error,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
};

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function scheduleDate(item) {
  return item.nextReviewAt || item.reviewDate || item.dueAt || item.completedAt || item.updatedAt || item.createdAt || new Date().toISOString();
}

function isPast(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date < new Date();
}

function formatDay(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unscheduled';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function sourceLabel(source) {
  if (source === 'vault') return 'Vault';
  if (source === 'review-due') return 'Review Due';
  return 'Spaced Repetition';
}

function itemTitle(item) {
  return item.vaultInfo?.title ||
    item.noteTitle ||
    item.title ||
    item.entityTitle ||
    item.entityId ||
    item.noteId ||
    item.id ||
    'Untitled review';
}

function itemDomain(item) {
  return item.vaultInfo?.domain || item.domain || item.domainId || '';
}

function itemSection(item) {
  return item.vaultInfo?.section || item.section || item.sectionId || '';
}

function normalizeItems(data, source, bucket) {
  return asArray(data).map((item, index) => {
    const date = scheduleDate(item);
    const status = bucket === 'completed'
      ? 'completed'
      : isPast(item.nextReviewAt || item.dueAt || item.reviewDate) ? 'overdue' : bucket;

    return {
      ...item,
      id: `${source}-${item.id || item.entityId || item.noteId || index}-${bucket}`,
      source,
      status,
      title: itemTitle(item),
      date,
      domain: itemDomain(item),
      section: itemSection(item),
      priorityScore: item.priorityScore ?? item.avgScore ?? item.scorePercent ?? 0,
    };
  });
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [
      item.source,
      item.entityType,
      item.entityId || item.noteId || item.vaultId || item.title,
      item.status,
      item.date,
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupByDay(items) {
  const groups = new Map();

  items.forEach((item) => {
    const date = new Date(item.date);
    const key = isNaN(date.getTime())
      ? 'unscheduled'
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const group = groups.get(key) || {
      key,
      label: key === 'unscheduled' ? 'Unscheduled' : formatDay(item.date),
      date,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === 'unscheduled') return 1;
    if (b.key === 'unscheduled') return -1;
    return a.date - b.date;
  });
}

function ReviewCard({ item }) {
  const borderColor = item.status === 'overdue'
    ? COLORS.error
    : item.status === 'completed'
      ? COLORS.success
      : COLORS.accent;
  const path = [item.domain, item.section].filter(Boolean).join(' / ');
  const date = new Date(item.date);

  return (
    <div style={{ ...styles.card, borderLeftColor: borderColor }}>
      <div>
        <div style={styles.cardTitle}>{item.title}</div>
        {path && <div style={styles.meta}>{path}</div>}
        <div style={styles.meta}>
          {isNaN(date.getTime()) ? 'No scheduled date' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      <div style={styles.tagRow}>
        <span style={styles.tag}>{sourceLabel(item.source)}</span>
        <span style={{ ...styles.tag, borderColor, color: borderColor }}>{item.status}</span>
        {item.priorityScore ? <span style={styles.tag}>Priority {Math.round(item.priorityScore)}</span> : null}
      </div>
    </div>
  );
}

function CalendarSection({ title, items }) {
  if (!items.length) return null;
  const groups = groupByDay(items);

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title} ({items.length})</h2>
      <div style={styles.calendar}>
        {groups.map((group) => (
          <div key={group.key} style={styles.dayGroup}>
            <div style={styles.dayLabel}>
              {group.label}
              <span style={styles.dayCount}>{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={styles.list}>
              {group.items.map((item) => <ReviewCard key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function UnifiedReviewDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [source, setSource] = useState('');
  const [domain, setDomain] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-review-dashboard', timeRange],
    queryFn: async () => {
      const [vault, spaced, reviewDue] = await Promise.allSettled([
        getVaultReviewSchedule({ timeRange, limit: 100 }),
        getReviewSchedule(100),
        get('/api/review-due'),
      ]);
      return {
        vault: vault.status === 'fulfilled' ? vault.value : null,
        spaced: spaced.status === 'fulfilled' ? spaced.value : null,
        reviewDue: reviewDue.status === 'fulfilled' ? reviewDue.value : null,
        failures: [vault, spaced, reviewDue].filter(result => result.status === 'rejected'),
      };
    },
  });

  const allItems = useMemo(() => {
    const items = [
      ...normalizeItems(data?.vault?.due, 'vault', 'due'),
      ...normalizeItems(data?.vault?.upcoming, 'vault', 'upcoming'),
      ...normalizeItems(data?.vault?.completed, 'vault', 'completed'),
      ...normalizeItems(data?.spaced?.due, 'spaced', 'due'),
      ...normalizeItems(data?.spaced?.upcoming, 'spaced', 'upcoming'),
      ...normalizeItems(data?.spaced?.completed, 'spaced', 'completed'),
      ...normalizeItems(data?.reviewDue?.due || data?.reviewDue, 'review-due', 'due'),
      ...normalizeItems(data?.reviewDue?.upcoming, 'review-due', 'upcoming'),
      ...normalizeItems(data?.reviewDue?.completed, 'review-due', 'completed'),
    ];
    return dedupe(items);
  }, [data]);

  const domains = useMemo(() => Array.from(new Set(allItems.map(item => item.domain).filter(Boolean))).sort(), [allItems]);

  const filteredItems = useMemo(() => allItems.filter((item) => {
    if (source && item.source !== source) return false;
    if (domain && item.domain !== domain) return false;
    if (!showCompleted && item.status === 'completed') return false;
    return true;
  }), [allItems, source, domain, showCompleted]);

  const overdueItems = filteredItems.filter(item => item.status === 'overdue');
  const dueItems = filteredItems.filter(item => item.status === 'due');
  const upcomingItems = filteredItems.filter(item => item.status === 'upcoming');
  const completedItems = filteredItems.filter(item => item.status === 'completed');

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Review Calendar</h1>
          <div style={styles.subtitle}>Loading all review sources...</div>
        </div>
        <Skeleton count={5} height={72} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Failed to load the review calendar.{' '}
          <span style={{ color: COLORS.accent, cursor: 'pointer' }} onClick={() => refetch()}>Retry</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Review Calendar</h1>
        <div style={styles.subtitle}>One calendar for Vault, Review Due, and spaced repetition reviews.</div>
      </div>

      <div style={styles.controls}>
        <select style={styles.select} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All</option>
        </select>
        <select style={styles.select} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="vault">Vault</option>
          <option value="review-due">Review Due</option>
          <option value="spaced">Spaced Repetition</option>
        </select>
        {domains.length > 0 && (
          <select style={styles.select} value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">All domains</option>
            {domains.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        )}
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          Show completed
        </label>
      </div>

      <div style={styles.statRow}>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Overdue</div>
          <div style={styles.statValue}>{overdueItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Due</div>
          <div style={styles.statValue}>{dueItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Upcoming</div>
          <div style={styles.statValue}>{upcomingItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Sources</div>
          <div style={styles.statValue}>{new Set(filteredItems.map(item => item.source)).size}</div>
        </div>
      </div>

      {data?.failures?.length > 0 && (
        <div style={{ ...styles.empty, marginBottom: SPACE.lg }}>
          Some review sources did not respond, so this calendar is showing the sources that are available.
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div style={styles.empty}>No reviews match the current filters.</div>
      ) : (
        <>
          <CalendarSection title="Overdue" items={overdueItems} />
          <CalendarSection title="Due Now" items={dueItems} />
          <CalendarSection title="Upcoming" items={upcomingItems} />
          {showCompleted && <CalendarSection title="Completed" items={completedItems} />}
        </>
      )}
    </div>
  );
}
