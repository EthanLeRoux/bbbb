import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviewSchedule } from '../api/spacedRepetition';
import AIScoreBadge from '../components/AIScoreBadge';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  header: {
    marginBottom: SPACE.lg,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    margin: 0,
    marginBottom: SPACE.sm,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  section: {
    marginBottom: SPACE.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  dueCardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  dueCard: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dueCardHover: {
    borderColor: COLORS.accent,
    boxShadow: `0 2px 8px ${COLORS.accent}20`,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACE.sm,
  },
  entityPath: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  priorityBadge: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
  },
  priorityCritical: {
    backgroundColor: `${COLORS.error}20`,
    color: COLORS.error,
  },
  priorityHigh: {
    backgroundColor: `${COLORS.diffHard}20`,
    color: COLORS.diffHard,
  },
  priorityMedium: {
    backgroundColor: `${COLORS.diffMedium}20`,
    color: COLORS.diffMedium,
  },
  priorityLow: {
    backgroundColor: `${COLORS.success}20`,
    color: COLORS.success,
  },
  cardContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    marginBottom: SPACE.xs,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    fontWeight: 500,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.sm,
    borderTop: `1px solid ${COLORS.border}`,
  },
  lastReviewDate: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  overdueBadge: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.error,
    fontWeight: 500,
  },
  noItemsContainer: {
    padding: SPACE.xl,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    border: `1px dashed ${COLORS.border}`,
  },
  noItemsText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  subSectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    color: COLORS.text,
    marginTop: SPACE.lg,
    marginBottom: SPACE.md,
  },
  upcomingContainer: {
    opacity: 0.7,
  },
  entityLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
};

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getPriorityStyle(priorityScore) {
  if (priorityScore >= 75) return { container: styles.priorityCritical, label: 'CRITICAL' };
  if (priorityScore >= 50) return { container: styles.priorityHigh, label: 'HIGH' };
  if (priorityScore >= 25) return { container: styles.priorityMedium, label: 'MEDIUM' };
  return { container: styles.priorityLow, label: 'LOW' };
}

function formatEntityPath(entityType, entityId) {
  return `${entityType.toUpperCase()}: ${entityId}`;
}

function DueItemCard({ item, entityType }) {
  const priorityStyle = getPriorityStyle(item.priorityScore || 0);
  const isOverdue = item.nextReviewAt && new Date(item.nextReviewAt) < new Date();
  const now = new Date();
  const daysOverdue = isOverdue ? Math.floor((now - new Date(item.nextReviewAt)) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div style={styles.dueCard}>
      <div style={styles.cardHeader}>
        <span style={styles.entityPath}>
          {formatEntityPath(entityType, item.entityId)}
        </span>
        <span style={[styles.priorityBadge, priorityStyle.container]}>
          {priorityStyle.label}
        </span>
      </div>
      
      <div style={styles.cardContent}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Priority Score</span>
          <span style={styles.statValue}>{(item.priorityScore || 0).toFixed(1)}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Retention</span>
          <span style={styles.statValue}>
            {(item.retentionStrength || 0).toFixed(2)}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Reviews</span>
          <span style={styles.statValue}>{item.reviewCount || 0}</span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.lastReviewDate}>
          Last review: {formatDate(item.lastReviewedAt)}
        </span>
        {isOverdue && (
          <span style={styles.overdueBadge}>
            ⚠️ {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
          </span>
        )}
        {!isOverdue && item.nextReviewAt && (
          <span style={styles.lastReviewDate}>
            Next: {new Date(item.nextReviewAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SpacedRepetitionDue() {
  const [reviewSchedule, setReviewSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getReviewSchedule(50);
        setReviewSchedule(data);
      } catch (err) {
        console.error('Failed to fetch review schedule:', err);
        setError('Failed to load review schedule. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{LABELS.nav.reviewDue || 'Review Due'}</h1>
          <p style={styles.subtitle}>Loading your review schedule...</p>
        </div>
        <div style={{ padding: SPACE.lg }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.muted }}>
            Loading review items...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{LABELS.nav.reviewDue || 'Review Due'}</h1>
        </div>
        <div style={styles.noItemsContainer}>
          <p style={styles.noItemsText}>{error}</p>
        </div>
      </div>
    );
  }

  const dueItems = reviewSchedule?.due || [];
  const upcomingItems = reviewSchedule?.upcoming || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{LABELS.nav.reviewDue || 'Spaced Repetition Review'}</h1>
        <p style={styles.subtitle}>
          {dueItems.length} items due for review
          {upcomingItems.length > 0 && ` • ${upcomingItems.length} upcoming`}
        </p>
      </div>

      {dueItems.length === 0 ? (
        <div style={styles.noItemsContainer}>
          <p style={styles.noItemsText}>🎉 No items due for review right now!</p>
          <p style={{ ...styles.noItemsText, marginTop: SPACE.md }}>
            Keep up the good work with your learning schedule.
          </p>
        </div>
      ) : (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⏰ Due for Review</h2>
            <div style={styles.dueCardsContainer}>
              {dueItems.map((item) => (
                <DueItemCard key={item.id} item={item} entityType={item.entityType} />
              ))}
            </div>
          </div>
        </>
      )}

      {upcomingItems.length > 0 && (
        <div style={styles.section}>
          <h2 style={{ ...styles.sectionTitle, ...styles.upcomingContainer }}>📅 Upcoming Reviews</h2>
          <div style={styles.dueCardsContainer}>
            {upcomingItems.slice(0, 10).map((item) => (
              <DueItemCard key={item.id} item={item} entityType={item.entityType} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
