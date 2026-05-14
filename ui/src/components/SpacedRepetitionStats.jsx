import { useQuery } from '@tanstack/react-query';
import { getUserStats } from '../api/spacedRepetition';
import Skeleton from './Skeleton';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
  container: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
  },
  header: {
    marginBottom: SPACE.lg,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    marginBottom: SPACE.xs,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.lg,
    fontWeight: 600,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACE.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.md,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACE.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    transition: 'width 0.3s ease',
  },
  entityBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
  },
  entityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.sm,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    border: `1px solid ${COLORS.border}`,
  },
  entityName: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  entityCount: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.accent,
  },
  priorityDistribution: {
    display: 'flex',
    gap: SPACE.sm,
    flexWrap: 'wrap',
  },
  priorityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  priorityLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
  },
  priorityCount: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    color: COLORS.text,
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    padding: SPACE.lg,
  },
};

function getPriorityColor(priority) {
  switch (priority) {
    case 'critical': return COLORS.error;
    case 'high': return COLORS.diffHard;
    case 'medium': return COLORS.diffMedium;
    case 'low': return COLORS.diffEasy;
    default: return COLORS.muted;
  }
}

function getRetentionColor(strength) {
  if (strength >= 2.5) return COLORS.success;
  if (strength >= 1.5) return COLORS.diffEasy;
  if (strength >= 1.0) return COLORS.diffMedium;
  return COLORS.diffHard;
}

export default function SpacedRepetitionStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['spaced-repetition-stats'],
    queryFn: () => getUserStats(),
    retry: (failureCount, error) => {
      // Don't retry on 404 or 500 errors (API not implemented yet or server issues)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check if API is unavailable (404 or 500 error)
  const isAPIUnavailable = error?.message?.includes('404') || error?.message?.includes('Not Found') ||
                          error?.message?.includes('500') || error?.message?.includes('Internal Server Error');

  if (isAPIUnavailable) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Statistics</h2>
        </div>
        <div style={styles.emptyState}>
          <div style={{ marginBottom: SPACE.md }}>
            <strong>Learning Statistics</strong>
          </div>
          <div style={{ marginBottom: SPACE.md }}>
            Detailed statistics will be available once the spaced repetition system is implemented.
          </div>
          <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
            Continue taking tests to build your learning profile!
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Statistics</h2>
        </div>
        <div style={styles.emptyState}>
          Failed to load statistics
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Statistics</h2>
        </div>
        <Skeleton count={4} height={60} />
      </div>
    );
  }

  const retentionColor = getRetentionColor(stats?.avgRetentionStrength || 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Learning Statistics</h2>
      </div>

      {/* Core Performance Metrics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Average Score</div>
          <div style={styles.statValue}>{stats?.avgScore?.toFixed(1)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${stats?.avgScore || 0}%`,
                backgroundColor: stats?.avgScore >= 70 ? COLORS.success : 
                              stats?.avgScore >= 50 ? COLORS.diffMedium : COLORS.error,
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Weighted Score</div>
          <div style={styles.statValue}>{stats?.avgWeightedScore?.toFixed(1)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${stats?.avgWeightedScore || 0}%`,
                backgroundColor: stats?.avgWeightedScore >= 70 ? COLORS.success : 
                              stats?.avgWeightedScore >= 50 ? COLORS.diffMedium : COLORS.error,
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Retention Strength</div>
          <div style={{...styles.statValue, color: retentionColor}}>
            {stats?.avgRetentionStrength?.toFixed(2)}
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min((stats?.avgRetentionStrength || 0) * 25, 100)}%`,
                backgroundColor: retentionColor,
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Reviews</div>
          <div style={styles.statValue}>{stats?.totalReviews || 0}</div>
          <div style={{ fontSize: SIZE.xs, color: COLORS.muted, marginTop: SPACE.xs }}>
            {stats?.totalLapses || 0} lapses
          </div>
        </div>
      </div>

      {/* Entity Breakdown */}
      {stats?.entitiesByType && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Entity Breakdown</h3>
          <div style={styles.entityBreakdown}>
            {Object.entries(stats.entitiesByType).map(([type, count]) => (
              <div key={type} style={styles.entityItem}>
                <span style={styles.entityName}>{type}</span>
                <span style={styles.entityCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Distribution */}
      {stats?.priorityDistribution && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Priority Distribution</h3>
          <div style={styles.priorityDistribution}>
            {Object.entries(stats.priorityDistribution).map(([priority, count]) => (
              <div key={priority} style={styles.priorityItem}>
                <div 
                  style={{
                    ...styles.priorityDot,
                    backgroundColor: getPriorityColor(priority),
                  }}
                />
                <span style={styles.priorityLabel}>{priority}</span>
                <span style={styles.priorityCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Performance Insights</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Success Rate</div>
            <div style={styles.statValue}>
              {stats?.totalReviews > 0 
                ? ((stats?.totalReviews - (stats?.totalLapses || 0)) / stats?.totalReviews * 100).toFixed(1)
                : '0'}%
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Lapse Rate</div>
            <div style={styles.statValue}>
              {stats?.totalReviews > 0 
                ? ((stats?.totalLapses || 0) / stats?.totalReviews * 100).toFixed(1)
                : '0'}%
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Learning Efficiency</div>
            <div style={styles.statValue}>
              {stats?.avgRetentionStrength >= 2.0 ? 'Excellent' :
               stats?.avgRetentionStrength >= 1.5 ? 'Good' :
               stats?.avgRetentionStrength >= 1.0 ? 'Fair' : 'Needs Work'}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!stats && (
        <div style={styles.emptyState}>
          No statistics available. Take some tests to see your learning progress!
        </div>
      )}
    </div>
  );
}
