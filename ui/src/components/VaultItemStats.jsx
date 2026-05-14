import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVaultStats } from '../api/vaultSpacedRepetition';
import Skeleton from './Skeleton';
import { COLORS, FONTS, SIZE, SPACE } from '../constants';

const styles = {
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
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: SIZE.lg,
    color: COLORS.text,
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  statCard: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
  },
  statCardTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
  },
  statLabel: {
    color: COLORS.muted,
  },
  statValue: {
    fontWeight: 500,
    color: COLORS.text,
  },
  progressSection: {
    marginBottom: SPACE.lg,
  },
  progressTitle: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  progressBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
  },
  progressBar: {
    marginBottom: SPACE.sm,
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
  },
  progressLabelText: {
    color: COLORS.muted,
  },
  progressLabelValue: {
    fontWeight: 500,
    color: COLORS.text,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    transition: 'width 0.3s ease',
  },
  hierarchyInfo: {
    backgroundColor: COLORS.bg,
    padding: SPACE.md,
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.text,
  },
  hierarchyItem: {
    marginBottom: SPACE.xs,
  },
  hierarchyLabel: {
    color: COLORS.muted,
  },
  hierarchyValue: {
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.muted,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontStyle: 'italic',
    padding: SPACE.lg,
  },
  errorState: {
    textAlign: 'center',
    color: COLORS.error,
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    padding: SPACE.lg,
  },
};

function formatDate(dateString) {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getScoreColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.diffEasy;
  if (score >= 40) return COLORS.diffMedium;
  return COLORS.diffHard;
}

function getRetentionColor(strength) {
  if (strength >= 2.5) return COLORS.success;
  if (strength >= 1.5) return COLORS.diffEasy;
  if (strength >= 1.0) return COLORS.diffMedium;
  return COLORS.diffHard;
}

export default function VaultItemStats({ vaultId }) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['vault-stats', vaultId],
    queryFn: () => getVaultStats(vaultId),
    enabled: !!vaultId,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 500 errors (API not implemented yet or server issues)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check if API is unavailable
  const isAPIUnavailable = error?.message?.includes('404') || error?.message?.includes('Not Found') ||
                          error?.message?.includes('500') || error?.message?.includes('Internal Server Error');

  if (isAPIUnavailable) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Vault Statistics</h2>
        </div>
        <div style={styles.emptyState}>
          <div style={{ marginBottom: SPACE.md }}>
            <strong>Vault Statistics</strong>
          </div>
          <div style={{ marginBottom: SPACE.md }}>
            Detailed statistics will be available once the vault learning system is implemented.
          </div>
          <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
            Take tests on vault items to build learning statistics!
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Vault Statistics</h2>
        </div>
        <div style={styles.errorState}>
          Failed to load vault statistics
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Vault Statistics</h2>
        </div>
        <Skeleton count={3} height={60} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Vault Statistics</h2>
        </div>
        <div style={styles.emptyState}>
          No statistics available for this vault item
        </div>
      </div>
    );
  }

  const { hierarchy, spacedRepetitionStats, vaultInfo } = stats;
  const aggregateStats = !spacedRepetitionStats ? stats : null;

  // Resolve display values: prefer vaultInfo (new API), fall back to hierarchy (legacy)
  const displayDomain = vaultInfo?.domain || hierarchy?.domainId || stats.domainId || null;
  const displaySection = vaultInfo?.section || hierarchy?.sectionId || stats.sectionId || null;
  const displayMaterial = hierarchy?.materialId || stats.vaultId || null;
  const displayPath = vaultInfo?.path || null;
  const displayFolders = vaultInfo?.folders || null;
  const displayTitle = vaultInfo?.title || null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Vault Statistics</h2>
        {displayTitle && (
          <p style={{ fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.muted, margin: `${SPACE.xs}px 0 0` }}>
            {displayTitle}
          </p>
        )}
      </div>

      {/* Vault Location Info */}
      {(displayDomain || displaySection || displayPath) && (
        <div style={styles.hierarchyInfo}>
          {displayDomain && (
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyLabel}>Domain: </span>
              <span style={styles.hierarchyValue}>{displayDomain}</span>
            </div>
          )}
          {displaySection && (
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyLabel}>Section: </span>
              <span style={styles.hierarchyValue}>{displaySection}</span>
            </div>
          )}
          {displayMaterial && (
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyLabel}>Material: </span>
              <span style={styles.hierarchyValue}>{displayMaterial}</span>
            </div>
          )}
          {displayPath && (
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyLabel}>Path: </span>
              <span style={{ ...styles.hierarchyValue, color: COLORS.muted, fontWeight: 400 }}>{displayPath}</span>
            </div>
          )}
          {displayFolders && displayFolders.length > 0 && (
            <div style={{ ...styles.hierarchyItem, marginTop: SPACE.xs, display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
              {displayFolders.map((folder, i) => (
                <span key={i} style={{
                  backgroundColor: `${COLORS.accent}15`,
                  color: COLORS.accent,
                  border: `1px solid ${COLORS.accent}40`,
                  borderRadius: 3,
                  padding: `1px 6px`,
                  fontSize: SIZE.xs,
                  fontFamily: FONTS.mono,
                }}>
                  {folder}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {aggregateStats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statCardTitle}>Attempts</h3>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Attempts:</span>
              <span style={styles.statValue}>{aggregateStats.totalAttempts || 0}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Average Score:</span>
              <span style={{ ...styles.statValue, color: getScoreColor(aggregateStats.avgScore || 0) }}>
                {aggregateStats.avgScore ?? 0}%
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Best Score:</span>
              <span style={{ ...styles.statValue, color: getScoreColor(aggregateStats.bestScore || 0) }}>
                {aggregateStats.bestScore ?? 0}%
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Last Attempt:</span>
              <span style={styles.statValue}>{formatDate(aggregateStats.lastAttemptAt)}</span>
            </div>
          </div>
        </div>
      )}

      {spacedRepetitionStats && (
        <>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statCardTitle}>Performance</h3>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Average Score:</span>
            <span style={{ ...styles.statValue, color: getScoreColor(spacedRepetitionStats.avgScore) }}>
              {spacedRepetitionStats.avgScore}%
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Weighted Score:</span>
            <span style={{ ...styles.statValue, color: getScoreColor(spacedRepetitionStats.weightedScore) }}>
              {spacedRepetitionStats.weightedScore}%
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Review Count:</span>
            <span style={styles.statValue}>{spacedRepetitionStats.reviewCount}</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statCardTitle}>Memory Strength</h3>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Retention:</span>
            <span style={{ ...styles.statValue, color: getRetentionColor(spacedRepetitionStats.retentionStrength) }}>
              {spacedRepetitionStats.retentionStrength.toFixed(2)}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Streak:</span>
            <span style={styles.statValue}>{spacedRepetitionStats.streak}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Lapses:</span>
            <span style={styles.statValue}>{spacedRepetitionStats.lapseCount}</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statCardTitle}>Scheduling</h3>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Priority:</span>
            <span style={styles.statValue}>{spacedRepetitionStats.priorityScore}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Last Review:</span>
            <span style={styles.statValue}>{formatDate(spacedRepetitionStats.lastReviewedAt)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Next Review:</span>
            <span style={styles.statValue}>{formatDate(spacedRepetitionStats.nextReviewAt)}</span>
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div style={styles.progressSection}>
        <h3 style={styles.progressTitle}>Progress Indicators</h3>
        <div style={styles.progressBars}>
          <div style={styles.progressBar}>
            <div style={styles.progressLabel}>
              <span style={styles.progressLabelText}>Average Score</span>
              <span style={styles.progressLabelValue}>{spacedRepetitionStats.avgScore}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${spacedRepetitionStats.avgScore}%`,
                  backgroundColor: getScoreColor(spacedRepetitionStats.avgScore),
                }}
              />
            </div>
          </div>

          <div style={styles.progressBar}>
            <div style={styles.progressLabel}>
              <span style={styles.progressLabelText}>Retention Strength</span>
              <span style={styles.progressLabelValue}>{spacedRepetitionStats.retentionStrength.toFixed(2)}/10</span>
            </div>
            <div style={styles.progressTrack}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${(spacedRepetitionStats.retentionStrength / 10) * 100}%`,
                  backgroundColor: getRetentionColor(spacedRepetitionStats.retentionStrength),
                }}
              />
            </div>
          </div>

          <div style={styles.progressBar}>
            <div style={styles.progressLabel}>
              <span style={styles.progressLabelText}>Priority Score</span>
              <span style={styles.progressLabelValue}>{spacedRepetitionStats.priorityScore}</span>
            </div>
            <div style={styles.progressTrack}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${Math.min((spacedRepetitionStats.priorityScore / 100) * 100, 100)}%`,
                  backgroundColor: spacedRepetitionStats.priorityScore >= 50 ? COLORS.error :
                                 spacedRepetitionStats.priorityScore >= 25 ? COLORS.diffHard :
                                 COLORS.success,
                }}
              />
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
