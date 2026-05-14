import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/tests';
import { getAttemptStats } from '../api/attempts';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { COLORS, FONTS, SPACE, SIZE, LABELS } from '../constants';

const styles = {
  container: {
    padding: `${SPACE.lg}px`,
  },
  section: {
    marginBottom: SPACE.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    margin: `${SPACE.xl}px 0`,
  },
  statChipsRow: {
    display: 'flex',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: SPACE.md,
    textAlign: 'center',
  },
  statChipLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    textTransform: 'uppercase',
    marginBottom: SPACE.xs,
  },
  statChipValue: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
  },
  sectionTitle: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.xl,
    color: COLORS.text,
    marginBottom: SPACE.lg,
  },
  chartContainer: {
    marginBottom: SPACE.lg,
  },
  domainChartRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.sm,
  },
  domainChartLabel: {
    width: 120,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    transition: 'width 0.4s ease',
  },
  barCountLabel: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
    minWidth: 60,
  },
  difficultyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
  },
  difficultyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  difficultyCount: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.text,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    padding: SPACE.md,
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    marginBottom: SPACE.lg,
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
  emptyState: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    color: COLORS.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: SPACE.lg,
  },
};

// Score distribution colors for the gradient
const SCORE_COLORS = [COLORS.error, COLORS.diffMedium, COLORS.diffEasy, COLORS.success];

function roundToOneDecimal(num) {
  return Math.round(num * 10) / 10;
}

function formatTime(seconds) {
  return `${Math.round(seconds)}s`;
}

function formatPercentage(num) {
  return `${Math.round(num)}%`;
}

export default function Statistics() {
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats
  });


  const { 
    data: attemptStats, 
    isLoading: attemptStatsLoading, 
    error: attemptStatsError, 
    refetch: refetchAttemptStats 
  } = useQuery({
    queryKey: ['attempt-stats'],
    queryFn: getAttemptStats
  });


  const renderError = (error, refetch) => (
    <div style={styles.errorContainer}>
      <div>{LABELS.error.generic}</div>
      <button style={styles.retryButton} onClick={refetch}>
        {LABELS.error.retry}
      </button>
    </div>
  );

  const renderLoadingChips = () => (
    <div style={styles.statChipsRow}>
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />
    </div>
  );

  const renderLoadingChart = () => (
    <div style={styles.chartContainer}>
      <Skeleton height={12} count={5} />
    </div>
  );

  const renderEmptyState = (message) => (
    <div style={styles.emptyState}>
      {message}
    </div>
  );

  // Section 1 - Test Statistics
  const renderTestStats = () => {
    if (statsError) {
      return renderError(statsError, refetchStats);
    }

    if (statsLoading) {
      return (
        <>
          {renderLoadingChips()}
          {renderLoadingChart()}
        </>
      );
    }

    if (!stats || Object.keys(stats).length === 0) {
      return renderEmptyState('No test statistics available');
    }

    // Calculate derived stats using actual API response structure
    const totalTests = stats.totalTests || 0;
    const totalQuestions = stats.totalQuestions || 0;
    const avgQuestionsPerTest = stats.avgQuestionsPerTest || 0;
    const mostActiveDomain = stats.domains?.[0] || 'N/A';

    // Domain breakdown - create from domains array
    const domainBreakdown = (stats.domains || []).map(domain => ({
      name: domain,
      count: 1 // We don't have count data, so show each domain once
    }));
    const maxDomainCount = Math.max(...domainBreakdown.map(d => d.count || 0), 1);

    // Difficulty breakdown - create from difficulties array
    const difficultyBreakdown = {};
    (stats.difficulties || []).forEach(difficulty => {
      difficultyBreakdown[difficulty] = (difficultyBreakdown[difficulty] || 0) + 1;
    });

    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Test Statistics</h2>
        
        {/* Stat chips */}
        <div style={styles.statChipsRow}>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Total Tests</div>
            <div style={styles.statChipValue}>{totalTests}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Total Questions</div>
            <div style={styles.statChipValue}>{totalQuestions}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Most Active Domain</div>
            <div style={styles.statChipValue}>{mostActiveDomain}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Avg Questions/Test</div>
            <div style={styles.statChipValue}>{avgQuestionsPerTest}</div>
          </div>
        </div>

        {/* Domain breakdown chart */}
        {domainBreakdown.length > 0 && (
          <div style={styles.chartContainer}>
            <h3 style={styles.sectionTitle}>Domain Breakdown</h3>
            {domainBreakdown.map((domain, index) => (
              <div key={index} style={styles.domainChartRow}>
                <div style={styles.domainChartLabel}>{domain.name}</div>
                <div style={styles.barTrack}>
                  <div 
                    style={{
                      ...styles.barFill,
                      backgroundColor: COLORS.accent,
                      width: `${(domain.count / maxDomainCount) * 100}%`
                    }}
                  />
                </div>
                <div style={styles.barCountLabel}>{domain.count} tests</div>
              </div>
            ))}
          </div>
        )}

        {/* Difficulty breakdown */}
        {Object.keys(difficultyBreakdown).length > 0 && (
          <div style={styles.chartContainer}>
            <h3 style={styles.sectionTitle}>Difficulty Breakdown</h3>
            <div style={styles.difficultyRow}>
              {['easy', 'medium', 'hard', 'mixed'].map(difficulty => (
                <div key={difficulty} style={styles.difficultyItem}>
                  <Badge difficulty={difficulty} />
                  <span style={styles.difficultyCount}>{difficultyBreakdown[difficulty] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Section 2 - Attempt Statistics
  const renderAttemptStats = () => {
    if (attemptStatsError) {
      return renderError(attemptStatsError, refetchAttemptStats);
    }

    if (attemptStatsLoading) {
      return (
        <>
          {renderLoadingChips()}
          {renderLoadingChart()}
        </>
      );
    }

    if (!attemptStats || Object.keys(attemptStats).length === 0) {
      return renderEmptyState('No attempt statistics available');
    }

    // Calculate derived stats from unified attempt stats API
    const totalAttempts = attemptStats.totalAttempts || 0;
    const avgScore = attemptStats.averageScore ? formatPercentage(attemptStats.averageScore) : 'N/A';
    const vaultItemCount = attemptStats.vaultItemCount || 0;
    const avgRetention = attemptStats.averageRetention != null
      ? roundToOneDecimal(attemptStats.averageRetention)
      : 'N/A';

    // Score distribution - this will need to be updated based on actual API response
    const scoreDistribution = attemptStats.scoreDistribution || [];
    const maxScoreCount = Math.max(...scoreDistribution.map(d => d.count || 0), 1);

    return (
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Attempt Statistics</h2>
        
        {/* Stat chips */}
        <div style={styles.statChipsRow}>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Total Attempts</div>
            <div style={styles.statChipValue}>{totalAttempts}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Average Score</div>
            <div style={styles.statChipValue}>{avgScore}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Vault Items</div>
            <div style={styles.statChipValue}>{vaultItemCount}</div>
          </div>
          <div style={styles.statChip}>
            <div style={styles.statChipLabel}>Avg Retention</div>
            <div style={styles.statChipValue}>{avgRetention !== 'N/A' ? `${avgRetention}/10` : 'N/A'}</div>
          </div>
        </div>

        {/* Score distribution chart */}
        {scoreDistribution.length > 0 && (
          <div style={styles.chartContainer}>
            <h3 style={styles.sectionTitle}>Score Distribution</h3>
            {scoreDistribution.map((bucket, index) => (
              <div key={index} style={styles.domainChartRow}>
                <div style={styles.domainChartLabel}>{bucket.range}</div>
                <div style={styles.barTrack}>
                  <div 
                    style={{
                      ...styles.barFill,
                      backgroundColor: SCORE_COLORS[index] || COLORS.accent,
                      width: `${(bucket.count / maxScoreCount) * 100}%`
                    }}
                  />
                </div>
                <div style={styles.barCountLabel}>{bucket.count} attempts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {renderTestStats()}
      
      <div style={styles.sectionDivider} />
      
      {renderAttemptStats()}
    </div>
  );
}