import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../api/client';
import { getReviewSchedule } from '../api/spacedRepetition';
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
    justifyContent: 'space-between',
    marginBottom: SPACE.lg,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  controlGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  tabs: {
    display: 'inline-grid',
    gridTemplateColumns: 'repeat(3, minmax(72px, 1fr))',
    gap: 2,
    padding: 2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
  },
  tab: {
    border: 0,
    borderRadius: 6,
    padding: `${SPACE.xs}px ${SPACE.md}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  tabActive: {
    color: COLORS.bg,
    backgroundColor: COLORS.accent,
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
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.md,
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    color: COLORS.text,
    margin: `0 0 ${SPACE.md}px`,
  },
  sectionHint: {
    fontSize: SIZE.xs,
    color: COLORS.muted,
    fontWeight: 400,
  },
  dayPanel: {
    display: 'grid',
    gap: SPACE.md,
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))',
    gap: SPACE.sm,
    overflowX: 'auto',
    paddingBottom: SPACE.xs,
  },
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(112px, 1fr))',
    gap: SPACE.xs,
    overflowX: 'auto',
    paddingBottom: SPACE.xs,
  },
  weekdayHeader: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
  },
  dayCell: {
    minHeight: 150,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  monthCell: {
    minHeight: 132,
  },
  blankCell: {
    minHeight: 132,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    opacity: 0.35,
  },
  todayCell: {
    borderColor: COLORS.accent,
    boxShadow: `inset 0 0 0 1px ${COLORS.accent}`,
  },
  cellHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    fontFamily: FONTS.mono,
    color: COLORS.text,
  },
  cellDayName: {
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  cellDate: {
    fontSize: SIZE.md,
    fontWeight: 700,
  },
  cellCount: {
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  card: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderLeft: '3px solid transparent',
    borderRadius: 8,
    padding: SPACE.sm,
    display: 'grid',
    gap: SPACE.sm,
  },
  cardCompact: {
    padding: SPACE.xs,
    gap: SPACE.xs,
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 600,
    color: COLORS.text,
    overflowWrap: 'anywhere',
  },
  cardTitleCompact: {
    fontSize: SIZE.xs,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    overflowWrap: 'anywhere',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.xs,
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
  overflowNote: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
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

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function scheduleDate(item) {
  const value = item.nextReviewAt || item.reviewDate || item.dueAt || item.completedAt || item.updatedAt || item.createdAt;
  return parseDate(value) || new Date();
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function formatDayLabel(date) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function statusLabel(status) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'completed') return 'Completed';
  if (status === 'upcoming') return 'Upcoming';
  return 'Due';
}

function statusColor(status) {
  if (status === 'overdue') return COLORS.error;
  if (status === 'completed') return COLORS.success;
  if (status === 'upcoming') return COLORS.accent;
  return COLORS.diffMedium;
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

function normalizeStatus(bucket, date) {
  if (bucket === 'completed') return 'completed';
  const todayStart = startOfDay(new Date());
  if (date < todayStart) return 'overdue';
  if (bucket === 'due') return 'due';
  return 'upcoming';
}

function normalizeItems(data, source, bucket) {
  return asArray(data).map((item, index) => {
    const date = scheduleDate(item);

    return {
      ...item,
      id: `${source}-${item.id || item.entityId || item.noteId || index}-${bucket}`,
      source,
      status: normalizeStatus(bucket, date),
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
      dateKey(item.date),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupByDate(items) {
  return items.reduce((groups, item) => {
    const key = dateKey(item.date);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
    return groups;
  }, new Map());
}

function sortByDate(items) {
  return [...items].sort((a, b) => a.date - b.date);
}

function getWeekDays() {
  const start = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getMonthCells() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const cells = [];

  for (let i = 0; i < monthStart.getDay(); i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    cells.push(new Date(now.getFullYear(), now.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function ReviewCard({ item, compact = false }) {
  const color = statusColor(item.status);
  const path = [item.domain, item.section].filter(Boolean).join(' / ');

  return (
    <div style={{ ...styles.card, ...(compact ? styles.cardCompact : {}), borderLeftColor: color }}>
      <div>
        <div style={{ ...styles.cardTitle, ...(compact ? styles.cardTitleCompact : {}) }}>{item.title}</div>
        {path && <div style={styles.meta}>{path}</div>}
        <div style={styles.meta}>{formatTime(item.date)}</div>
      </div>
      <div style={styles.tagRow}>
        <span style={{ ...styles.tag, borderColor: color, color }}>{statusLabel(item.status)}</span>
        {item.priorityScore ? <span style={styles.tag}>Priority {Math.round(item.priorityScore)}</span> : null}
      </div>
    </div>
  );
}

function EmptyState({ children = 'No reviews match the current filters.' }) {
  return <div style={styles.empty}>{children}</div>;
}

function SectionTitle({ title, hint }) {
  return (
    <h2 style={styles.sectionTitle}>
      <span>{title}</span>
      {hint && <span style={styles.sectionHint}>{hint}</span>}
    </h2>
  );
}

function OverdueSection({ items }) {
  if (!items.length) return null;

  return (
    <section style={styles.section}>
      <SectionTitle title={`Overdue (${items.length})`} hint="Needs attention first" />
      <div style={styles.cardList}>
        {sortByDate(items).map((item) => <ReviewCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

function CalendarDayCell({ date, items, month = false }) {
  const sortedItems = sortByDate(items);
  const visibleItems = month ? sortedItems.slice(0, 3) : sortedItems;
  const remaining = sortedItems.length - visibleItems.length;

  return (
    <div style={{
      ...styles.dayCell,
      ...(month ? styles.monthCell : {}),
      ...(sameDay(date, new Date()) ? styles.todayCell : {}),
    }}>
      <div style={styles.cellHeader}>
        <div>
          <div style={styles.cellDayName}>
            {date.toLocaleDateString('en-US', { weekday: month ? 'short' : 'long' })}
          </div>
          <div style={styles.cellDate}>{month ? date.getDate() : formatDayLabel(date)}</div>
        </div>
        <div style={styles.cellCount}>{items.length}</div>
      </div>

      {visibleItems.length ? (
        <div style={styles.cardList}>
          {visibleItems.map((item) => <ReviewCard key={item.id} item={item} compact={month} />)}
          {remaining > 0 && <div style={styles.overflowNote}>+{remaining} more</div>}
        </div>
      ) : (
        <div style={styles.meta}>Clear</div>
      )}
    </div>
  );
}

function DayView({ items }) {
  const todayItems = sortByDate(items.filter((item) => sameDay(item.date, new Date()) && item.status !== 'overdue'));
  const dueToday = todayItems.filter((item) => item.status === 'due');
  const upcomingToday = todayItems.filter((item) => item.status === 'upcoming');
  const completedToday = todayItems.filter((item) => item.status === 'completed');

  if (!todayItems.length) {
    return <EmptyState>No reviews due today.</EmptyState>;
  }

  return (
    <div style={styles.dayPanel}>
      {dueToday.length > 0 && (
        <section style={styles.section}>
          <SectionTitle title={`Due Today (${dueToday.length})`} />
          <div style={styles.cardList}>
            {dueToday.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {upcomingToday.length > 0 && (
        <section style={styles.section}>
          <SectionTitle title={`Later Today (${upcomingToday.length})`} />
          <div style={styles.cardList}>
            {upcomingToday.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {completedToday.length > 0 && (
        <section style={styles.section}>
          <SectionTitle title={`Completed Today (${completedToday.length})`} />
          <div style={styles.cardList}>
            {completedToday.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function WeekView({ items }) {
  const days = getWeekDays();
  const groups = groupByDate(items.filter((item) => {
    const date = item.date;
    return date >= days[0] && date <= endOfDay(days[6]) && item.status !== 'overdue';
  }));

  return (
    <section style={styles.section}>
      <SectionTitle title="Next 7 Days" hint={`${formatDayLabel(days[0])} - ${formatDayLabel(days[6])}`} />
      <div style={styles.weekGrid}>
        {days.map((day) => (
          <CalendarDayCell key={dateKey(day)} date={day} items={groups.get(dateKey(day)) || []} />
        ))}
      </div>
    </section>
  );
}

function MonthView({ items }) {
  const cells = getMonthCells();
  const today = new Date();
  const monthItems = items.filter((item) =>
    item.status !== 'overdue' &&
    item.date.getFullYear() === today.getFullYear() &&
    item.date.getMonth() === today.getMonth()
  );
  const groups = groupByDate(monthItems);

  return (
    <section style={styles.section}>
      <SectionTitle
        title={today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        hint="Monthly review map"
      />
      <div style={styles.monthGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} style={styles.weekdayHeader}>{day}</div>
        ))}
        {cells.map((day, index) => (
          day ? (
            <CalendarDayCell key={dateKey(day)} date={day} items={groups.get(dateKey(day)) || []} month />
          ) : (
            <div key={`blank-${index}`} style={styles.blankCell} />
          )
        ))}
      </div>
    </section>
  );
}

export default function UnifiedReviewDashboard() {
  const [view, setView] = useState('week');
  const [domain, setDomain] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-review-dashboard'],
    queryFn: async () => {
      const [spaced, reviewDue] = await Promise.allSettled([
        getReviewSchedule(100),
        get('/api/review-due'),
      ]);
      return {
        spaced: spaced.status === 'fulfilled' ? spaced.value : null,
        reviewDue: reviewDue.status === 'fulfilled' ? reviewDue.value : null,
        failures: [spaced, reviewDue].filter(result => result.status === 'rejected'),
      };
    },
  });

  const allItems = useMemo(() => {
    const items = [
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
    if (domain && item.domain !== domain) return false;
    if (!showCompleted && item.status === 'completed') return false;
    return true;
  }), [allItems, domain, showCompleted]);

  const today = new Date();
  const overdueItems = filteredItems.filter(item => item.status === 'overdue');
  const todayItems = filteredItems.filter(item => sameDay(item.date, today) && item.status !== 'overdue');
  const weekEnd = endOfDay(addDays(startOfDay(today), 6));
  const weekItems = filteredItems.filter(item => item.status !== 'overdue' && item.date >= startOfDay(today) && item.date <= weekEnd);
  const monthItems = filteredItems.filter(item =>
    item.status !== 'overdue' &&
    item.date.getFullYear() === today.getFullYear() &&
    item.date.getMonth() === today.getMonth()
  );

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Review Calendar</h1>
          <div style={styles.subtitle}>Loading review data...</div>
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
        <div style={styles.subtitle}>See what is due today, this week, and across the month.</div>
      </div>

      <div style={styles.controls}>
        <div style={styles.tabs} aria-label="Calendar view">
          {['day', 'week', 'month'].map((option) => (
            <button
              key={option}
              type="button"
              style={{ ...styles.tab, ...(view === option ? styles.tabActive : {}) }}
              onClick={() => setView(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.controlGroup}>
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
      </div>

      <div style={styles.statRow}>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Overdue</div>
          <div style={styles.statValue}>{overdueItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Today</div>
          <div style={styles.statValue}>{todayItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Next 7 Days</div>
          <div style={styles.statValue}>{weekItems.length}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>This Month</div>
          <div style={styles.statValue}>{monthItems.length}</div>
        </div>
      </div>

      {data?.failures?.length > 0 && (
        <div style={{ ...styles.empty, marginBottom: SPACE.lg }}>
          Some review data did not respond, so this calendar is showing what is available.
        </div>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <OverdueSection items={overdueItems} />
          {view === 'day' && <DayView items={filteredItems} />}
          {view === 'week' && <WeekView items={filteredItems} />}
          {view === 'month' && <MonthView items={filteredItems} />}
        </>
      )}
    </div>
  );
}
