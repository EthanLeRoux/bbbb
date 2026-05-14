import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStats, getTests } from '../api/tests';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { COLORS, FONTS, SPACE, SIZE, LABELS, PAGE_SIZE } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  statsRow: {
    display: 'flex',
    gap: SPACE.md,
    marginBottom: SPACE.xl,
  },
  statChip: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    color: COLORS.text,
  },
  generateButton: {
    display: 'inline-block',
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    padding: `${SPACE.md}px ${SPACE.lg}px`,
    borderRadius: 8,
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    textDecoration: 'none',
    marginBottom: SPACE.xl,
    cursor: 'pointer',
    border: 'none',
  },
  sectionHeader: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  reviewLinkCard: {
    display: 'block',
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.lg,
    marginBottom: SPACE.xl,
    color: COLORS.text,
    textDecoration: 'none',
  },
  reviewLinkTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    marginBottom: SPACE.xs,
  },
  reviewLinkText: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
  },
  testRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${SPACE.sm}px 0`,
    borderBottom: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  testRowHover: {
    backgroundColor: COLORS.surface,
  },
  errorContainer: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
    marginTop: SPACE.sm,
  },
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats
  });

  const { data: recentTests, isLoading: testsLoading, error: testsError, refetch: refetchTests } = useQuery({
    queryKey: ['tests', { limit: 5 }],
    queryFn: () => getTests({ limit: 5 })
  });

  if (statsError) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div>{LABELS.error.generic}</div>
          <button style={styles.retryButton} onClick={() => refetchStats()}>
            {LABELS.error.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {statsLoading ? (
        <div style={styles.statsRow}>
          <Skeleton width={120} height={60} />
          <Skeleton width={120} height={60} />
        </div>
      ) : (
        <div style={styles.statsRow}>
          <div style={styles.statChip}>
            {stats?.domains || 0} domains
          </div>
          <div style={styles.statChip}>
            {stats?.notes || 0} notes
          </div>
        </div>
      )}

      <Link to="/generate" style={styles.generateButton}>
        {LABELS.tests.startAttempt}
      </Link>

      <Link to="/review-due" style={styles.reviewLinkCard}>
        <div style={styles.reviewLinkTitle}>Review Calendar</div>
        <div style={styles.reviewLinkText}>
          Track due reviews and weak areas from test performance.
        </div>
      </Link>

      <div>
        <h2 style={styles.sectionHeader}>Recent Tests</h2>
        
        {testsError ? (
          <div style={styles.errorContainer}>
            <div>{LABELS.error.generic}</div>
            <button style={styles.retryButton} onClick={() => refetchTests()}>
              {LABELS.error.retry}
            </button>
          </div>
        ) : testsLoading ? (
          <div>
            <Skeleton count={5} height={40} />
          </div>
        ) : !recentTests || recentTests.length === 0 ? (
          <div style={{ ...styles.testRow, cursor: 'default' }}>
            {LABELS.empty.tests}
          </div>
        ) : (
          recentTests.map((test) => (
            <Link
              key={test.id}
              to={`/tests/${test.id}`}
              style={styles.testRow}
            >
              <span>{test.name || test.domain?.name || test.domain}</span>
              <div style={{ display: 'flex', gap: SPACE.md, alignItems: 'center' }}>
                <Badge difficulty={test.difficulty} />
                <span>{test.questionCount} questions</span>
                <span>{formatDate(test.createdAt)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
