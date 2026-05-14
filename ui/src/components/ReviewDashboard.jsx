import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReviewSchedule, getUserStats } from '../api/spacedRepetition';
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
  reviewItem: {
    backgroundColor: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewEntity: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.sm,
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: SPACE.xs,
  },
  reviewMeta: {
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    color: COLORS.muted,
  },
  priorityBadge: {
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    borderRadius: 4,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    fontWeight: 500,
    marginLeft: SPACE.md,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.bg,
    border: 'none',
    borderRadius: 4,
    padding: `${SPACE.xs}px ${SPACE.sm}px`,
    fontFamily: FONTS.mono,
    fontSize: SIZE.xs,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
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

function getPriorityColor(priorityScore) {
  if (priorityScore >= 80) return COLORS.error;
  if (priorityScore >= 60) return COLORS.diffHard;
  if (priorityScore >= 40) return COLORS.diffMedium;
  return COLORS.diffEasy;
}

function getPriorityLabel(priorityScore) {
  if (priorityScore >= 80) return 'Critical';
  if (priorityScore >= 60) return 'High';
  if (priorityScore >= 40) return 'Medium';
  return 'Low';
}

function formatDate(dateString) {
  if (!dateString) return 'No date set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(dateString) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

export default function ReviewDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['spaced-repetition-stats'],
    queryFn: () => {
      console.log('Fetching spaced repetition stats');
      return getUserStats();
    },
    retry: (failureCount, error) => {
      console.log('Stats query retry:', { failureCount, error: error?.message });
      // Don't retry on 404 or 500 errors (API not implemented yet or server issues)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.log('Stats query error:', error);
    }
  });

  const { data: schedule, isLoading: scheduleLoading, error: scheduleError } = useQuery({
    queryKey: ['spaced-repetition-schedule'],
    queryFn: () => {
      console.log('Fetching spaced repetition schedule');
      return getReviewSchedule(10);
    },
    retry: (failureCount, error) => {
      console.log('Schedule query retry:', { failureCount, error: error?.message });
      // Don't retry on 404 or 500 errors (API not implemented yet or server issues)
      if (error?.message?.includes('404') || error?.message?.includes('Not Found') ||
          error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.log('Schedule query error:', error);
    }
  });

  // Check if both APIs are unavailable (404 or 500 errors)
  const isAPIUnavailable = 
    ((statsError?.message?.includes('404') || statsError?.message?.includes('Not Found') ||
      statsError?.message?.includes('500') || statsError?.message?.includes('Internal Server Error')) &&
     (scheduleError?.message?.includes('404') || scheduleError?.message?.includes('Not Found') ||
      scheduleError?.message?.includes('500') || scheduleError?.message?.includes('Internal Server Error'))) ||
    // Also check if either API has a 500 error (server issues)
    (statsError?.message?.includes('500') || statsError?.message?.includes('Internal Server Error') ||
     scheduleError?.message?.includes('500') || scheduleError?.message?.includes('Internal Server Error'));

  if (isAPIUnavailable) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Progress</h2>
        </div>
        <div style={styles.emptyState}>
          <div style={{ marginBottom: SPACE.md }}>
            <strong>Spaced Repetition System</strong>
          </div>
          <div style={{ marginBottom: SPACE.md }}>
            The spaced repetition learning system is coming soon! This feature will help you:
          </div>
          <ul style={{ textAlign: 'left', fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.muted }}>
            <li>Track your learning progress over time</li>
            <li>Get personalized review schedules</li>
            <li>Focus on areas that need improvement</li>
            <li>Optimize your study time with smart scheduling</li>
          </ul>
          <div style={{ marginTop: SPACE.md, color: COLORS.accent }}>
            Keep taking tests to build your learning history!
          </div>
        </div>
      </div>
    );
  }

  if (statsError || scheduleError) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Progress</h2>
        </div>
        <div style={styles.emptyState}>
          Failed to load spaced repetition data
        </div>
      </div>
    );
  }

  if (statsLoading || scheduleLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Learning Progress</h2>
        </div>
        <Skeleton count={3} height={60} />
      </div>
    );
  }

  const dueCount = schedule?.due?.length || 0;
  const upcomingCount = schedule?.upcoming?.length || 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Learning Progress</h2>
        <div style={{ fontFamily: FONTS.mono, fontSize: SIZE.sm, color: COLORS.muted }}>
          {dueCount} due now
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Average Score</div>
            <div style={styles.statValue}>{stats.avgScore?.toFixed(1)}%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Reviews</div>
            <div style={styles.statValue}>{stats.totalReviews || 0}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Retention Strength</div>
            <div style={styles.statValue}>{stats.avgRetentionStrength?.toFixed(2)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Lapses</div>
            <div style={styles.statValue}>{stats.totalLapses || 0}</div>
          </div>
        </div>
      )}

      {/* Due Reviews */}
      {schedule?.due && schedule.due.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Due Now ({schedule.due.length})</h3>
          {schedule.due.map((item) => (
            <div key={item.id} style={styles.reviewItem}>
              <div style={styles.reviewInfo}>
                <div style={styles.reviewEntity}>
                  {item.entityType}: {item.entityId}
                </div>
                <div style={styles.reviewMeta}>
                  Score: {item.avgScore?.toFixed(1)}% | 
                  Streak: {item.streak || 0} | 
                  Reviewed: {formatDate(item.lastReviewedAt)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                <span
                  style={{
                    ...styles.priorityBadge,
                    backgroundColor: `${getPriorityColor(item.priorityScore)}20`,
                    color: getPriorityColor(item.priorityScore),
                    border: `1px solid ${getPriorityColor(item.priorityScore)}40`,
                  }}
                >
                  {getPriorityLabel(item.priorityScore)}
                </span>
                <button style={styles.actionButton}>
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Reviews */}
      {schedule?.upcoming && schedule.upcoming.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Upcoming ({schedule.upcoming.length})</h3>
          {schedule.upcoming.map((item) => (
            <div key={item.id} style={styles.reviewItem}>
              <div style={styles.reviewInfo}>
                <div style={styles.reviewEntity}>
                  {item.entityType}: {item.entityId}
                </div>
                <div style={styles.reviewMeta}>
                  Score: {item.avgScore?.toFixed(1)}% | 
                  Next: {formatDate(item.nextReviewAt)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                <span
                  style={{
                    ...styles.priorityBadge,
                    backgroundColor: `${getPriorityColor(item.priorityScore)}20`,
                    color: getPriorityColor(item.priorityScore),
                    border: `1px solid ${getPriorityColor(item.priorityScore)}40`,
                  }}
                >
                  {getPriorityLabel(item.priorityScore)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {(!schedule?.due || schedule.due.length === 0) && 
       (!schedule?.upcoming || schedule.upcoming.length === 0) && (
        <div style={styles.emptyState}>
          No reviews scheduled. Take a test to get started!
        </div>
      )}
    </div>
  );
}
